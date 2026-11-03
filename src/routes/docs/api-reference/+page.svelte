<svelte:head>
	<title>API Reference - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="Complete API reference for SvelteForge Admin — Better Auth module, database, ID generation, export utilities, and API endpoints. All typed with TypeScript for Svelte 5 and SvelteKit."
	/>
</svelte:head>

<h1>API Reference</h1>

<p>
	SvelteForge Admin exposes server-side utilities for authentication (Better Auth), database access,
	data export, and ID generation — all fully typed with TypeScript. These modules power the
	<strong>Svelte 5</strong> and <strong>SvelteKit</strong> application and are available for use in your
	own server routes, form actions, and hooks.
</p>

<p>
	All server-side modules live in <code>#lib/server/</code>, which
	<strong>SvelteKit</strong> guarantees will never be included in client-side bundles. Client-safe
	utilities are in <code>#lib/utils/</code> and <code>#lib/utils.ts</code>.
</p>

<h2>Auth Module</h2>

<p>
	<code>#lib/server/auth.ts</code> — The configured <strong>Better Auth</strong> instance, plus the
	validation constants and helpers the auth routes share. Better Auth owns sessions, cookies,
	password verification, OAuth, and password resets; see the
	<a href="/docs/authentication">Authentication</a> guide for the full configuration.
</p>

<h3><code>auth</code></h3>

<p>
	The Better Auth instance (username and admin plugins, <code>sveltekitCookies</code>). Server code
	calls its <code>auth.api.*</code> methods and passes the request's headers so Better Auth can read
	the session cookie. A failed call throws an <code>APIError</code>.
</p>

<pre><code class="language-typescript"
		>import &#123; auth &#125; from "#lib/server/auth.js";
import &#123; authFailure &#125; from "#lib/server/auth-errors.js";

// In a form action:
try &#123;
  await auth.api.changePassword(&#123;
    body: &#123; currentPassword, newPassword &#125;,
    headers: request.headers,
  &#125;);
&#125; catch (err) &#123;
  return authFailure(err);
&#125;</code
	></pre>

<h3><code>authFailure(err, fallback?): ActionFailure</code></h3>

<p>
	From <code>#lib/server/auth-errors.ts</code>. Converts a Better Auth <code>APIError</code> into a
	SvelteKit <code>fail()</code> with the error's status and message. Anything that is not an
	<code>APIError</code> (including SvelteKit redirects) is rethrown.
</p>

<h3>Validation constants</h3>

<pre><code class="language-typescript"
		>import &#123;
  USERNAME_PATTERN, // /^[a-z0-9_-]+$/
  USERNAME_MIN,     // 3
  USERNAME_MAX,     // 31
  PASSWORD_MIN,     // 8
  PASSWORD_MAX,     // 255
&#125; from "#lib/server/auth.js";</code
	></pre>

<h3><code>getSession</code> and session cookies</h3>

<p>
	You rarely call these yourself: <code>hooks.server.ts</code> runs
	<code>auth.api.getSession()</code> on every request and fills <code>event.locals</code>. The
	cookie is named <code>better-auth.session_token</code> and is signed with
	<code>BETTER_AUTH_SECRET</code>. Sign out with
	<code>auth.api.signOut(&#123; headers &#125;)</code>, which deletes the session row and clears the
	cookie.
</p>

<p>
	To revoke every other session for the current user, call
	<code>auth.api.revokeOtherSessions(&#123; headers: request.headers &#125;)</code>. To revoke one
	session, call
	<code>auth.api.revokeSession(&#123; body: &#123; token &#125;, headers &#125;)</code>
	with the row's <code>token</code>.
</p>

<h3>Type: <code>SessionUser</code></h3>

<p>
	The user object available in <code>event.locals.user</code> throughout your
	<strong>SvelteKit</strong> application. It is Better Auth's session user with
	<code>username</code>
	and <code>role</code> narrowed to the types the <code>users</code> table guarantees:
</p>

<pre><code class="language-typescript"
		>type SessionUser = Omit&lt;BetterAuthSessionUser, "username" | "role"&gt; &amp; &#123;
  username: string;
  role: "admin" | "editor" | "viewer";
&#125;;
// Includes id, name, email, emailVerified, image (avatar), createdAt, updatedAt, ...</code
	></pre>

<h3><code>getEnabledProviders(): ("google" | "github")[]</code></h3>

<p>
	Returns the OAuth providers that are currently configured (both client ID and secret set). Used by
	the login page to conditionally render social login buttons.
</p>

<pre><code class="language-typescript"
		>import &#123; getEnabledProviders &#125; from "#lib/server/auth.js";

const providers = getEnabledProviders();
// => ["google", "github"] or ["google"] or []</code
	></pre>

<h2>Password and Email Helpers</h2>

<h3>
	<code>hashPassword(password)</code> / <code>verifyPassword(&#123; hash, password &#125;)</code>
</h3>

<p>
	<code>#lib/server/password.ts</code> — Argon2id hashing (19 MiB, 2 iterations) kept from v1 and registered
	with Better Auth, so existing hashes keep working. This module has no SvelteKit imports, so scripts
	such as the seeder and the v2 migration can use it.
</p>

<h3><code>sendAuthEmail(&#123; to, subject, text, url &#125;)</code></h3>

<p>
	<code>#lib/server/email.ts</code> — Every auth email (password reset, email-change confirmation,
	verification) goes through this one function. The default implementation logs the message and link
	to the server console and, when <code>AUTH_EMAIL_OUTBOX</code> is set, appends it as a JSON line to
	that file. Replace the body with your email provider.
</p>

<h3>Permissions</h3>

<p>
	<code>#lib/permissions.ts</code> exports <code>ac</code> (access control statements) and
	<code>roles</code> (<code>admin</code>, <code>editor</code>, <code>viewer</code>) for the admin
	plugin. Only admins can list, create, update, delete, ban, or change the role of users and list or
	revoke sessions. No role can impersonate users in the free edition.
</p>

<h2>Database</h2>

<p>
	<code>#lib/server/db/index.ts</code> — Drizzle ORM instance configured with SQLite
	(better-sqlite3) in WAL mode. Provides full type inference from the schema for use in
	<strong>SvelteKit</strong> server routes and form actions.
</p>

<h3><code>db</code></h3>

<p>
	The Drizzle ORM instance with the full schema loaded. Supports both the SQL-like query builder and
	the relational query API.
</p>

<pre><code class="language-typescript"
		>import &#123; db &#125; from "#lib/server/db/index.js";
import &#123; users &#125; from "#lib/server/db/schema.js";
import &#123; eq &#125; from "drizzle-orm";

// SQL-like query builder
const allUsers = await db.select().from(users);

// Relational query API
const user = await db.query.users.findFirst(&#123;
  where: eq(users.email, "admin@svelteforge.dev"),
&#125;);</code
	></pre>

<h3>Schema Tables</h3>

<p>
	All tables are exported from <code>#lib/server/db/schema.ts</code> and available through the
	<code>db</code> instance:
</p>

<table>
	<thead>
		<tr>
			<th>Table</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>users</code></td>
			<td>User accounts with role-based access control (admin, editor, viewer)</td>
		</tr>
		<tr>
			<td><code>sessions</code></td>
			<td>Active Better Auth sessions with token, expiry, and metadata</td>
		</tr>
		<tr>
			<td><code>pages</code></td>
			<td>CMS content with templates (default, landing, blog) and status workflow</td>
		</tr>
		<tr>
			<td><code>notifications</code></td>
			<td>User and global notifications with read/unread tracking</td>
		</tr>
		<tr>
			<td><code>accounts</code></td>
			<td
				>Login methods per user: credential (Argon2id password) and OAuth links (Google, GitHub)</td
			>
		</tr>
		<tr>
			<td><code>appSettings</code></td>
			<td>Key-value application configuration</td>
		</tr>
		<tr>
			<td><code>verifications</code></td>
			<td
				>Short-lived hashed tokens for password resets, email-change confirmations, and OAuth state</td
			>
		</tr>
	</tbody>
</table>

<h3>Type Exports</h3>

<p>
	Inferred TypeScript types for all database entities, available for use in your
	<strong>Svelte 5</strong> components and <strong>SvelteKit</strong> server routes:
</p>

<pre><code class="language-typescript"
		>import type &#123;
  User,
  Session,
  Page,
  Notification,
  Account,
  Verification,
  AppSetting,
&#125; from "#lib/server/db/schema.js";</code
	></pre>

<h2>ID Generator</h2>

<p>
	<code>#lib/server/id.ts</code> — Cryptographic random ID generation used for all entity
	identifiers throughout the <strong>SvelteKit</strong> application.
</p>

<h3><code>generateId(length?: number): string</code></h3>

<p>
	Generates a cryptographically random ID using <code>node:crypto</code>'s
	<code>randomBytes()</code>, encoded as base32 lowercase without padding. Default length is 15
	bytes, producing a 24-character string with 120 bits of entropy.
</p>

<pre><code class="language-typescript"
		>import &#123; generateId &#125; from "#lib/server/id.js";

const userId = generateId();       // 24 chars, 120 bits of entropy
const shortId = generateId(10);    // 16 chars, 80 bits of entropy</code
	></pre>

<p>
	Used for application row IDs: pages, notifications, and seed data. The auth tables (users,
	sessions, accounts, verifications) use Better Auth's own ID generator.
</p>

<h2>Export Utilities</h2>

<p>
	<code>#lib/utils/export.ts</code> — Client-side data export functions that trigger browser
	downloads. Used by the user management and content management pages in the
	<strong>Svelte 5</strong> application.
</p>

<h3><code>exportToCSV(data, filename): void</code></h3>

<p>
	Converts an array of objects to CSV format with proper escaping (handles commas, quotes, and
	newlines in values) and triggers a browser download.
</p>

<pre><code class="language-typescript"
		>import &#123; exportToCSV &#125; from "#lib/utils/export.js";

// Triggers download of "users.csv"
exportToCSV(users, "users.csv");</code
	></pre>

<h3><code>exportToJSON(data, filename): void</code></h3>

<p>
	Converts an array of objects to pretty-printed JSON (2-space indentation) and triggers a browser
	download.
</p>

<pre><code class="language-typescript"
		>import &#123; exportToJSON &#125; from "#lib/utils/export.js";

// Triggers download of "users.json"
exportToJSON(users, "users.json");</code
	></pre>

<p>
	Both functions work by creating a <code>Blob</code>, generating an object URL, programmatically
	clicking a hidden anchor element, and then revoking the URL to free memory.
</p>

<h2>User-Agent Parser</h2>

<p>
	<code>#lib/utils/user-agent.ts</code> — Lightweight user-agent string parser used by the session management
	UI to display readable browser, OS, and device information.
</p>

<h3><code>parseUserAgent(ua: string): &#123; browser, os, device &#125;</code></h3>

<p>Parses a user-agent string and returns structured information about the client.</p>

<pre><code class="language-typescript"
		>import &#123; parseUserAgent &#125; from "#lib/utils/user-agent.js";

const info = parseUserAgent(
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
);
// => &#123; browser: "Chrome", os: "macOS", device: "Desktop" &#125;</code
	></pre>

<table>
	<thead>
		<tr>
			<th>Field</th>
			<th>Detected Values</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><strong>browser</strong></td>
			<td>Edge, Opera, Chrome, Firefox, Safari, or "Unknown"</td>
		</tr>
		<tr>
			<td><strong>os</strong></td>
			<td>Windows, macOS, Android, iOS, iPadOS, Linux, ChromeOS, or "Unknown"</td>
		</tr>
		<tr>
			<td><strong>device</strong></td>
			<td>Mobile, Tablet, Desktop</td>
		</tr>
	</tbody>
</table>

<h2>Utility Helpers</h2>

<p>
	<code>#lib/utils.ts</code> — Shared utility functions used across the
	<strong>Svelte 5</strong> application.
</p>

<h3><code>cn(...inputs: ClassValue[]): string</code></h3>

<p>
	Combines <code>clsx</code> (conditional class merging) with <code>tailwind-merge</code>
	(Tailwind CSS class deduplication). The standard pattern for dynamic class names in shadcn-svelte components.
</p>

<pre><code class="language-typescript"
		>import &#123; cn &#125; from "#lib/utils.js";

// Conditional classes with Tailwind deduplication
const classes = cn(
  "px-4 py-2 rounded-md",
  isActive && "bg-primary text-primary-foreground",
  isDisabled && "opacity-50 cursor-not-allowed"
);
// Tailwind-merge prevents conflicts like "px-4 px-2" => "px-2"</code
	></pre>

<h3>Type Utilities</h3>

<p>
	Helper types for shadcn-svelte component composition. These strip children/child snippet props to
	allow wrapping components without type conflicts:
</p>

<pre><code class="language-typescript"
		>import type &#123; WithoutChild, WithoutChildren, WithElementRef &#125; from "#lib/utils.js";

// WithoutChild&lt;T&gt; — removes the "child" snippet prop
// WithoutChildren&lt;T&gt; — removes the "children" snippet prop
// WithElementRef&lt;T, E&gt; — adds a typed element ref prop</code
	></pre>

<h2>API Endpoints</h2>

<p>
	SvelteForge Admin includes a few API endpoints accessible via standard HTTP requests, plus Better
	Auth's own endpoints under <code>/api/auth/*</code>.
</p>

<h3><code>/api/auth/*</code></h3>

<p>
	Handled by Better Auth through <code>svelteKitHandler</code> in <code>hooks.server.ts</code>. The
	important ones for setup are the OAuth callbacks (<code>/api/auth/callback/google</code> and
	<code>/api/auth/callback/github</code>) and the password reset link handler. The app's own forms
	call <code>auth.api.*</code> directly, but the HTTP endpoints are live too, which is why the
	demo-account and last-admin guards are implemented in Better Auth's <code>hooks.before</code> rather
	than in the form actions.
</p>

<h3><code>GET /api/search?q=&#123;query&#125;</code></h3>

<p>
	Full-text search across users, pages, and notifications. Returns categorized results with icons.
	Powers the command palette (Cmd+K / Ctrl+K) in the <strong>Svelte 5</strong> application shell.
</p>

<pre><code class="language-typescript"
		>// Request
GET /api/search?q=admin

// Response
&#123;
  "results": [
    &#123;
      "title": "Admin User",
      "description": "admin@svelteforge.dev",
      "url": "/users",
      "category": "Users",
      "icon": "users"
    &#125;,
    &#123;
      "title": "Admin Dashboard Settings",
      "description": "Configure dashboard preferences",
      "url": "/content/admin-dashboard-settings",
      "category": "Pages",
      "icon": "file-text"
    &#125;
  ]
&#125;</code
	></pre>

<p>
	The search endpoint queries all three tables using SQL <code>LIKE</code> patterns and returns a unified
	result set. Results are limited to prevent large responses.
</p>

<h3><code>GET /sitemap.xml</code></h3>

<p>
	Auto-generated XML sitemap for SEO. Returns all published page URLs in standard sitemap format.
	This <strong>SvelteKit</strong> server route dynamically queries the pages table for published content.
</p>

<h2>App.Locals Type</h2>

<p>
	<strong>SvelteKit</strong> populates <code>event.locals</code> on every request via the
	<code>hooks.server.ts</code> hook. The type is defined in <code>src/app.d.ts</code>:
</p>

<pre><code class="language-typescript"
		>// src/app.d.ts
declare global &#123;
  namespace App &#123;
    interface Locals &#123;
      user: SessionUser | null;
      session: Session | null;
    &#125;
  &#125;
&#125;</code
	></pre>

<p>
	<code>event.locals.user</code> and <code>event.locals.session</code> are available in all
	<strong>SvelteKit</strong> server-side code: <code>+page.server.ts</code> load functions, form
	actions, <code>+server.ts</code> API routes, and hooks.
</p>

<pre><code class="language-typescript"
		>// Example: +page.server.ts
export const load = async (event) =&gt; &#123;
  const user = event.locals.user;
  if (!user) redirect(302, "/login");

  return &#123;
    user,
    // ... load page data
  &#125;;
&#125;;</code
	></pre>

<h2>Next Steps</h2>

<ul>
	<li>
		<a href="/docs/authentication">Authentication</a> — Full auth flow walkthrough with OAuth setup
	</li>
	<li><a href="/docs/database">Database</a> — Complete schema reference and query patterns</li>
	<li>
		<a href="/docs/deployment">Deployment</a> — Production deployment with Docker, Railway, Fly.io
	</li>
</ul>

<h2>Need More?</h2>

<div
	class="not-prose border-primary/30 bg-primary/5 my-8 rounded-xl border-2 border-dashed p-6 sm:p-8"
>
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
		<div class="flex-1">
			<h3 class="text-foreground text-lg font-bold sm:text-xl">Full API with DashboardPack</h3>
			<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
				Need a full REST API with OpenAPI docs, webhook support, and third-party integrations?
				DashboardPack premium templates include complete API layers with authentication, rate
				limiting, pagination, filtering, and auto-generated documentation — ready for your <strong
					>Svelte 5</strong
				>
				and <strong>SvelteKit</strong> frontend.
			</p>
			<ul class="text-muted-foreground mt-3 space-y-1 text-sm">
				<li>
					<strong>Apex (Svelte)</strong> — SvelteKit admin with 6 dashboards, full CRUD modals, and reactive
					data tables system
				</li>
				<li>
					<strong>Zenith</strong> — GraphQL API with subscriptions, real-time data streaming, and query
					optimization
				</li>
				<li>
					<strong>Signal</strong> — API monitoring dashboard with request logging, error tracking, and
					performance metrics
				</li>
			</ul>
		</div>
		<div class="flex shrink-0 flex-col gap-2">
			<a
				href="https://dashboardpack.com/theme-details/svelteforge-premium/?utm_source=svelteforge&utm_medium=docs&utm_content=docs-api-reference&utm_campaign=upgrade-svelteforge-premium"
				target="_blank"
				rel="noopener noreferrer"
				class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
			>
				Go Premium
			</a>
			<a
				href="https://dashboardpack.com/theme-details/apex-dashboard-svelte/?utm_source=svelteforge&utm_medium=docs&utm_campaign=premium"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary hover:text-primary/80 text-center text-xs font-medium transition-colors"
			>
				Preview Apex (Svelte)
			</a>
		</div>
	</div>
</div>

<h2>Release Health</h2>
<p>
	<code>GET /api/health</code> returns the status, package version, and build commit. It is public
	and uses <code>Cache-Control: no-store</code>; deployment checks its commit against GitHub.
</p>
