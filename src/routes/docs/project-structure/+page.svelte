<svelte:head>
	<title>Project Structure - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="Understand the complete file and directory structure of SvelteForge Admin, a SvelteKit 2 + Svelte 5 admin dashboard with session-based auth, Drizzle ORM, and Tailwind CSS 4."
	/>
</svelte:head>

<h1>Project Structure</h1>

<p>
	SvelteForge Admin follows <strong>SvelteKit's</strong> file-based routing conventions and
	<strong>Svelte 5's</strong> component architecture. Every directory and file has a specific purpose
	— understanding this structure is key to extending the dashboard efficiently.
</p>

<p>
	Because <strong>SvelteKit</strong> uses the filesystem as its router, the <code>src/routes/</code>
	directory directly maps to URL paths. Route groups (directories in parentheses) share layouts without
	affecting the URL, which is how SvelteForge separates protected, auth, public, and documentation pages.
</p>

<h2>Complete File Tree</h2>

<pre><code
		>svelteforge-admin/
├── src/
│   ├── routes/                      # SvelteKit file-based routing
│   │   ├── (app)/                   # Protected routes (auth required)
│   │   │   ├── +layout.server.ts    # Auth guard + maintenance mode check
│   │   │   ├── +layout.svelte       # App shell (sidebar + topbar)
│   │   │   ├── +page.svelte         # Dashboard (/)
│   │   │   ├── users/               # User management CRUD
│   │   │   ├── content/             # CMS pages
│   │   │   │   ├── +page.svelte     # Content list
│   │   │   │   ├── new/             # Create new page
│   │   │   │   └── [id]/edit/       # Edit existing page (dynamic route)
│   │   │   ├── analytics/           # Charts and data visualization
│   │   │   ├── notifications/       # Notification center
│   │   │   ├── roles/               # Role management
│   │   │   ├── database/            # Database browser
│   │   │   └── settings/            # Application settings
│   │   ├── (auth)/                  # Public auth routes (no auth required)
│   │   │   ├── +layout.svelte       # Auth layout (centered card)
│   │   │   ├── login/               # Login page
│   │   │   │   ├── +page.svelte     # Login form
│   │   │   │   ├── +page.server.ts  # Login action (Argon2 verify)
│   │   │   │   ├── google/          # Google OAuth initiation
│   │   │   │   │   ├── +server.ts   # Redirect to Google
│   │   │   │   │   └── callback/    # Google OAuth callback
│   │   │   │   └── github/          # GitHub OAuth initiation
│   │   │   │       ├── +server.ts   # Redirect to GitHub
│   │   │   │       └── callback/    # GitHub OAuth callback
│   │   │   ├── register/            # Registration page
│   │   │   ├── forgot-password/     # Password reset request
│   │   │   ├── reset-password/      # Password reset form
│   │   │   └── lock/                # Screen lock (re-enter password)
│   │   ├── (public)/                # Public marketing pages
│   │   │   └── pricing/             # Pricing page
│   │   ├── docs/                    # Documentation (this site)
│   │   │   ├── +layout.svelte       # Docs layout (sidebar nav + prose)
│   │   │   ├── +page.svelte         # Introduction
│   │   │   ├── getting-started/     # Installation guide
│   │   │   ├── project-structure/   # This page
│   │   │   ├── authentication/      # Auth documentation
│   │   │   └── ...                  # Additional doc pages
│   │   ├── logout/                  # Logout action (server-only)
│   │   ├── api/
│   │   │   └── search/              # Command palette search endpoint
│   │   └── sitemap.xml/             # Auto-generated sitemap
│   │
│   ├── lib/
│   │   ├── server/                  # Server-only code (never sent to client)
│   │   │   ├── auth.ts              # Session management functions
│   │   │   ├── oauth.ts             # Arctic OAuth provider setup
│   │   │   ├── id.ts                # Cryptographic ID generator
│   │   │   └── db/
│   │   │       ├── index.ts         # Database connection (better-sqlite3)
│   │   │       ├── schema.ts        # Drizzle ORM schema definitions
│   │   │       └── seed.ts          # Database seeder script
│   │   │
│   │   ├── components/              # App-level Svelte 5 components
│   │   │   ├── app-sidebar.svelte   # Main navigation sidebar
│   │   │   ├── command-palette.svelte  # Ctrl+K search overlay
│   │   │   ├── notification-bell.svelte  # Notification dropdown
│   │   │   ├── theme-toggle.svelte  # Dark/light mode switch
│   │   │   ├── animated-counter.svelte  # Number animation component
│   │   │   ├── data-table-pagination.svelte  # Table pagination
│   │   │   ├── delete-confirm-dialog.svelte  # Confirmation modal
│   │   │   ├── role-change-dialog.svelte  # Role assignment modal
│   │   │   ├── user-form-dialog.svelte  # User create/edit form
│   │   │   └── apps-menu.svelte     # Application switcher menu
│   │   │
│   │   ├── components/ui/           # shadcn-svelte primitives
│   │   │   ├── button/
│   │   │   ├── card/
│   │   │   ├── dialog/
│   │   │   ├── dropdown-menu/
│   │   │   ├── input/
│   │   │   ├── table/
│   │   │   └── ...                  # More shadcn-svelte components
│   │   │
│   │   ├── hooks/                   # Svelte 5 reactive utilities
│   │   │   └── is-mobile.svelte.ts  # Responsive breakpoint detection
│   │   │
│   │   ├── utils/                   # Utility modules
│   │   │   ├── export.ts            # CSV and JSON export functions
│   │   │   └── user-agent.ts        # User-agent string parser
│   │   │
│   │   └── utils.ts                 # cn() helper (clsx + tailwind-merge)
│   │
│   ├── app.css                      # Tailwind CSS 4 theme configuration
│   ├── app.d.ts                     # TypeScript type definitions
│   ├── app.html                     # HTML shell template
│   └── hooks.server.ts              # SvelteKit server hooks
│
├── drizzle/                         # Generated Drizzle migration files
├── static/                          # Static assets (favicon, images)
├── tests/                           # Playwright E2E test files
│
├── svelteforge.db                   # SQLite database (gitignored)
├── drizzle.config.ts                # Drizzle ORM configuration
├── vite.config.ts                   # Vite + SvelteKit configuration
├── svelte.config.js                 # Svelte compiler configuration
├── tailwind.config.ts               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies and scripts
├── pnpm-lock.yaml                   # pnpm lockfile
└── .env.example                     # Environment variable template</code
	></pre>

<h2>Route Groups Explained</h2>

<p>
	<strong>SvelteKit</strong> route groups are a powerful organizational tool. Directories wrapped in
	parentheses — like <code>(app)</code> — create layout boundaries without adding URL segments. SvelteForge
	uses four route groups to cleanly separate concerns:
</p>

<h3><code>(app)/</code> — Protected Routes</h3>

<p>
	Every route inside <code>(app)/</code> requires authentication. The auth guard lives in
	<code>(app)/+layout.server.ts</code> and runs before any page load:
</p>

<pre><code class="language-ts"
		>// src/routes/(app)/+layout.server.ts
export const load: LayoutServerLoad = async (&#123; locals &#125;) =&gt; &#123;
  if (!locals.user) &#123;
    redirect(302, "/login");
  &#125;

  // Check maintenance mode
  const maintenanceSetting = await db.query.appSettings.findFirst(&#123;
    where: eq(appSettings.key, "maintenanceMode"),
  &#125;);
  if (maintenanceSetting?.value === "true" &amp;&amp; locals.user.role !== "admin") &#123;
    error(503, "The application is currently under maintenance.");
  &#125;

  return &#123; user: locals.user, ... &#125;;
&#125;;</code
	></pre>

<p>
	This single <strong>SvelteKit</strong> layout server load function protects the dashboard, user management,
	content, analytics, notifications, roles, database, and settings pages — all without repeating auth
	logic in each route. The layout also enforces maintenance mode, blocking non-admin users with a 503
	error.
</p>

<p>
	The <code>(app)/+layout.svelte</code> provides the app shell: a collapsible sidebar, topbar with breadcrumbs,
	command palette, and notification bell.
</p>

<h3><code>(auth)/</code> — Public Auth Routes</h3>

<p>
	Authentication pages that must be accessible without being logged in: login, register, forgot
	password, reset password, and screen lock. These use a minimal centered-card layout — no sidebar,
	no topbar.
</p>

<p>
	OAuth callback routes nest under <code>login/</code> as
	<code>login/google/callback/</code> and <code>login/github/callback/</code>, keeping OAuth flow
	URLs clean and organized within <strong>SvelteKit's</strong> file-based router.
</p>

<h3><code>(public)/</code> — Marketing Pages</h3>

<p>
	Public-facing pages like pricing that use their own layout — no auth required, no app shell. These
	pages are designed for unauthenticated visitors.
</p>

<h3><code>docs/</code> — Documentation</h3>

<p>
	The documentation section (the pages you are reading now) uses its own layout with sidebar
	navigation and prose styling. This route group is not wrapped in parentheses because <code
		>docs</code
	> appears in the URL path.
</p>

<h2>Server-Only Code: <code>src/lib/server/</code></h2>

<p>
	<strong>SvelteKit</strong> enforces a strict server boundary. Any module inside
	<code>$lib/server/</code> is guaranteed to never be bundled into client-side JavaScript. If you
	accidentally import a server module from a <code>.svelte</code> component, the build will fail with
	a clear error. This is critical for SvelteForge because sensitive code lives here:
</p>

<h3><code>auth.ts</code> — Session Management</h3>

<p>
	The core authentication module. Generates session tokens, hashes them with SHA-256, creates and
	validates sessions, and manages httpOnly cookies. Uses <code>@oslojs/crypto</code> for
	cryptographic operations — no external auth framework needed. See the
	<a href="/docs/authentication">Authentication</a> page for a deep dive.
</p>

<h3><code>oauth.ts</code> — Arctic OAuth Providers</h3>

<p>
	Configures Google and GitHub OAuth via the Arctic library. Providers are <strong
		>environment-driven</strong
	>
	— they are <code>null</code> when env vars are missing, and the login page conditionally renders social
	login buttons. This means OAuth is entirely optional; the dashboard works with password-only auth out
	of the box.
</p>

<h3><code>id.ts</code> — Cryptographic ID Generator</h3>

<p>
	A simple utility that generates cryptographically random IDs using <code
		>crypto.getRandomValues()</code
	>
	and base32 encoding. Used for user IDs, OAuth account IDs, and password reset tokens throughout the
	application.
</p>

<h3><code>db/</code> — Database Layer</h3>

<ul>
	<li>
		<strong><code>index.ts</code></strong> — Creates the better-sqlite3 connection with WAL mode
		enabled for concurrent reads. Exports the Drizzle ORM <code>db</code> instance.
	</li>
	<li>
		<strong><code>schema.ts</code></strong> — Defines all database tables using Drizzle's type-safe
		schema builder: <code>users</code>, <code>sessions</code>, <code>pages</code>,
		<code>notifications</code>, <code>oauthAccounts</code>, <code>appSettings</code>, and
		<code>passwordResetTokens</code>. Each table export includes inferred TypeScript types.
	</li>
	<li>
		<strong><code>seed.ts</code></strong> — Populates the database with sample data. Runs via
		<code>pnpm db:seed</code> using <code>npx tsx</code> (not SvelteKit's runtime), so it uses
		relative imports instead of <code>$lib/</code> aliases.
	</li>
</ul>

<h2>App-Level Components: <code>src/lib/components/</code></h2>

<p>
	These are <strong>Svelte 5</strong> components built with the runes API (<code>$state</code>,
	<code>$props</code>, <code>$derived</code>). Each component is self-contained with its own
	reactive state:
</p>

<table>
	<thead>
		<tr>
			<th>Component</th>
			<th>Purpose</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>app-sidebar.svelte</code></td>
			<td
				>Main navigation sidebar with collapsible groups, user avatar, and role display. Uses <strong
					>Svelte 5</strong
				> <code>$state</code> for open/close tracking.</td
			>
		</tr>
		<tr>
			<td><code>command-palette.svelte</code></td>
			<td
				>Keyboard-driven search overlay (<code>Ctrl+K</code> / <code>Cmd+K</code>). Queries the
				<code>/api/search</code> endpoint and renders results in real time.</td
			>
		</tr>
		<tr>
			<td><code>notification-bell.svelte</code></td>
			<td
				>Topbar notification icon with unread count badge and dropdown list of recent notifications.</td
			>
		</tr>
		<tr>
			<td><code>theme-toggle.svelte</code></td>
			<td
				>Dark/light mode switch using <code>mode-watcher</code>. Accesses <code>mode.current</code> (runes
				object, not a Svelte store).</td
			>
		</tr>
		<tr>
			<td><code>animated-counter.svelte</code></td>
			<td>Smoothly animates between numeric values for dashboard stat cards.</td>
		</tr>
		<tr>
			<td><code>data-table-pagination.svelte</code></td>
			<td>Reusable pagination controls for data tables with page size selection.</td>
		</tr>
		<tr>
			<td><code>delete-confirm-dialog.svelte</code></td>
			<td>Confirmation modal for destructive actions (delete user, delete page, etc.).</td>
		</tr>
		<tr>
			<td><code>role-change-dialog.svelte</code></td>
			<td>Modal for changing a user's role (admin, editor, viewer) with confirmation.</td>
		</tr>
		<tr>
			<td><code>user-form-dialog.svelte</code></td>
			<td>Create/edit user form in a dialog, used by the user management page.</td>
		</tr>
		<tr>
			<td><code>apps-menu.svelte</code></td>
			<td>Application switcher dropdown in the topbar for navigating between app sections.</td>
		</tr>
	</tbody>
</table>

<h2>UI Primitives: <code>src/lib/components/ui/</code></h2>

<p>
	This directory contains <strong>shadcn-svelte</strong> components — accessible, composable UI primitives
	built on Bits UI. These are copy-pasted into your project (not installed as a dependency), giving you
	full control over their source.
</p>

<p>
	<strong>Important:</strong> Do not edit these files directly. To update or add components, use the CLI:
</p>

<pre><code class="language-bash"
		>npx shadcn-svelte@latest add button
npx shadcn-svelte@latest add dialog
npx shadcn-svelte@latest add dropdown-menu</code
	></pre>

<p>
	shadcn-svelte components are fully compatible with <strong>Svelte 5</strong> runes and use
	<code>@render</code> snippets instead of slots for child content.
</p>

<h2>Reactive Utilities: <code>src/lib/hooks/</code></h2>

<p>
	<strong>Svelte 5</strong> runes enable reactive hooks similar to React's custom hooks, but with
	compile-time optimization. The <code>.svelte.ts</code> extension tells the Svelte compiler to process
	runes in these files:
</p>

<h3><code>is-mobile.svelte.ts</code></h3>

<p>
	A reactive hook that tracks viewport width using <code>$state</code> and
	<code>$effect</code>. Returns a boolean that automatically updates when the window resizes. Used
	by the sidebar to determine default open/closed state on mobile.
</p>

<h2>Utility Modules: <code>src/lib/utils/</code></h2>

<table>
	<thead>
		<tr>
			<th>File</th>
			<th>Purpose</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>export.ts</code></td>
			<td
				>Functions to export data tables as CSV or JSON files. Handles column mapping, date
				formatting, and triggers browser download.</td
			>
		</tr>
		<tr>
			<td><code>user-agent.ts</code></td>
			<td
				>Parses user-agent strings to extract browser name and OS. Used in the Settings page to
				display active sessions with device info.</td
			>
		</tr>
	</tbody>
</table>

<h3><code>src/lib/utils.ts</code></h3>

<p>
	The <code>cn()</code> helper function, which combines <code>clsx</code> (conditional class names)
	with <code>tailwind-merge</code> (deduplication of Tailwind classes). Used extensively by shadcn-svelte
	components and throughout the application:
</p>

<pre><code class="language-ts"
		>import &#123; clsx, type ClassValue &#125; from "clsx";
import &#123; twMerge &#125; from "tailwind-merge";

export function cn(...inputs: ClassValue[]) &#123;
  return twMerge(clsx(inputs));
&#125;</code
	></pre>

<h2>App-Level Configuration Files</h2>

<h3><code>src/app.css</code> — Tailwind CSS 4 Theme</h3>

<p>
	<strong>Tailwind CSS 4</strong> replaces the traditional JavaScript config with native CSS.
	SvelteForge defines its design tokens using the <code>@theme</code> directive with OKLCH colors, supporting
	both light and dark modes. This is where you customize the color palette, border radii, fonts, and other
	design tokens.
</p>

<h3><code>src/app.d.ts</code> — TypeScript Definitions</h3>

<p>
	Extends <strong>SvelteKit's</strong> <code>App.Locals</code> interface to include
	<code>user</code> and <code>session</code> properties. This ensures TypeScript knows about the authenticated
	user data available in every server load function and form action:
</p>

<pre><code class="language-ts"
		>declare global &#123;
  namespace App &#123;
    interface Locals &#123;
      user: SessionUser | null;
      session: Session | null;
    &#125;
  &#125;
&#125;</code
	></pre>

<h3><code>src/hooks.server.ts</code> — Server Hooks</h3>

<p>
	<strong>SvelteKit</strong> server hooks run on <strong>every single request</strong>. SvelteForge
	uses this to validate the session cookie, populate <code>event.locals.user</code> and
	<code>event.locals.session</code>, auto-extend session cookies, and update session metadata (user
	agent and IP address). This is the foundation of the authentication system — see
	<a href="/docs/authentication">Authentication</a> for details.
</p>

<h2>Root Configuration Files</h2>

<table>
	<thead>
		<tr>
			<th>File</th>
			<th>Purpose</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>vite.config.ts</code></td>
			<td
				>Vite configuration with the SvelteKit plugin. Marks LayerChart and svelte-ux as <code
					>noExternal</code
				> for SSR compatibility. Configures Vitest.</td
			>
		</tr>
		<tr>
			<td><code>drizzle.config.ts</code></td>
			<td
				>Drizzle ORM configuration pointing to <code>src/lib/server/db/schema.ts</code> as the
				schema source and <code>svelteforge.db</code> as the SQLite database file.</td
			>
		</tr>
		<tr>
			<td><code>svelte.config.js</code></td>
			<td>Svelte compiler configuration with the Vite adapter and <code>$lib</code> alias setup.</td
			>
		</tr>
		<tr>
			<td><code>package.json</code></td>
			<td
				>Project dependencies and npm scripts. Key scripts: <code>dev</code>, <code>build</code>,
				<code>check</code>, <code>db:push</code>, <code>db:seed</code>, <code>test</code>.</td
			>
		</tr>
		<tr>
			<td><code>tsconfig.json</code></td>
			<td>TypeScript configuration extending SvelteKit's recommended settings.</td>
		</tr>
		<tr>
			<td><code>.env.example</code></td>
			<td
				>Template for environment variables: OAuth client IDs/secrets, ORIGIN, and database path.</td
			>
		</tr>
	</tbody>
</table>

<h2>Database File</h2>

<p>
	The SQLite database file <code>svelteforge.db</code> lives at the project root. It is
	<strong>gitignored</strong> and created automatically when you run <code>pnpm db:push</code>. The
	database runs in WAL (Write-Ahead Logging) mode for better concurrent read performance. You will
	also see <code>svelteforge.db-shm</code> and <code>svelteforge.db-wal</code> files — these are WAL support
	files managed by SQLite.
</p>

<p>
	To inspect the database visually, use <code>pnpm db:studio</code> to open Drizzle Studio in your browser.
</p>

<h2>Need More?</h2>

<div
	class="not-prose border-primary/30 bg-primary/5 my-8 rounded-xl border-2 border-dashed p-6 sm:p-8"
>
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
		<div class="flex-1">
			<h3 class="text-foreground text-lg font-bold sm:text-xl">Go Premium with DashboardPack</h3>
			<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
				SvelteForge Admin gives you a clean, well-organized <strong>Svelte 5</strong> +
				<strong>SvelteKit</strong> foundation. When your project outgrows it — 50+ pages, multiple dashboard
				layouts, advanced CRUD generators, theme customizers, and production-grade components — DashboardPack
				has you covered.
			</p>
			<ul class="text-muted-foreground mt-3 space-y-1 text-sm">
				<li>
					<strong>Apex</strong> — Enterprise admin with 5 unique dashboards and 50+ pages
				</li>
				<li>
					<strong>Zenith</strong> — Modern analytics dashboard with advanced data visualization
				</li>
				<li>
					<strong>Signal</strong> — Real-time monitoring dashboard with live data feeds
				</li>
				<li>
					<strong>Ember</strong> — Sleek SaaS dashboard with subscription management
				</li>
				<li>
					<strong>Flux</strong> — Minimalist admin with focus on speed and simplicity
				</li>
			</ul>
		</div>
		<div class="flex shrink-0 flex-col gap-2">
			<a
				href="https://dashboardpack.com/?utm_source=svelteforge&utm_medium=docs&utm_campaign=premium"
				target="_blank"
				rel="noopener noreferrer"
				class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
			>
				Go Premium
			</a>
			<a
				href="https://dashboardpack.com/theme-details/apex-nextjs/?utm_source=svelteforge&utm_medium=docs&utm_campaign=premium"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary hover:text-primary/80 text-center text-xs font-medium transition-colors"
			>
				Preview Apex
			</a>
		</div>
	</div>
</div>
