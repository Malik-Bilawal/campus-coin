# AGENTS.md — Campus Coin (techwiz)

Student budget tracker. Two **independent** npm projects, no root `package.json`, no workspaces, no CI.
Always run commands inside the folder (`workdir`), never from the repo root.

- `client/` — Next.js 14 App Router, **plain JS/JSX (no TypeScript)**, Tailwind 3, Zustand.
- `server/` — Express 4 + Mongoose, ESM (`"type": "module"`), MVC + services.
- `extras/` — specs and phase plans (`req.md`, `overview.md`, `phase1/2-plan.md`). Requirements docs, not commands.

## Commands

```bash
# server (port 5000)
cd server && npm install
npm run dev        # node --watch src/server.js
npm start          # production
npm run seed       # admin + demo users + system categories (idempotent)
npm run seed:reset # DESTRUCTIVE: wipes the Atlas DB, reseeds 1 admin + 3 students with full data
                   #   (guarded: refuses to run unless actually connected to Atlas — not localhost)

# client (port 3000)
cd client && npm install
npm run dev        # next dev
npm run build      # <-- the real verification gate ("build green" = done)
npm run lint       # next lint (eslint-config-next / core-web-vitals)
```

- **There is no test runner, no typecheck, and no formatter script.** Don't invent `npm test`.
  Verify server changes by booting `npm run dev` and hitting `GET /api/v1/health`.
- `prettier` is in client devDependencies but has no config/script — don't run it as a gate.
- Order that matters: `client: lint -> build`. Server: boot + smoke check only.
- **Stop the client dev server before `npm run build`** (then restart it): `next build` and `next dev` share
  `client/.next/`, so building while dev runs wipes the dev manifest → every page 404s its CSS/JS chunk
  ("CSS not loading"). Client dev is backgrounded: `cd client && npm run dev > dev-run.log 2>&1`.

## Startup / env gotchas

- `server/src/config/env.js` validates env with zod **at import time** and `process.exit(1)`s.
  Required: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`. Copy `server/.env.example` -> `server/.env`.
- `server/src/config/db.js` connects **Local -> Atlas** (reversed if `TRY_ATLAS_FIRST=true`), **retries the
  pair 3x (5s pause)**, and only then silently starts `mongodb-memory-server` — which loses all data on
  restart. Check the startup log line to know which DB you're on. Atlas TLS from this network is flaky
  (single-host `ETIMEDOUT`/handshake hangs are common), hence `MONGODB_TIMEOUT_MS=45000` in `server/.env`;
  a boot during a blip falls back to memory and the app silently serves an empty DB (logins 401).
- `atlas-credentials.env` (repo root) holds real Atlas credentials. It is gitignored — never commit,
  never echo its contents.
- No SMTP anywhere: OTPs are printed to the server console as `[OTP] email -> code` and returned as
  `devOtp` when `NODE_ENV=development`; password reset links print as `[RESET LINK] <url>`.
- Client env: `client/.env.local` (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`), defaults to
  `http://localhost:5000/api/v1`.

## API conventions

- Base path `/api/v1`, all routes wired in `server/src/routes/index.js`. Add new routes there.
- Response envelope is always `{ success, message, data }` (`src/utils/response.js`). Controllers return
  via `sendSuccess`/`sendError`; the client's `api` client returns the **whole body**, so callers read
  `res.data.x` — keep both sides consistent.
- Controllers are HTTP glue only; put business logic in `server/src/services/*` (stated project philosophy
  in `extras/phase1-plan.md`). Routes = pure wiring, models = schema + helpers.
- Auth: `protect` / `adminOnly` middleware accept `Authorization: Bearer` **or** `accessToken` cookie.
  Client stores the access token in `sessionStorage`; refresh happens automatically on 401
  (`client/src/lib/api.js`) then redirects to `/login`.
- Rate limits: `/api` = 500 req/15 min, auth endpoints = 30 req/15 min — hammering auth while testing
  gets you 429s.
- Socket.io shares the same HTTP server; client handshake must send `auth: { token }` (JWT verified in
  `server/src/config/socket.js`).

## AI layer

`server/src/services/ai/provider.js`: Groq -> OpenRouter -> **local rule fallback**. Any AI feature must
still work with empty `GROQ_API_KEY`/`OPENROUTER_API_KEY` (demo-safe). Never make a request path hard-fail
when keys are missing.

## Client conventions

- Path alias `@/*` -> `src/*` (`client/jsconfig.json`). Use it; relative `../../` climbs are not the style.
- Route groups `(auth)` and `(dashboard)`; the dashboard shell (sidebar/topbar guard) lives in
  `src/app/(dashboard)/layout.js` — new app pages go under it, not at `src/app/` root.
- Shared UI lives in `src/components/ui/` (Button, Card, Input, Modal, Toaster, ...) — reuse before writing
  new primitives. State in `src/store/*.js` (Zustand), data fetching via `api` from `src/lib/api.js`.
- Files are `.js`/`.jsx` only; there is no `tsconfig.json`. Don't introduce TypeScript files.

## Data / seeding

- System (default) categories are auto-seeded on **every server boot** (`seedSystemCategories` in
  `server/src/server.js`). Registration does **not** create per-user categories — users see the system
  defaults and add their own via `POST /api/v1/categories` (per-user rows have `userId` set).
- `npm run seed` accounts: `admin@campuscoin.app` / `Admin@123`, `demo@campuscoin.app` / `Demo@123`.
- `npm run seed:reset` (from `src/seeds/seedAtlas.js`) wipes everything and rebuilds: admin +
  `demo@campuscoin.app`/`Demo@123`, `rafi@campuscoin.app`/`Rafi@123`, `nusrat@campuscoin.app`/`Nusrat@123` —
  each student gets 6 months of transactions, current-month budgets, notifications, tips, bookmarks,
  custom categories; deterministic PRNG so re-runs are reproducible. Run it, then verify the server log
  says Atlas (a mid-blip run lands in the in-memory DB, which the script's host guard rejects).
- **But:** with the in-memory fallback the seed script gets its *own* ephemeral DB, so it cannot populate
  the running server. In that mode register through the API/UI instead (OTP shows in the server log).
- Money is stored in BDT; categories are split `income`/`expense` with `userId: null, isDefault: true`
  for system-level ones.
