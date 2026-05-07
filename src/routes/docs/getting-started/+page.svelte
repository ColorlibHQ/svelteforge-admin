<svelte:head>
	<title>Getting Started - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="Install and set up SvelteForge Admin — a SvelteKit 2 + Svelte 5 admin dashboard with auth, RBAC, and database seeding."
	/>
</svelte:head>

<h1>Getting Started</h1>

<p>
	Get SvelteForge Admin running locally in under five minutes. The project uses
	<strong>SvelteKit</strong> with <strong>Svelte 5</strong>, so the development experience is fast —
	hot module replacement, instant server restarts, and type-safe routing out of the box.
</p>

<h2>Prerequisites</h2>

<ul>
	<li><strong>Node.js 18+</strong> (LTS recommended)</li>
	<li>
		<strong>pnpm</strong> — Install globally with <code>npm install -g pnpm</code> if you don't have it
	</li>
</ul>

<h2>Installation</h2>

<h3>1. Clone the repository</h3>

<pre><code class="language-bash"
		>git clone https://github.com/your-org/svelteforge-admin.git
cd svelteforge-admin</code
	></pre>

<h3>2. Install dependencies</h3>

<pre><code class="language-bash">pnpm install</code></pre>

<h3>3. Set up the database</h3>

<p>
	SvelteForge uses <strong>Drizzle ORM</strong> with <strong>SQLite</strong> (via better-sqlite3 in WAL
	mode). Push the schema to create the database file:
</p>

<pre><code class="language-bash">pnpm db:push</code></pre>

<p>
	This creates <code>svelteforge.db</code> in the project root with all tables: users, sessions, pages,
	notifications, oauthAccounts, appSettings, and passwordResetTokens.
</p>

<h3>4. Seed with sample data</h3>

<pre><code class="language-bash">pnpm db:seed</code></pre>

<p>The seed script populates the database with realistic sample data:</p>

<table>
	<thead>
		<tr>
			<th>Data</th>
			<th>Count</th>
			<th>Details</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><strong>Users</strong></td>
			<td>50</td>
			<td>3 with known credentials (see below), 47 randomly generated</td>
		</tr>
		<tr>
			<td><strong>Pages</strong></td>
			<td>65</td>
			<td>Mix of draft, published, and archived content</td>
		</tr>
		<tr>
			<td><strong>Notifications</strong></td>
			<td>33</td>
			<td>Various types: info, success, warning, error</td>
		</tr>
		<tr>
			<td><strong>App Settings</strong></td>
			<td>4</td>
			<td>Site name, description, maintenance mode, registration toggle</td>
		</tr>
	</tbody>
</table>

<h3>5. Start the dev server</h3>

<pre><code class="language-bash">pnpm dev</code></pre>

<p>
	Open <a href="http://localhost:5173">http://localhost:5173</a> in your browser. SvelteKit's dev server
	provides instant hot module replacement — changes to Svelte components, server code, and styles reflect
	immediately.
</p>

<h2>Default Login Credentials</h2>

<p>After seeding, you can log in with any of these accounts to test different permission levels:</p>

<table>
	<thead>
		<tr>
			<th>Username</th>
			<th>Password</th>
			<th>Role</th>
			<th>Permissions</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>admin</code></td>
			<td><code>password123</code></td>
			<td>Admin</td>
			<td>Full access — manage users, content, settings, roles</td>
		</tr>
		<tr>
			<td><code>editor</code></td>
			<td><code>password123</code></td>
			<td>Editor</td>
			<td>Create and edit content, view analytics</td>
		</tr>
		<tr>
			<td><code>viewer</code></td>
			<td><code>password123</code></td>
			<td>Viewer</td>
			<td>Read-only access to dashboards and content</td>
		</tr>
	</tbody>
</table>

<p>
	<strong>Note:</strong> If you register a new account on a fresh database (before seeding), the
	<strong>first registered user automatically receives the admin role</strong>. Subsequent
	registrations default to the viewer role.
</p>

<h2>Environment Variables</h2>

<p>
	Create a <code>.env</code> file in the project root. Copy from <code>.env.example</code> if available:
</p>

<pre><code class="language-bash"
		># Database
DATABASE_URL=svelteforge.db

# Application
ORIGIN=http://localhost:5173

# OAuth (optional — providers are disabled when not set)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=</code
	></pre>

<table>
	<thead>
		<tr>
			<th>Variable</th>
			<th>Required</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>DATABASE_URL</code></td>
			<td>Yes</td>
			<td>Path to the SQLite database file</td>
		</tr>
		<tr>
			<td><code>ORIGIN</code></td>
			<td>Yes</td>
			<td>Application URL (used for CSRF protection and OAuth callbacks)</td>
		</tr>
		<tr>
			<td><code>GOOGLE_CLIENT_ID</code></td>
			<td>No</td>
			<td>Google OAuth 2.0 client ID</td>
		</tr>
		<tr>
			<td><code>GOOGLE_CLIENT_SECRET</code></td>
			<td>No</td>
			<td>Google OAuth 2.0 client secret</td>
		</tr>
		<tr>
			<td><code>GITHUB_CLIENT_ID</code></td>
			<td>No</td>
			<td>GitHub OAuth app client ID</td>
		</tr>
		<tr>
			<td><code>GITHUB_CLIENT_SECRET</code></td>
			<td>No</td>
			<td>GitHub OAuth app client secret</td>
		</tr>
	</tbody>
</table>

<p>
	OAuth providers are configured in <code>$lib/server/oauth.ts</code> using SvelteKit's
	<code>$env/dynamic/private</code>. When the environment variables are missing, the corresponding
	social login buttons are automatically hidden from the login page. See the
	<a href="/docs/authentication">Authentication docs</a> for full OAuth setup instructions.
</p>

<h2>Available Commands</h2>

<p>
	SvelteForge Admin uses <strong>pnpm</strong> as its package manager. Here are all available scripts:
</p>

<table>
	<thead>
		<tr>
			<th>Command</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>pnpm dev</code></td>
			<td>Start the SvelteKit dev server with HMR</td>
		</tr>
		<tr>
			<td><code>pnpm build</code></td>
			<td>Create a production build</td>
		</tr>
		<tr>
			<td><code>pnpm preview</code></td>
			<td>Preview the production build locally</td>
		</tr>
		<tr>
			<td><code>pnpm check</code></td>
			<td>Run svelte-check for type errors</td>
		</tr>
		<tr>
			<td><code>pnpm check:watch</code></td>
			<td>Type-check in watch mode</td>
		</tr>
		<tr>
			<td><code>pnpm db:push</code></td>
			<td>Push Drizzle schema changes to the database</td>
		</tr>
		<tr>
			<td><code>pnpm db:generate</code></td>
			<td>Generate Drizzle migration files from schema</td>
		</tr>
		<tr>
			<td><code>pnpm db:studio</code></td>
			<td>Open Drizzle Studio GUI for database browsing</td>
		</tr>
		<tr>
			<td><code>pnpm db:seed</code></td>
			<td>Seed the database with sample data</td>
		</tr>
		<tr>
			<td><code>pnpm test</code></td>
			<td>Run all unit tests with Vitest</td>
		</tr>
		<tr>
			<td><code>pnpm test:watch</code></td>
			<td>Run unit tests in watch mode</td>
		</tr>
		<tr>
			<td><code>pnpm test:e2e</code></td>
			<td>Run end-to-end tests with Playwright</td>
		</tr>
		<tr>
			<td><code>pnpm lint</code></td>
			<td>Lint with ESLint 9</td>
		</tr>
		<tr>
			<td><code>pnpm format</code></td>
			<td>Format code with Prettier</td>
		</tr>
		<tr>
			<td><code>pnpm format:check</code></td>
			<td>Check formatting without writing changes</td>
		</tr>
	</tbody>
</table>

<h2>SvelteKit Route Groups</h2>

<p>
	SvelteForge Admin uses <strong>SvelteKit's file-based routing</strong> with route groups to apply different
	layouts and access controls to different sections of the app:
</p>

<pre><code class="language-text"
		>src/routes/
  (app)/          # Protected routes — requires authentication
    dashboard/    # Main dashboard with analytics
    users/        # User management CRUD
    content/      # CMS pages
    analytics/    # Charts and data visualization
    notifications/
    settings/
    roles/
    database/
  (auth)/         # Public auth routes — login, register, OAuth callbacks
    login/
    register/
    forgot-password/
    reset-password/
  (public)/       # Public pages — no auth required
    pricing/
  docs/           # Documentation (you are here)
  api/            # API endpoints
  logout/         # Server-only logout action</code
	></pre>

<p>
	Route groups (directories wrapped in parentheses) do not affect the URL path. They exist purely
	for organizing layouts and middleware. The <code>(app)</code> group has an auth guard in its
	<code>+layout.server.ts</code> that redirects unauthenticated users to <code>/login</code>.
	SvelteKit's <code>hooks.server.ts</code> validates the session on every request and populates
	<code>event.locals.user</code> and <code>event.locals.session</code>.
</p>

<h2>Next Steps</h2>

<ul>
	<li><a href="/docs/project-structure">Project Structure</a> — Understand the codebase layout</li>
	<li>
		<a href="/docs/authentication">Authentication</a> — Configure OAuth and understand the auth flow
	</li>
	<li><a href="/docs/database">Database</a> — Learn the Drizzle ORM schema and migrations</li>
	<li><a href="/docs/routing">Routing</a> — Deep dive into SvelteKit route groups and guards</li>
</ul>

<h2>Need More?</h2>

<div
	class="not-prose border-primary/30 bg-primary/5 my-8 rounded-xl border-2 border-dashed p-6 sm:p-8"
>
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
		<div class="flex-1">
			<h3 class="text-foreground text-lg font-bold sm:text-xl">Scale Up with DashboardPack</h3>
			<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
				SvelteForge Admin is a great starting point. When your project needs advanced features —
				multi-layout dashboards, production CRUD generators, theme customizers, and 50+ pre-built
				pages — explore the premium templates at DashboardPack.
			</p>
			<div class="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
				<a
					href="https://dashboardpack.com/theme-details/apex-nextjs/?utm_source=svelteforge&utm_medium=docs&utm_campaign=premium"
					target="_blank"
					rel="noopener noreferrer"
					class="text-primary hover:underline">Apex</a
				>
				<a
					href="https://dashboardpack.com/theme-details/zenith-nextjs/?utm_source=svelteforge&utm_medium=docs&utm_campaign=premium"
					target="_blank"
					rel="noopener noreferrer"
					class="text-primary hover:underline">Zenith</a
				>
				<a
					href="https://dashboardpack.com/theme-details/signal-nextjs/?utm_source=svelteforge&utm_medium=docs&utm_campaign=premium"
					target="_blank"
					rel="noopener noreferrer"
					class="text-primary hover:underline">Signal</a
				>
				<a
					href="https://dashboardpack.com/theme-details/ember-nextjs/?utm_source=svelteforge&utm_medium=docs&utm_campaign=premium"
					target="_blank"
					rel="noopener noreferrer"
					class="text-primary hover:underline">Ember</a
				>
				<a
					href="https://dashboardpack.com/theme-details/flux-nextjs/?utm_source=svelteforge&utm_medium=docs&utm_campaign=premium"
					target="_blank"
					rel="noopener noreferrer"
					class="text-primary hover:underline">Flux</a
				>
			</div>
		</div>
		<div class="shrink-0">
			<a
				href="https://dashboardpack.com/?utm_source=svelteforge&utm_medium=docs&utm_campaign=premium"
				target="_blank"
				rel="noopener noreferrer"
				class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
			>
				Go Premium
			</a>
		</div>
	</div>
</div>
