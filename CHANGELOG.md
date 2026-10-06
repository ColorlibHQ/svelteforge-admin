# Changelog

All notable changes to SvelteForge Admin are documented here.

## Documentation update -- October 2026

- Add the v1.4 migration guide and align OAuth, registration, test helpers, async session APIs, and Docker examples with the shipped code.
- Remove examples for private or nonexistent auth exports.

## v1.4.0 -- October 2026

### Changed

- Migrate to SvelteKit 3.0.0 and adapter-node 6: Vite-based configuration,
  `#lib` subpath imports, explicit environment variables, and external OAuth redirects.
- Refresh dependencies, including Svelte 5.57.1, Vite 8.3.2, Vitest 5, and LayerChart 2.5.1.
  Retain TypeScript 6.0.3 because SvelteKit, svelte-check, and typescript-eslint do not support 7 yet.
- Upgrade pnpm to 12.9.1 and move build permissions to `pnpm-workspace.yaml`.
- Set Node's minimum version to 22.17; production origin must be configured before building.
- Replace deprecated Oslo SHA-256 implementation with Node's built-in crypto.

### Fixed

- Grant admin access only to the first registration using an immediate SQLite transaction.
- Restrict role changes to administrators and content mutations to editors/admins;
  editors may delete only their own pages.
- Honor `DATABASE_URL` in Drizzle configuration and database size reporting.
- Use local tsx for seeding and keep environment files out of Docker images.

### Testing

- Add regression tests for registration and role/content authorization.
- Automatically seed a dedicated browser-test database before starting the preview server.
- Add CI type, lint, formatting, unit, build, and browser checks before deployment.
- Verify the live demo commit through the public `/api/health` endpoint.
- Verified locally: 40 unit tests, 38 Chromium tests, type checking, lint, formatting, and production build.

### Compatibility

- Keep pnpm’s release-age safeguard enabled. SvelteKit 3.0.1, Vite 8.3.3,
  and typescript-eslint 8.71.1 are too recent under its 24-hour window at upgrade time.
- Runed (through Bits UI and LayerChart) still declares a SvelteKit 2 peer range;
  the application passes runtime browser tests with SvelteKit 3.
- Arctic is deprecated upstream; replacing its OAuth integration remains follow-up work.

---

## v1.3.0 -- August 2026

Dependency refresh plus a mobile layout fix and a green, reliable E2E suite. No public API changes -- existing code continues to work.

### Major version bumps

- **better-sqlite3 12.11 -> 13.0** -- v13 moves the driver onto N-API, so prebuilt binaries are portable across Node/Electron versions instead of being rebuilt per ABI. No API changes; the schema push, seeder, and all 33 unit tests (which run against real in-memory SQLite) pass untouched.
- **@types/better-sqlite3 7.6 -> 9.6** -- catches the types up to the v13 driver.
- **LayerChart 2.0.0-next.48 -> 2.1.0** -- off the pinned prerelease and onto the first stable 2.x. The `getChartContext()` / `Tooltip` API this template uses is unchanged, so `chart-tooltip.svelte` and `chart-utils.ts` needed no edits.
- **Prettier 3.8 -> 3.9** -- new minor changed how union types wrap; the whole codebase was re-run through Prettier (`src/lib/server/auth.ts` plus four docs pages reflowed, no semantic changes).

### Other notable updates

- SvelteKit 2.68 -> 2.70, Svelte 5.56.4 -> 5.56.8, svelte-check 4.7.1 -> 4.7.5, @sveltejs/vite-plugin-svelte 7.1 -> 7.3
- Tailwind CSS 4.3.1 -> 4.3.3 (`tailwindcss` + `@tailwindcss/vite`), tailwind-variants 3.2 -> 3.3, prettier-plugin-tailwindcss 0.8.0 -> 0.8.1
- shadcn-svelte 1.3 -> 1.5, @lucide/svelte 1.21 -> 1.31, svelte-meta-tags 5.0.0 -> 5.0.2
- Vite 8.1 -> 8.2, Vitest 4.1.9 -> 4.1.10, @playwright/test 1.61 -> 1.62
- ESLint 10.5 -> 10.8, eslint-plugin-svelte 3.19 -> 3.22, typescript-eslint 8.62 -> 8.66, globals 17.7 -> 17.9
- @types/node 26.0 -> 26.2, tsx 4.22 -> 4.23, sharp 0.35.2 -> 0.35.3, @internationalized/date 3.12.2 -> 3.12.3

### Held back

- **TypeScript 6.0.3 (7.0.2 available)** -- TypeScript 7 (the native port) is not yet usable here: `svelte-check` refuses to start without a side-by-side TS 6 install plus the `--tsgo` flag, and `typescript-eslint` hard-errors with "does not support TS 7.0" ([typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940) tracks TS >=7.1 support). Both `pnpm check` and `pnpm lint` fail outright on TS 7, so the toolchain stays on the latest 6.x.
- **`arctic` and `@oslojs/crypto` show as deprecated** but 3.7.0 and 1.0.1 _are_ the latest published versions -- the author sunset the Lucia/oslo ecosystem rather than superseding these packages. Nothing to upgrade to; both still work and are unchanged.

### Fixes

- **Dashboard and Analytics overflowed horizontally on mobile** -- at a 390px viewport the pages scrolled sideways by 209px and 225px respectively. The chart grids were declared as `grid gap-4 md:grid-cols-2 ...` with no base column definition, so below the `md` breakpoint the single implicit column sized itself to the chart SVG's intrinsic width (~549px) instead of the viewport. Adding an explicit `grid-cols-1` (which is `minmax(0, 1fr)`) lets the column shrink. Both pages now measure zero overflow at 390px. This bug predates this release -- it reproduces identically on the previous LayerChart pin.

### Testing

- **E2E suite is green again (38/38).** Twelve specs had been failing against correct markup: ten used `page.locator("text=X")`, whose substring matching tripped Playwright strict mode once a word appeared in both a card title and body copy (`text=Free` matched three elements on the pricing page). They now target `[data-slot="card-title"]` and ARIA roles. The rest asserted text the UI no longer renders -- the auth pages have no `<h1>` for `expectHeading` to find, and the dashboard's quick stat reads "Published", not "Published Pages".
- **Fixed flaky logins on high-core machines.** Every test signs in, and Argon2id verification is deliberately slow and memory-hard; Playwright's default of one worker per core stacked those hashes onto a single server process until logins exceeded the 30s timeout. Local runs are now capped at 4 workers (CI already used 1), and the `webServer` timeout was raised to 180s so a cold production build can finish. Three consecutive full runs: 38/38 in ~4.2s each.
- `test-results/` and `playwright-report/` are now git- and Prettier-ignored; they were previously untracked-but-not-ignored and showed up as noise.

### Verified

- 33 unit tests pass, 38 E2E tests pass (cold and warm runs)
- `pnpm check` -- 0 errors, 0 warnings across 1858 files
- `pnpm lint` and `pnpm format:check` -- clean
- Runtime sweep of all 37 routes in light and dark themes at both 1440px and 390px: no console errors or warnings, no uncaught exceptions, no failed requests, no horizontal overflow

---

## v1.2.1 -- July 2026

Documentation and cross-promotion refresh.

- Replaced the Next.js "Apex" cross-sell with **Apex Dashboard -- Svelte Edition**, our flagship premium SvelteKit template (same Svelte 5 + Tailwind CSS v4 stack as this repo). All README and in-app docs promo links now point to the Svelte edition.
- Added a prominent Apex Svelte feature block to the README, plus a link to the [DashboardPack Svelte category](https://dashboardpack.com/templates/svelte/) so readers can find new Svelte templates as they ship.

---

## v1.2.0 -- June 2026

Dependency refresh plus mobile sidebar fixes. All packages updated to their latest versions; no public API changes -- existing code continues to work.

### Major version bumps

- **prettier-plugin-svelte 3.5 -> 4.1** -- new formatting tool major; the only output change was one component (`ui/textarea/textarea.svelte`) collapsing onto the new `{...restProps}` line style. Whole codebase re-run through Prettier.
- **svelte-meta-tags 4.7 -> 5.0** -- no markup changes required; the existing `MetaTags` usage in the root layout still type-checks.
- **@types/node 25 -> 26** -- matches the Node 26 runtime.

### Other notable updates

- SvelteKit 2.59 -> 2.68, Svelte 5.55 -> 5.56, svelte-check 4.4 -> 4.7
- Tailwind CSS 4.2 -> 4.3 (`tailwindcss` + `@tailwindcss/vite`), @tailwindcss/typography 0.5.19 -> 0.5.20
- better-sqlite3 12.9 -> 12.11 -- now declares Node 26 support in `engines` (no more install engine warning on Node 26)
- shadcn-svelte 1.2 -> 1.3, @lucide/svelte 1.14 -> 1.21, tailwind-merge 3.5 -> 3.6
- Vite 8.0 -> 8.1, Vitest 4.1.5 -> 4.1.9, @playwright/test 1.59 -> 1.61
- ESLint 10.3 -> 10.5, eslint-plugin-svelte 3.17 -> 3.19, typescript-eslint 8.59 -> 8.62, prettier 3.8.3 -> 3.8.4
- sharp 0.34 -> 0.35, tsx 4.21 -> 4.22, globals 17.6 -> 17.7, @internationalized/date 3.12.1 -> 3.12.2
- @sveltejs/adapter-node 5.5.4 -> 5.5.7, @sveltejs/vite-plugin-svelte 7.1.1 -> 7.1.2
- LayerChart held at 2.0.0-next.48 (pinned prerelease for Svelte 5 / shadcn-svelte compatibility)

### Fixes

- **Mobile sidebar stayed open after navigation** (issue #2) -- on mobile the sidebar is an overlay sheet, but nav links never closed it, leaving it on top of the page just opened. Brand link, all nav links, and the account-dropdown links now call `setOpenMobile(false)` on mobile (no-op on desktop).
- **`InvalidStateError: Transition was aborted because of invalid state`** (issue #2) -- a fresh navigation interrupting an in-flight View Transition rejected the `ViewTransition` promises, surfacing as an uncaught error. `onNavigate` now swallows the `ready`/`finished`/`updateCallbackDone` rejections; navigation still completes normally.
- **Stale unit test** in `users.test.ts` -- the "prevents deletion of last admin" case predated the admin-role gate on `/users` mutations and asserted `400`; with `requireAdmin` a non-admin is rejected with `403` first. Re-scoped to assert the admin gate (the last-admin delete path is now only reachable via self-deletion, already covered by the self-deletion test).

### Verified

- All 33 unit tests pass
- `pnpm check` -- 0 errors, 0 warnings
- `pnpm lint` -- clean
- `pnpm format:check` -- clean
- `pnpm build` -- production build succeeds (adapter-node)

---

## v1.1.0 -- May 2026

Dependency refresh. All packages updated to their latest versions, including major bumps for TypeScript, Vite, and the Svelte Vite plugin. No public API changes -- existing code continues to work.

### Major version bumps

- **TypeScript 5.9 -> 6.0** -- new compiler version, no codebase changes required
- **Vite 7.3 -> 8.0** -- newer build tooling
- **@sveltejs/vite-plugin-svelte 6.2 -> 7.1** -- compatible with Vite 8
- **@lucide/svelte 0.577 -> 1.14** -- icon library now stable at 1.x
- **prettier-plugin-tailwindcss 0.7 -> 0.8**

### Other notable updates

- SvelteKit 2.53 -> 2.59
- Svelte 5.53 -> 5.55
- Vitest 4.0 -> 4.1
- bits-ui 2.16 -> 2.18
- shadcn-svelte 1.1 -> 1.2 (chart component re-generated)
- LayerChart 2.0.0-next.43 -> 2.0.0-next.48 (pinned by shadcn-svelte 1.2)
- ESLint 10.0 -> 10.3, eslint-plugin-svelte 3.15 -> 3.17, typescript-eslint 8.56 -> 8.59
- better-sqlite3 12.6 -> 12.9, drizzle-orm 0.45.1 -> 0.45.2
- @playwright/test 1.58 -> 1.59
- Plus minor/patch bumps across all remaining dependencies

### Fixes

- **Logout button type error** in `app-sidebar.svelte` -- `requestSubmit` was called on `HTMLElement` (which doesn't have it). Now narrowed via `instanceof HTMLFormElement`.
- **Sidebar trigger ref binding** in `ui/sidebar/sidebar-trigger.svelte` -- `ref` was exposed as a bindable prop but never bound to the underlying element. Now binds via `bind:ref` on the Button, matching the convention used by the other sidebar primitives.
- **Stale state warnings** in `content/[id]/edit/+page.svelte` -- initial form values now captured via `untrack()` to silence Svelte 5's `state_referenced_locally` warning while preserving the original behavior.
- **Unused imports/variables** removed from `scripts/add-browser-frame.ts` and `routes/docs/+layout.svelte`.

### Build/tooling

- **`pnpm.onlyBuiltDependencies`** added to `package.json`. pnpm 10's modern approval mechanism for native modules (better-sqlite3, sharp, esbuild, @node-rs/argon2) -- replaces the legacy `.npmrc` `approve-builds=` flag, which pnpm 10 ignores. Without this, fresh installs leave better-sqlite3 unbuilt and tests fail.
- **`@types/node`** added as a devDependency. SvelteKit 2.59's generated `.svelte-kit/tsconfig.json` now references the `node` type definitions; without it, `pnpm check` warns.
- **shadcn-svelte chart component re-generated.** layerchart 2.0.0-next.48 ships with shadcn-svelte 1.2; the older local copy referenced `getTooltipContext`, which was reorganized in newer layerchart prereleases.

### Verified

- All 33 unit tests pass
- `pnpm check` -- 0 errors, 0 warnings
- `pnpm lint` -- clean
- `pnpm build` -- production build succeeds

---

## v1.0.0 -- March 2026

Initial release. Full-featured admin dashboard with custom auth, RBAC, built-in documentation site, and a complete admin toolset.

### Documentation Site

- 16-page built-in documentation at `/docs` with dedicated layout and sidebar navigation
- Sections: Introduction, Getting Started, Project Structure, Authentication, Database, Routing, Components, Theming, User Management, Content Management, Analytics, Notifications, Settings, Testing, Deployment, API Reference
- Responsive docs layout with mobile hamburger menu
- DashboardPack premium promotion integrated throughout (header button, sidebar card, page callouts)
- Tailwind Typography plugin (`@tailwindcss/typography`) for proper prose formatting

### Authentication & Security

- Custom session management with SHA-256 hashed tokens (raw token in HttpOnly cookie, hash in DB)
- Argon2id password hashing via @node-rs/argon2
- Auto-extending sessions (30-day lifetime, refreshes at 15 days remaining)
- Session metadata tracking (user agent, IP address) for security auditing
- Optional OAuth login (Google + GitHub) via Arctic -- environment-driven, no errors when disabled
- Password reset flow with hashed tokens and expiry
- Screen lock page requiring password re-entry
- Auth guard on all protected routes via `(app)/+layout.server.ts`
- Session validation on every request via `hooks.server.ts`

### Role-Based Access Control

- Three roles: Admin, Editor, Viewer with distinct permission levels
- First registered user automatically assigned Admin role
- Role promotion/demotion with confirmation dialogs
- Permission matrix display on roles page

### Dashboard

- KPI cards with animated counters (easeOutExpo easing) for users, sessions, pages, and notifications
- Area chart for user registration trends (LayerChart v2)
- Bar chart for content status breakdown
- Pie/donut chart for user role distribution
- Recent activity feed with latest registrations and content updates

### User Management

- Full CRUD with server-side data table (sort, search, paginate)
- Configurable page sizes and column sorting
- Admin-only user creation dialog with role assignment
- Delete confirmation dialogs
- CSV and JSON export

### Content Management

- Page editor with title, slug, content, and template fields
- Three templates: Default, Landing, Blog
- Publishing workflow: Draft, Published, Archived
- Auto-generated slugs from titles
- Filterable and sortable content table with pagination
- CSV and JSON export

### Analytics

- Tabbed interface: Users, Content, Sessions, Notifications
- User growth line/area charts
- Content distribution bar and pie charts
- Session count trends
- Read vs. unread notification ratios

### Notifications

- In-app notification system (info, warning, error, success types)
- Notification bell with unread count badge in top nav
- Popover preview of recent notifications
- Full notifications page with mark-as-read and delete
- Bulk operations: mark all read, delete all read

### Database Management

- Table browser with row counts
- Schema viewer (column names, types, constraints)
- Data export per table (CSV/JSON)
- Admin-only access restriction

### Settings

- Profile settings (display name, email, avatar URL)
- Password change with current password verification
- Session management (view all sessions, revoke individual or all others)
- App-level key-value settings stored in DB
- Dark/light mode with system preference detection (mode-watcher)

### UI & UX

- Command palette (Cmd+K) with navigation, search, and quick actions
- Go Pro sidebar CTA with crown icon and PRO badge linking to DashboardPack
- Documentation link in sidebar navigation
- Page view transitions via View Transitions API
- Responsive layout with collapsible sidebar on mobile
- Dark/light mode with localStorage persistence
- Auto-generated breadcrumb navigation from URL pathname
- Quick-access apps grid menu
- Toast notifications via Svelte Sonner
- Reusable data table pagination component
- Custom error page

### SEO & Meta

- OpenGraph and Twitter meta tags via svelte-meta-tags
- Auto-generated XML sitemap endpoint

### Developer Experience

- Svelte 5 runes API throughout ($props, $state, $derived, $effect)
- Tailwind CSS 4 with OKLCH color system, @theme directive, and Typography plugin
- shadcn-svelte component library
- Drizzle ORM with SQLite (WAL mode) and typed schema
- Vitest unit tests with in-memory SQLite test database
- Playwright E2E test setup
- ESLint 9 + Prettier code quality tooling
- Database seeder with sample data (50 users, 65 pages, 33 notifications)
- pnpm as package manager

### Stack

- SvelteKit 2.50 + Svelte 5 + TypeScript 5
- Tailwind CSS 4 + @tailwindcss/typography + shadcn-svelte + tw-animate-css
- Drizzle ORM + better-sqlite3
- @oslojs/crypto + @oslojs/encoding + @node-rs/argon2
- Arctic (OAuth)
- LayerChart v2 (D3-based charts)
- mode-watcher, svelte-sonner, svelte-meta-tags
- Vitest + Playwright

### Build History

- `2026-02-08` -- Initial scaffold: SvelteKit + Svelte 5 + TypeScript
- `2026-02-08` -- Configure pnpm build approvals
- `2026-02-09` -- Add Tailwind CSS v4, shadcn-svelte with zinc OKLCH theme, and core UI components
- `2026-02-09` -- Add Drizzle ORM with SQLite, users and sessions schema
- `2026-02-09` -- Add Lucia Auth v3 with Drizzle adapter, session hooks, and type definitions
- `2026-02-09` -- Add dashboard layout shell with sidebar, topbar, breadcrumbs, and KPI cards
- `2026-02-09` -- Add dark/light mode toggle with ModeWatcher persistence
- `2026-02-09` -- Add login, register, and logout auth pages with Argon2 password hashing
- `2026-02-09` -- Add protected routes with auth redirect and dynamic user data in sidebar
- `2026-02-10` -- Implement Arctic OAuth (Google + GitHub)
- `2026-02-10` -- Add README with screenshots and project documentation
- `2026-03-07` -- Add 16-page built-in documentation site at /docs
- `2026-03-07` -- Add @tailwindcss/typography for docs prose formatting
- `2026-03-07` -- Add Go Pro sidebar CTA with DashboardPack UTM tracking
- `2026-03-07` -- Add Documentation link in sidebar navigation
- `2026-03-07` -- Add DashboardPack premium template screenshots to README
- `2026-03-07` -- Add comprehensive CHANGELOG
- `2026-03-07` -- Bump version to 1.0.0
