# Changelog

All notable changes to SvelteForge Admin are documented here.

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
