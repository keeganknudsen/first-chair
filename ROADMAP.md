# Roadmap

A fullstack ski trip blog, built in phases to learn fullstack development. Each phase adds a new core skill. Phases are labeled like trail difficulty: 🟢 green circle, 🟦 blue square, ◆ black diamond, ◆◆ double black, and off-piste for stretch goals.

Check items off in the same commit that completes them.

---

## 🟢 v0: Skeleton and deploy

**Goal:** Get a request flowing from browser to database and back, live on the internet.

- [ ] Create the repo with `/client` and `/server` folders, `.gitignore`, and a README stub
- [ ] Scaffold the client with Vite, React, and TypeScript
- [ ] Scaffold the server with Express and TypeScript, add `GET /health` returning `{ ok: true }`
- [ ] Run Postgres locally with `docker-compose.yml`
- [ ] Connect the server to Postgres with `node-postgres`; `/health` also reports whether the DB answered
- [ ] Fetch `/health` from the client and show the status; set up CORS and `.env` files for both apps
- [ ] Add `.env.example` files with variable names and fake values
- [ ] Deploy the database (Neon), API (Render), and client (Vercel); done when production shows a healthy status
- [ ] README: write "How a request flows" (browser → API → DB → back) in your own words

## 🟢 v1: Read-only blog

**Goal:** Real posts on real pages, with SQL you wrote yourself.

- [ ] Write the first migration: `posts` table (`id`, `title`, unique `slug`, `body_md`, `created_at`, `updated_at`)
- [ ] Seed 3–5 real trip reports
- [ ] Build `GET /api/posts` and `GET /api/posts/:slug` with raw SQL
- [ ] Add React Router with a post list page and a `/posts/:slug` page
- [ ] Render Markdown safely with `react-markdown` (raw HTML disabled)
- [ ] Return a 404 for unknown slugs in both the API and the UI
- [ ] README: write "Why this schema"

## 🟦 v2: Full CRUD

**Goal:** Write, edit, and delete posts from the browser with validation you can trust.

- [ ] Add `POST`, `PATCH`, and `DELETE /api/posts` with correct status codes (201, 204, 400, 404)
- [ ] Share Zod schemas between client and server; validate on both sides
- [ ] Build a post editor with a live Markdown preview
- [ ] Add loading, error, and empty states to every page
- [ ] Generate unique slugs from titles and handle collisions
- [ ] Move queries to Drizzle and compare the generated SQL with your raw SQL
- [ ] README: write "Validation and error handling"

## 🟦 v3: Authentication and authorization

**Goal:** Know exactly who is asking and what they're allowed to do. Build this by hand once before reaching for a library.

- [ ] Add a `users` table and hash passwords with bcrypt
- [ ] Build sign up, log in, and log out with session cookies (`httpOnly`, `Secure`, `SameSite=Lax`)
- [ ] Write auth middleware and add `author_id` to posts
- [ ] Enforce on the server that only the author or an admin can edit or delete a post
- [ ] Protect client routes and redirect to log in
- [ ] Add CSRF protection for state-changing requests
- [ ] README: write "Authentication vs. authorization" with a diagram of the login flow

## ◆ v4: Relational data and social features

**Goal:** Joins, indexes, and pagination that hold up with real data.

- [ ] Add tags with a `post_tags` join table and filter posts by tag
- [ ] Add comments on posts
- [ ] Add likes with a unique `(user_id, post_id)` constraint
- [ ] Build author profile pages
- [ ] Add full-text search with Postgres `tsvector`
- [ ] Switch the post list to cursor-based pagination
- [ ] Seed 1,000+ posts, find an N+1 query, and fix it
- [ ] Use `EXPLAIN ANALYZE` before and after adding indexes; note the results
- [ ] README: write "Performance notes"

## ◆ v5: Media and ski features

**Goal:** Turn a generic blog into a ski blog with photos, resorts, and live conditions.

- [ ] Upload trip photos straight to Cloudflare R2 with presigned URLs (files never pass through the API)
- [ ] Add a `resorts` table and resort pages listing linked posts
- [ ] Show current snow and weather conditions from Open-Meteo
- [ ] Cache conditions in the database with an expiry
- [ ] Refresh conditions on a schedule with a background job
- [ ] Show trip locations on a Leaflet map
- [ ] Optional: upload a GPX track and draw the run on the map
- [ ] README: write "Working with third-party APIs"

## ◆◆ v6: Production quality

**Goal:** The difference between a project and a product.

- [ ] Unit-test business logic with Vitest (slugs, permissions, validation)
- [ ] Integration-test API routes against a test database
- [ ] Write Playwright tests: sign up, write a post, comment
- [ ] Set up GitHub Actions for lint, typecheck, and tests
- [ ] Auto-deploy when `main` is green
- [ ] Add Sentry and structured logging
- [ ] Rate-limit log in and comment endpoints
- [ ] Add SEO: meta tags, sitemap, and Open Graph images for posts
- [ ] README: write "Architecture overview"

## Off-piste: stretch goals

Pick one or two.

- [ ] Migrate to Next.js with server rendering and compare performance
- [ ] Add real-time comment notifications with WebSockets
- [ ] Publish an RSS feed and an email newsletter for new posts
- [ ] Run the whole stack with Docker Compose and write an architecture doc

---

## Things I don't understand yet

Add questions here as they come up, and move them to the README once answered.

-
