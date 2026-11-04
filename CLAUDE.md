# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SvelteForge Admin is a SvelteKit admin dashboard using Svelte 5, Tailwind CSS v4, Better Auth (self-hosted, with optional Google/GitHub OAuth), and Drizzle ORM with SQLite.

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm preview          # Preview production build
pnpm check            # Type-check with svelte-check
pnpm check:watch      # Type-check in watch mode

pnpm db:generate      # Generate Drizzle migrations from schema
pnpm db:push          # Push schema changes directly to database
pnpm db:studio        # Open Drizzle Studio GUI
pnpm db:seed          # Seed database with sample data (local tsx)
pnpm db:migrate-v2    # One-time v1 → v2 auth migration (run BEFORE db:push on old DBs)

pnpm test             # Run all unit tests (Vitest)
pnpm test:watch       # Run tests in watch mode
pnpm test:e2e         # Run E2E tests (Playwright)

# Run a single test file
npx vitest run src/routes/\(app\)/users/users.test.ts

pnpm lint             # ESLint
pnpm format           # Prettier (write)
pnpm format:check     # Prettier (check only)
```

## Architecture

### Tech Stack

- **Svelte 5** with runes API (`$props`, `$state`, `$derived`, `{@render}`)
- **Tailwind CSS v4** — native CSS with `@theme` directive in `src/app.css`, no JS config file. OKLCH color system
- **shadcn-svelte** — UI components in `#lib/components/ui/`, added via `npx shadcn-svelte@latest add <component>`
- **Better Auth** — configured in `src/lib/server/auth.ts` with the `username` and `admin` plugins and `sveltekitCookies` (must stay last). Argon2id hashing is kept via custom `password.hash/verify` (`src/lib/server/password.ts`). OAuth via Better Auth social providers, enabled only when env credentials exist
- **Drizzle ORM** — SQLite with better-sqlite3, WAL mode. Schema in `src/lib/server/db/schema.ts`
- **LayerChart v2** — D3-based charts. Marked `noExternal` in `vite.config.ts` alongside `svelte-ux` for SSR compatibility
- **Package manager:** pnpm

### Routing & Auth

Routes use SvelteKit route groups for layout separation:

- `(app)/` — Protected routes behind the app shell. Auth guard in `(app)/+layout.server.ts` redirects unauthenticated users to `/login`. Features: dashboard (`+page`), `users/`, `roles/`, `content/` (CMS — list, `new/`, `[id]/edit/`), `analytics/`, `notifications/`, `database/`, `settings/`
- `(auth)/` — Public auth routes: `login/` (+ OAuth start routes `login/google/`, `login/github/`; callbacks are Better Auth's `/api/auth/callback/*`), `register/`, `forgot-password/`, `reset-password/`, `lock/` (re-auth screen, requires an existing session)
- `(public)/` — Public pages (pricing)
- `docs/` — **Ungrouped, so NOT auth-guarded** — a public, statically-rendered documentation site (its own `+layout.svelte`, ~17 pages). Anything placed outside a `(group)/` is reachable without a session
- `logout/` — Standalone logout action (server-only)
- `api/search/` — Search endpoint for command palette
- `sitemap.xml/` — Auto-generated sitemap

`hooks.server.ts` calls `auth.api.getSession()` to populate `event.locals.user`/`event.locals.session`, then `svelteKitHandler` serves Better Auth's endpoints under `/api/auth/*` (OAuth callbacks at `/api/auth/callback/{google,github}`, reset links). `/login/google` and `/login/github` just start the OAuth flow. OAuth providers are environment-driven — see `.env.example`.

`event.locals.user` is `SessionUser` (Better Auth's session user, with `username: string` and `role: Role` narrowed). Use the `User` type only when querying the DB directly.

**Auth mutations go through `auth.api.*`, not direct DB writes** — sign-in/up, password change/reset, email change, session revocation, and admin user CRUD (`createUser`, `setRole`, `adminUpdateUser`, `removeUser`). Pass `headers: request.headers` so Better Auth sees the caller's session, and convert errors with `authFailure()` from `#lib/server/auth-errors.js`. Cross-cutting rules (demo-account protection, last-admin protection, refusing to delete content authors) live in `hooks.before` in `auth.ts` so they also cover the raw `/api/auth/*` endpoints — put new auth guards there, not only in a form action.

Sessions live 30 days and slide forward when <15 days remain (`session.expiresIn`/`updateAge`). The cookie (`better-auth.session_token`) is HMAC-signed with `BETTER_AUTH_SECRET`, so a leaked DB alone can't forge a cookie. Reset/verification tokens are stored hashed. Roles and permissions are defined once in `src/lib/permissions.ts`; impersonation is deliberately granted to no role (premium feature).

The `(app)/+layout.server.ts` guard also enforces **maintenance mode**: when `appSettings.maintenanceMode === "true"`, non-admin users get a 503. Admins bypass it.

### Key Directories

- `src/lib/server/` — Server-only code (auth, OAuth, database). Never import from client-side code
- `src/lib/server/auth.ts` — Better Auth instance (plugins, hooks, databaseHooks, `getEnabledProviders()`, username/password limits)
- `src/lib/server/email.ts` — `sendAuthEmail()`: logs to console (+ optional `AUTH_EMAIL_OUTBOX` JSONL); the one place to plug in an email provider
- `src/lib/server/db/schema.ts` — Drizzle schema. Auth tables (`users`, `sessions`, `accounts`, `verifications`) use Better Auth field names (`usePlural: true`; `image` is remapped to `avatarUrl`). App tables: pages, notifications, appSettings
- `src/lib/server/db/migrate-v2-auth.ts` — v1 → v2 migration (tested against `db/fixtures/v1-schema.sql`)
- `src/lib/server/db/seed.ts` — Database seeder (run via `pnpm db:seed`, uses local `tsx` not SvelteKit aliases)
- `src/lib/server/id.ts` — Crypto ID generator (`generateId()`)
- `src/lib/components/ui/` — shadcn-svelte components (don't edit directly, re-add to update)
- `src/lib/components/` — App-level components (sidebar, theme toggle, command palette, notification bell)
- `src/lib/hooks/` — Svelte 5 reactive utilities (e.g., `is-mobile.svelte.ts`)
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge) and component type utilities
- `src/lib/utils/` — Export utilities (CSV/JSON), user-agent parser

### Database

SQLite database file: `svelteforge.db` (project root, gitignored). Roles enum: `admin | editor | viewer`. First registered user gets `admin` role.

**Notifications with `userId = NULL` are global** — every user sees them. Per-user notifications set `userId` to the recipient. The `(app)/+layout.server.ts` filter (`eq(userId, X) OR isNull(userId)`) is the canonical pattern for any notification query.

### Demo Mode

Gated by the `DEMO_MODE=true` env var (read directly via `process.env` in `settings/+page.server.ts`, not the DB). When enabled it unlocks two things that are otherwise invisible:

1. An admin-only **Demo tab in Settings** with a _Reset Demo Data Now_ button → the `resetDemo` action, which wipes and re-seeds the DB via `seedDemo()` from `seed.ts`.
2. A **self-modification guard on the shared `demo` account** — Better Auth `hooks.before` in `auth.ts` refuses `/update-user`, `/change-email`, `/change-password` and `/delete-user` for `username === "demo"` (covering both the Settings actions and the raw endpoints), so one visitor can't lock everyone else out between resets. It reads `process.env.DEMO_MODE` per request.

Leave it unset on real deployments. For a hands-off public demo, an hourly cron runs `pnpm db:seed` (this is why deploy syncs `src/` too — see below).

### Testing

Tests co-locate with their route: e.g., `src/routes/(app)/users/users.test.ts` tests the `users/+page.server.ts` load and actions.

**Test DB pattern:** Tests mock `#lib/server/db/index.js` with `mockDbModule()`, a proxy that forwards to the current in-memory DB (the Better Auth singleton captures `db` once at import, so a plain getter is not enough). Set it up before dynamically importing the server module:

```ts
let testDb: TestDb;
vi.mock("#lib/server/db/index.js", async () =>
	(await import("#lib/server/db/test-utils.js")).mockDbModule(() => testDb)
);
const { load, actions } = await import("./+page.server.js");
```

Actions that call `auth.api.*` need a real session: `createMockRequest(formData, await createAuthHeaders(userId))`. `src/test-setup.ts` stubs `$app/server`'s `getRequestEvent`. Don't mock `#lib/server/auth.js` — tests run against the real Better Auth config.

After modifying `schema.ts`, also update the `SCHEMA_SQL` in `test-utils.ts` and run `pnpm db:push`.

`test-utils.ts` also exports `createTestUser(db, overrides)` (user + credential account, password `"password123"`, production Argon2id params), `createAuthHeaders(userId)`, `createMockLocals(userId, role)`, `createFormData(entries)`, and `createMockRequest(formData, headers?)` — use these instead of hand-rolling fixtures.

### Patterns

- Forms use SvelteKit form actions with `use:enhance` for progressive enhancement
- Dark/light mode via `mode-watcher` — use `mode.current` (runes object), NOT `$mode`
- App shell layout: sidebar (`app-sidebar.svelte`) + topbar with breadcrumbs (generated from URL pathname)
- `App.Locals` typed in `src/app.d.ts` — `user: SessionUser | null`, `session: Session | null`
- `seed.ts` runs outside SvelteKit context — use relative imports (not `#lib/`) and `generateId()` from `#lib/server/id.js`
- LayerChart and `svelte-ux` must stay in `ssr.noExternal` in `vite.config.ts` — without it, SSR breaks on chart pages

### Free vs Premium split

This is the **free** repo (public, MIT). A separate private repo holds the **premium** tier as a superset (clones this repo, adds premium-only modules). Sync direction is one-way: free → premium, never the other way.

**Reserved paths in this repo** — never commit files matching these patterns; CI (`.github/workflows/no-premium-leak.yml`) will reject the push:

- Any directory named `premium/` (e.g. `src/lib/premium/`, `src/lib/server/premium/`)
- Any route group starting with `(premium` (e.g. `src/routes/(premium)/`, `(premium-app)/`)

If a feature request sounds premium-tier (multi-tenancy, billing, 2FA, passkeys, AI/RAG, audit log, impersonation, advanced apps like Mail/Chat/Kanban/Calendar/File-Manager/Invoice/eCommerce/CRM), say so and stop — it belongs in the premium repo, not here.

### Deployment

Builds with `@sveltejs/adapter-node`. SvelteKit configuration lives in `vite.config.ts`; set `ORIGIN` before building (`paths.origin` is compiled into the server). `BETTER_AUTH_SECRET` is needed at runtime only — the server refuses to start in production without it, but `vite build` uses a placeholder. `.github/workflows/deploy.yml` deploys on push to `main` only after the reusable CI workflow passes. It builds for the demo origin, syncs `build/`, `src/`, and dependency/configuration files to the demo server, installs dependencies there, checks `BETTER_AUTH_SECRET` is in the server `.env`, runs `pnpm db:migrate-v2` (a no-op once the DB is on v2), and restarts PM2. `/api/health` exposes the app version and build commit; deployment verifies it matches the pushed commit. Keep `DEMO_MODE` and `BETTER_AUTH_SECRET` in the server's environment (`.env` loaded by PM2 via `--env-file`) so they survive restarts. The deployment does not seed or reset the live database.

`scripts/` holds Playwright tooling for marketing screenshots (`screenshot.ts`, `add-browser-frame.ts`) — outputs to `screenshots/`, unrelated to the app runtime.
