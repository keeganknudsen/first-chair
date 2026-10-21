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

## Why this schema

v1 has one table, `posts`:

```sql
CREATE TABLE posts (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title      text NOT NULL,
  slug       text NOT NULL UNIQUE
             CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  body_md    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**`id` is an identity column, and gaps are fine.** Postgres assigns ids automatically. My first seeded posts got ids 4–6 because my constraint tests used up 1–3, and re-running the seed upsert quietly reserved more. Postgres never reuses ids, even after failed inserts or deletes, because keeping them gap-free would slow down concurrent writes. An id only needs to be unique, not sequential. One issue: `pg` returns `bigint` as a string, since JavaScript numbers can't safely hold every `bigint` value, so ids are typed as `string` in my code.

**URLs use slugs, not ids.** `/posts/opening-day` is readable and stays meaningful, while `/posts/4` exposes an internal number. `UNIQUE` guarantees two posts can't share a URL, and Postgres automatically creates an index for unique columns, which makes the detail page's `WHERE slug = $1` lookup fast.

**The database enforces the rules, not just my code.** Every column is `NOT NULL`, and a `CHECK` constraint requires slugs to be lowercase letters, numbers, and single hyphens. I tested both by trying to insert a duplicate slug and a slug like `Bad Slug!`, and Postgres rejected them. Validation in the app can have bugs; constraints are the last line of defense.

**`text`, not `varchar(255)`.** In Postgres they perform the same, and `text` avoids an arbitrary length limit. Reasonable length limits will come from validation in v2.

**`timestamptz` for dates.** It stores an exact moment in time, which avoids the time zone confusion of plain `timestamp`. Time zones still bit me on the display side: my seed dates are midnight UTC, so the browser showed them a day early in Pacific time until I formatted them with `timeZone: 'UTC'`. `DEFAULT now()` only applies on insert, so updates have to set `updated_at = now()` themselves.

**Markdown is stored raw.** `body_md` holds the Markdown as written, and the client renders it with `react-markdown`. Storing the source rather than generated HTML means I can change how posts render without touching the data, and rendering on the client with a library that escapes raw HTML keeps it safe from XSS.

**The list endpoint skips the body.** `GET /api/posts` selects only titles, slugs, and dates. The list page doesn't need full posts, and sending every body would get slower with every post I write.

**Schema changes go through migrations.** The table is created by `migrations/001_create_posts.sql`, applied by a small runner I wrote. It records applied migrations in a `schema_migrations` table and runs each one inside a transaction, so a failure rolls back cleanly. When a typo in the runner's `INSERT` made it fail, the rollback undid the `CREATE TABLE` too, so nothing was left half-applied. Applied migrations never get edited; changes go in new numbered files.

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

### v1

**TypeScript can't check SQL inside strings.** Three bugs this phase were typos in SQL strings: a missing `)` in my migration runner's `INSERT`, `SELSCT` instead of `SELECT`, and an alias written as `"updatedAT"`. TypeScript compiled all of them because, to it, they're just text. The first two failed loudly at runtime. The alias was worse: the query worked, but the field came back under the wrong name, so my code would have quietly gotten `undefined`. Query builders like Drizzle help with this in v2.

**Postgres errors say exactly where the problem is.** `position: '48'` on a "syntax error at end of input" meant the failing query was 47 characters long, which pointed straight at the one `INSERT` that length. Reading the error fields, plus the line number in the stack trace, beats guessing.

**A transaction lives on one connection.** `BEGIN`, the migration, and `COMMIT` must run on the same connection, so the runner checks one out with `pool.connect()` instead of using `pool.query`, which might pick a different connection for each call. The connection gets released in `finally`, because forgetting to release slowly drains the pool.

**Seeds should be safe to re-run.** Migrations change the schema and run once per database. Seeds insert data and can run anytime, so mine uses `INSERT ... ON CONFLICT (slug) DO UPDATE`. Running it twice still leaves exactly one copy of each post.

**npm and Node both search parent folders.** My Vercel build failed with "Cannot find module 'react-markdown'" even though everything worked locally. I'd accidentally installed it from my home folder at some point, creating `~/package.json` and `~/node_modules`. When the client couldn't find the package in its own `node_modules`, Node kept looking up the folder tree and found it in my home folder. Vercel only has the repo, so the build failed there. The clue was `npm run build` at my repo root saying "Missing script" instead of "no package.json," and `npm prefix` confirmed it. Takeaways: check my terminal prompt before running `npm install`, and run `npm run build` locally before pushing.

**Narrowing catches dead code.** After early returns for `loading`, `not-found`, and `error`, TypeScript knows only `loaded` is left. When I accidentally kept two not-found checks, it flagged the second one as impossible. Discriminated unions let TypeScript track which states are still possible on every line.

**SQL injection and XSS are different attacks.** SQL injection targets the database by mixing input into a query; parameterized queries (`$1`) prevent it, and a slug like `x' OR '1'='1` just returns a 404. XSS targets visitors' browsers by getting content rendered as code; `react-markdown` prevents it by building React elements and escaping raw HTML. I tested both. The rule for later: never add `rehype-raw` for user content.

**Single-page apps need a rewrite on Vercel.** Refreshing `/posts/opening-day` asks Vercel for a file at that path, which doesn't exist. A rewrite in `vercel.json` serves `index.html` for every path so React Router can handle it. The tradeoff is "soft 404s": unknown pages show a Not Found message but return a 200 status.

**Express middleware order matters.** Requests flow through middleware top to bottom, so the catch-all 404 goes after every route, and the error handler goes last. Express recognizes an error handler by its four parameters, which is why `_next` has to be there even though it's unused.

**Effects need the right dependencies.** The post page's effect depends on `[slug]`, so navigating from one post to another refetches. With `[]`, the URL would change but the old post would stay on screen.

**Git paths are relative to the current folder.** `git add server ROADMAP.md` failed from inside `server/`, because Git looked for `server/server`. Running Git from the repo root keeps paths predictable.