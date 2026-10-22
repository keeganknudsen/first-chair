# CLAUDE.md

## What this project is

A fullstack ski trip blog. I'm building it to **learn fullstack development**, so understanding matters more than speed. The phased plan lives in `ROADMAP.md`; read it at the start of a session to see where things stand.

## How to help me

- **Teach, don't just do.** Explain the reasoning behind a change, especially anything new to me (auth, SQL, caching, deployment).
- **Keep changes small and reviewable.** Prefer one focused change at a time over large multi-file rewrites.
- **Ask before writing large chunks of code.** If a task needs more than ~50 lines or touches several files, outline the approach first and let me decide whether to write it myself.
- **Stay in the current phase.** Don't add features, libraries, or abstractions from later phases unless I ask. If something from a later phase would help, mention it instead.
- **Point me to docs.** When introducing a library or API, link the relevant official documentation.
- **Don't check off ROADMAP.md items.** I'll do that myself when I understand what was built.
- **Flag tradeoffs and mistakes honestly**, including in code I wrote.

## Stack

- **Client:** React, Vite, TypeScript, React Router (`/client`)
- **Server:** Node, Express, TypeScript (`/server`)
- **Database:** PostgreSQL. Raw SQL via `node-postgres` through v1; Drizzle from v2 on.
- **Validation:** Zod, with schemas shared between client and server (from v2)
- **Local dev:** Postgres runs in Docker via `docker-compose.yml`
- **Hosting:** Vercel (client), Render (API), Neon (database)
- **Later phases:** Cloudflare R2 (images), Open-Meteo (conditions), Leaflet (maps), Vitest and Playwright (tests), GitHub Actions (CI)

## Repo layout

```
/client          React app
/server          Express API                 
/server/migrations  SQL migrations
/shared             Code used by both client and server (@first-chair/shared)
/shared/src         Zod schemas and inferred types
docker-compose.yml  Local Postgres
ROADMAP.md       Phased plan and checklist
CLAUDE.md        This file
```

Folders appear as phases need them; not all exist yet.

## Commands

Run everything from the repo root unless noted.

```bash
docker compose up -d                      # start Postgres
npm install                               # install all workspaces
npm install <pkg> -w client               # add a dependency to one workspace
npm run dev -w server                     # API on http://localhost:3000
npm run dev -w client                     # client on http://localhost:5173
npm run dev -w @first-chair/shared        # rebuild shared on save (when editing schemas)
npm run build -w server                   # build server (builds shared first)
npm run build -w client                   # build client (builds shared first)
npm run migrate -w server                 # apply database migrations
npm run seed -w server                    # seed posts
```

Update this section if the scripts change.

## Conventions

- TypeScript everywhere, `strict` mode on.
- REST endpoints under `/api`, plural nouns (`/api/posts`), correct HTTP status codes.
- Database columns in `snake_case`, TypeScript in `camelCase`.
- Every schema change goes through a migration file, never manual edits to the database.
- Validate all input on the server, even when the client validates too.
- Small commits with clear messages in the imperative ("Add posts migration").
- Install dependencies from the repo root with `-w <workspace>`. Never run `npm install` in a folder without a `package.json`.
- Request and response shapes live in `shared` as Zod schemas. Derive types with `z.infer` instead of writing them by hand.
- The server validates request bodies with `safeParse`; the client validates API responses with `parse`.
- `shared` is compiled; `predev` and `prebuild` rebuild it, but running dev servers need a rebuild to see schema changes.

## Security rules

- **Never commit secrets.** Real values go in `.env` files, which are gitignored. Keep `.env.example` updated with variable names and fake values.
- Never hard-code API keys, passwords, or connection strings in source files.
- Use parameterized queries only; never build SQL with string concatenation.
- Never render user-submitted HTML unescaped.
