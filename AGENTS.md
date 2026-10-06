# Repository Guidelines

## Project Structure & Module Organization

SvelteForge Admin uses SvelteKit 3, Svelte 5, TypeScript, Tailwind CSS 4, and Drizzle ORM with SQLite.

- `src/routes/`: pages, server loads, and actions. `(app)/` contains protected dashboard routes; `(auth)/` contains authentication routes; `(public)/` and `docs/` contain public pages.
- `src/lib/components/`: shared components; `ui/` contains shadcn-svelte components.
- `src/lib/server/`: server-only authentication, OAuth, and database code. Never import it into client code.
- `src/lib/server/db/`: schema, seed, and test helpers; `drizzle/` holds migrations.
- `static/` and `src/lib/assets/`: assets; `src/app.css` defines the theme.
- Unit tests live beside route code; `e2e/` contains browser tests. `scripts/` and `screenshots/` support marketing screenshots.

## Build, Test, and Development Commands

Use pnpm (version pinned in `package.json`).

- `pnpm install`: install dependencies.
- `pnpm db:push`: apply the schema locally; `pnpm db:seed`: populate sample data.
- `pnpm dev`: start development at `http://localhost:5173`.
- `pnpm build` / `pnpm preview`: build and preview production output.
- `pnpm check`: check TypeScript and Svelte types.
- `pnpm lint` / `pnpm format:check`: check ESLint rules and formatting; `pnpm format` applies Prettier.
- `pnpm test` / `pnpm test:e2e`: run Vitest or Playwright.
- `pnpm db:generate`: generate migrations after schema changes.

## Coding Style & Naming Conventions

Use tabs, double quotes, ES5 trailing commas, and a 100-column print width, as configured in Prettier. Use Svelte 5 runes and kebab-case component filenames, such as `user-form-dialog.svelte`. Follow SvelteKit filenames (`+page.svelte`, `+page.server.ts`). Keep theme changes in `src/app.css`; update shadcn components through the generator.

## Testing Guidelines

Name colocated Vitest tests `*.test.ts` and Playwright tests `e2e/*.spec.ts`. Use `createTestDb()` and fixtures from `test-utils.ts` for isolated in-memory SQLite tests. Update its `SCHEMA_SQL` when changing the schema. Cover changed actions, validation, and role restrictions; no numeric coverage threshold is configured. Browser tests use Chromium, automatically seed a disposable database, and build/start a fresh preview server.

## Commit & Pull Request Guidelines

Recent commits use short imperative subjects, such as “Fix mobile sidebar nav”; no mandatory prefix convention is evident. Keep commits focused. PRs should explain behavior changes, link relevant issues, report validation, and include screenshots for UI changes.

## Configuration & Repository Boundaries

Use `.env.example` for local configuration; keep secrets and SQLite files uncommitted. This is the free repository: CI rejects `premium/` directories and route groups beginning with `(premium`.
