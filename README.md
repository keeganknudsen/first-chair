# First Chair
A fullstack skiing blog built with React, Express, and PostgresSQL. I am building this is phases to build my knowledge fullstack development. See [ROADMAP.md](ROADMAP.md) for full plan and current progress.

**Live site:** https://first-chair-bice.vercel.app


**API health check:** https://first-chair-api.onrender.com/health

## Stack

| Layer | Local | Production |
|---|---|---|
| Client | React + Vite + TypeScript | Vercel |
| API | Express + TypeScript | Render |
| Database | PostgreSQL 17 in Docker | Neon |

## Running locally

Prerequisites: Node 22 and Docker.

1. Clone the repo.
2. Copy each `.env.example` to `.env` (root, `server/`, `client/`) and fill in a local database password.
3. Start Postgres: `docker compose up -d`
4. Install dependencies: `npm install` in both `server/` and `client/`
5. Run the API: `cd server && npm run dev` (http://localhost:3000)
6. Run the client: `cd client && npm run dev` (http://localhost:5173)

## How a request flows

**1. The browser downloads the app from Vercel.** When someone visits the site, Vercel sends the static files that `npm run build` produced: an `index.html` and a JavaScript bundle. There's no React server; Vercel is basically a file server. During the build, Vite replaces `import.meta.env.VITE_API_URL` with my Render URL, so the API's address is baked into the JavaScript. That's why changing `VITE_API_URL` on Vercel does nothing until I redeploy.

**2. My React code calls the API.** The code now runs in the visitor's browser. A `useEffect` fetches `/health` from Render. Since the page came from Vercel and the API is on Render, the browser treats this as a cross origin request.

**3. Express receives the request and borrows a connection from the pool.** Opening a database connection is slow, so the pool keeps a few open and lends one out per query. Keeping connections open has a catch: when I stopped Postgres to test the failure case, it killed an idle connection, and `pg` emitted an `'error'` event in the background. Nothing was listening, so Node crashed the whole server. My `try/catch` didn't help because no request was running at the time. Adding `pool.on('error', ...)` fixed it.

**4. The query goes to Neon over SSL.** The health check runs `SELECT 1`, the cheapest query that proves the database can answer. Locally, Postgres runs in Docker on my own machine, but in production the connection crosses the internet, so `sslmode=require` in the connection string encrypts it. My code is identical in both places; only `DATABASE_URL` changes.

**5. Express replies with a 200 or 503.** If the query works, it returns `{"ok":true,"db":"up"}`. If the database is down, it returns a 503 with `{"ok":false,"db":"down"}`, and logs the real error on the server without sending details to the client. When the database comes back, the pool opens fresh connections, so it recovers without restarting. Render also uses this route as its health check to decide whether a deploy succeeded.

**6. The browser checks the CORS header.** Browsers won't let JavaScript read a response from a different origin unless the server allows it. When I first connected the client, I got "Can't reach the API" even though my server terminal showed the request arrived and `curl` worked fine. CORS is a browser rule, so the server answered and the browser blocked my code from reading it. The `cors` middleware now sends `Access-Control-Allow-Origin` with the value of `CLIENT_ORIGIN`, which is my Vercel URL in production and `localhost:5173` locally. I learned the hard way that this has to be set in Render's dashboard: I first changed it in my local `.env`, which never leaves my machine, so production stayed broken and my local setup broke too.

**7. React updates the page.** Once the browser hands over the JSON, `setStatus` stores it and React re-renders: "API healthy, database up" for a 200, "database down" for a 503, or "Can't reach the API" if the fetch failed entirely. One detail: `fetch` doesn't treat a 503 as a failure. It only rejects when the request can't complete, like a CORS block or the server being unreachable.

## Lessons learned

### v0

**Background errors bypass try/catch.** When I stopped Postgres to test the 503 response, the whole server crashed instead. The pool keeps idle connections open, and when Postgres killed one, `pg` emitted an `'error'` event with no listener, which crashes Node. My `try/catch` couldn't help because no request was running. Fix: `pool.on('error', ...)`. Takeaway: test failure paths on purpose, because that's how I found this.

**CORS is a browser rule, not a server rule.** My client got "Can't reach the API" while `curl` worked fine and my server logs showed the request arriving. The server was responding; the browser was blocking my code from reading it because the response had no `Access-Control-Allow-Origin` header. Different ports count as different origins, even on localhost.

**Local `.env` files never reach production.** After deploying, I changed `CLIENT_ORIGIN` in my local `server/.env` instead of Render's dashboard. Production stayed broken and my local setup broke too. Each environment has its own config: `.env` files for my machine, dashboard settings for Render and Vercel.

**Changing `.env` requires a restart.** Neither the Express server nor Vite picks up `.env` changes while running. On Vercel, changing a `VITE_` variable requires a full redeploy, because the value is baked into the JavaScript at build time.

**Anything in the client is public.** `VITE_` variables end up in the JavaScript bundle that every visitor downloads. API URLs are fine there; secrets never are.

**Use the Network tab, not just the console.** The CORS error was hidden in my console. The Network tab shows every request, its status, and its headers, which made the problem obvious.

**Fail fast on missing config.** The server throws on startup if `DATABASE_URL` or `CLIENT_ORIGIN` is missing. That matters most for `CLIENT_ORIGIN`: if it's undefined, the `cors` package quietly allows every origin, which is the opposite of what I want.

**`fetch` doesn't fail on HTTP errors.** A 503 counts as a successful fetch. It only rejects when the request can't complete at all, like a CORS block or the server being down.

**Config files are read literally.** `npm init` added `"type": "commonjs"` after my `"type": "module"`, and since the last key wins, Node would have treated my code as CommonJS.

**TypeScript imports use `.js` extensions.** With `NodeNext` module resolution, I import `./app.js` even though the file is `app.ts`, because Node runs the compiled JavaScript and needs the real filename.

**`tsx` doesn't type-check.** It strips types and runs the code, so type errors still run in dev. That's why there's a separate `typecheck` script.

**Postgres only reads its password once.** `POSTGRES_PASSWORD` in Docker is only used when the data volume is first created. Changing it later requires resetting the volume or running `ALTER USER`.

**Pin versions to match production.** Postgres 17 in Docker to match Neon, Node 22 in `engines` to match my machine, and `@types/node` at 22 so my editor only suggests APIs that exist in the Node version I actually run.
