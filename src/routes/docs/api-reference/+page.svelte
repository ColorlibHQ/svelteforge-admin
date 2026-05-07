<svelte:head>
	<title>API Reference - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="Complete API reference for SvelteForge Admin — auth module, OAuth, database, ID generation, export utilities, and API endpoints. All typed with TypeScript for Svelte 5 and SvelteKit."
	/>
</svelte:head>

<h1>API Reference</h1>

<p>
	SvelteForge Admin exposes server-side utilities for authentication, database access, data export,
	and ID generation — all fully typed with TypeScript. These modules power the
	<strong>Svelte 5</strong> and <strong>SvelteKit</strong> application and are available for use in your
	own server routes, form actions, and hooks.
</p>

<p>
	All server-side modules live in <code>$lib/server/</code>, which
	<strong>SvelteKit</strong> guarantees will never be included in client-side bundles. Client-safe
	utilities are in <code>$lib/utils/</code> and <code>$lib/utils.ts</code>.
</p>

<h2>Auth Module</h2>

<p>
	<code>$lib/server/auth.ts</code> — Session management with SHA-256 hashed tokens, automatic
	session extension, and secure cookie handling. This is the core authentication layer for your
	<strong>SvelteKit</strong> application.
</p>

<h3><code>generateSessionToken(): string</code></h3>

<p>
	Generates a cryptographically random session token. Uses 20 bytes of randomness encoded as base32
	(lowercase, no padding).
</p>

<pre><code class="language-typescript"
		>import &#123; generateSessionToken &#125; from "$lib/server/auth.js";

const token = generateSessionToken();
// => "4bv7h2xk9qm3np6wr8yta5cj2dfs7g"</code
	></pre>

<h3><code>hashToken(token: string): string</code></h3>

<p>
	Computes the SHA-256 hash of a session token. The hash is stored in the database as the session ID
	— the raw token is never persisted.
</p>

<pre><code class="language-typescript"
		>import &#123; hashToken &#125; from "$lib/server/auth.js";

const sessionId = hashToken(token);
// => hex-encoded SHA-256 hash</code
	></pre>

<h3><code>createSession(token, userId, metadata): Session</code></h3>

<p>
	Creates a new session in the database. The token is hashed before storage. Metadata (user agent
	and IP address) is recorded for security auditing.
</p>

<pre><code class="language-typescript"
		>import &#123; generateSessionToken, createSession &#125; from "$lib/server/auth.js";

const token = generateSessionToken();
const session = createSession(token, user.id, &#123;
  userAgent: event.request.headers.get("user-agent") || "",
  ipAddress: event.getClientAddress(),
&#125;);
// session.id = SHA-256 hash of token
// session.expiresAt = Date.now() + 30 days</code
	></pre>

<h3>
	<code
		>validateSession(token): &#123; session, user &#125; | &#123; session: null, user: null &#125;</code
	>
</h3>

<p>
	Validates a session token by hashing it and looking up the session in the database. If the session
	is valid but less than 15 days from expiry, it is automatically extended for another 30 days.
	Returns the session and user objects, or <code>null</code> for both if invalid or expired.
</p>

<pre><code class="language-typescript"
		>import &#123; validateSession &#125; from "$lib/server/auth.js";

const result = validateSession(token);
if (result.session) &#123;
  // Authenticated — result.user has the SessionUser data
  console.log(result.user.email, result.user.role);
&#125; else &#123;
  // Invalid or expired token
&#125;</code
	></pre>

<h3><code>invalidateSession(sessionId: string): void</code></h3>

<p>Deletes a single session from the database. Used during logout.</p>

<pre><code class="language-typescript"
		>import &#123; invalidateSession &#125; from "$lib/server/auth.js";

invalidateSession(session.id);</code
	></pre>

<h3><code>invalidateAllSessions(userId: string): void</code></h3>

<p>
	Deletes all sessions for a specific user. Useful for "log out everywhere" or after a password
	change.
</p>

<pre><code class="language-typescript"
		>import &#123; invalidateAllSessions &#125; from "$lib/server/auth.js";

// Force logout on all devices
invalidateAllSessions(user.id);</code
	></pre>

<h3><code>setSessionCookie(event, token, expiresAt): void</code></h3>

<p>
	Sets the session cookie on the response. The cookie is <code>httpOnly</code>,
	<code>sameSite=lax</code>, <code>path=/</code>, and <code>secure</code> in production (when
	<code>NODE_ENV=production</code>).
</p>

<pre><code class="language-typescript"
		>import &#123; setSessionCookie &#125; from "$lib/server/auth.js";

setSessionCookie(event, token, session.expiresAt);</code
	></pre>

<h3><code>deleteSessionCookie(event): void</code></h3>

<p>Clears the session cookie by setting it to an empty value with an immediate expiry.</p>

<pre><code class="language-typescript"
		>import &#123; deleteSessionCookie &#125; from "$lib/server/auth.js";

deleteSessionCookie(event);</code
	></pre>

<h3>Type: <code>SessionUser</code></h3>

<p>
	The user object returned by <code>validateSession()</code> and available in
	<code>event.locals.user</code> throughout your <strong>SvelteKit</strong> application:
</p>

<pre><code class="language-typescript"
		>type SessionUser = &#123;
  id: string;
  email: string;
  username: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  avatarUrl: string | null;
&#125;;</code
	></pre>

<h2>OAuth Module</h2>

<p>
	<code>$lib/server/oauth.ts</code> — Arctic OAuth providers for Google and GitHub. Providers are
	conditionally initialized based on environment variables, making OAuth entirely optional in your
	<strong>SvelteKit</strong> deployment.
</p>

<h3><code>google: Google | null</code></h3>

<p>
	Arctic Google OAuth provider instance. Returns <code>null</code> when
	<code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> environment variables are not set.
</p>

<pre><code class="language-typescript"
		>import &#123; google &#125; from "$lib/server/oauth.js";

if (google) &#123;
  const url = google.createAuthorizationURL(state, codeVerifier, &#123;
    scopes: ["openid", "profile", "email"],
  &#125;);
&#125;</code
	></pre>

<h3><code>github: GitHub | null</code></h3>

<p>
	Arctic GitHub OAuth provider instance. Returns <code>null</code> when
	<code>GITHUB_CLIENT_ID</code> and <code>GITHUB_CLIENT_SECRET</code> environment variables are not set.
</p>

<pre><code class="language-typescript"
		>import &#123; github &#125; from "$lib/server/oauth.js";

if (github) &#123;
  const url = github.createAuthorizationURL(state, &#123;
    scopes: ["user:email"],
  &#125;);
&#125;</code
	></pre>

<h3><code>getEnabledProviders(): string[]</code></h3>

<p>
	Returns an array of provider names that are currently configured. Used by the login page to
	conditionally render social login buttons.
</p>

<pre><code class="language-typescript"
		>import &#123; getEnabledProviders &#125; from "$lib/server/oauth.js";

const providers = getEnabledProviders();
// => ["google", "github"] or ["google"] or []</code
	></pre>

<h2>Database</h2>

<p>
	<code>$lib/server/db/index.ts</code> — Drizzle ORM instance configured with SQLite
	(better-sqlite3) in WAL mode. Provides full type inference from the schema for use in
	<strong>SvelteKit</strong> server routes and form actions.
</p>

<h3><code>db</code></h3>

<p>
	The Drizzle ORM instance with the full schema loaded. Supports both the SQL-like query builder and
	the relational query API.
</p>

<pre><code class="language-typescript"
		>import &#123; db &#125; from "$lib/server/db/index.js";
import &#123; users &#125; from "$lib/server/db/schema.js";
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
	All tables are exported from <code>$lib/server/db/schema.ts</code> and available through the
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
			<td>Active sessions with hashed tokens, expiry, and metadata</td>
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
			<td><code>oauthAccounts</code></td>
			<td>Linked OAuth provider accounts (Google, GitHub)</td>
		</tr>
		<tr>
			<td><code>appSettings</code></td>
			<td>Key-value application configuration</td>
		</tr>
		<tr>
			<td><code>passwordResetTokens</code></td>
			<td>Time-limited password reset tokens with hashed values</td>
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
  OAuthAccount,
  AppSetting,
  PasswordResetToken,
&#125; from "$lib/server/db/schema.js";</code
	></pre>

<h2>ID Generator</h2>

<p>
	<code>$lib/server/id.ts</code> — Cryptographic random ID generation used for all entity
	identifiers throughout the <strong>SvelteKit</strong> application.
</p>

<h3><code>generateId(length?: number): string</code></h3>

<p>
	Generates a cryptographically random ID using <code>crypto.getRandomValues()</code>, encoded as
	base32 lowercase without padding. Default length is 15 bytes, producing a 24-character string with
	120 bits of entropy.
</p>

<pre><code class="language-typescript"
		>import &#123; generateId &#125; from "$lib/server/id.js";

const userId = generateId();       // 24 chars, 120 bits of entropy
const shortId = generateId(10);    // 16 chars, 80 bits of entropy</code
	></pre>

<p>
	Used for all entity IDs: users, sessions, pages, notifications, OAuth accounts, password reset
	tokens, and app settings.
</p>

<h2>Export Utilities</h2>

<p>
	<code>$lib/utils/export.ts</code> — Client-side data export functions that trigger browser
	downloads. Used by the user management and content management pages in the
	<strong>Svelte 5</strong> application.
</p>

<h3><code>exportToCSV(data, filename): void</code></h3>

<p>
	Converts an array of objects to CSV format with proper escaping (handles commas, quotes, and
	newlines in values) and triggers a browser download.
</p>

<pre><code class="language-typescript"
		>import &#123; exportToCSV &#125; from "$lib/utils/export.js";

// Triggers download of "users.csv"
exportToCSV(users, "users.csv");</code
	></pre>

<h3><code>exportToJSON(data, filename): void</code></h3>

<p>
	Converts an array of objects to pretty-printed JSON (2-space indentation) and triggers a browser
	download.
</p>

<pre><code class="language-typescript"
		>import &#123; exportToJSON &#125; from "$lib/utils/export.js";

// Triggers download of "users.json"
exportToJSON(users, "users.json");</code
	></pre>

<p>
	Both functions work by creating a <code>Blob</code>, generating an object URL, programmatically
	clicking a hidden anchor element, and then revoking the URL to free memory.
</p>

<h2>User-Agent Parser</h2>

<p>
	<code>$lib/utils/user-agent.ts</code> — Lightweight user-agent string parser used by the session management
	UI to display readable browser, OS, and device information.
</p>

<h3><code>parseUserAgent(ua: string): &#123; browser, os, device &#125;</code></h3>

<p>Parses a user-agent string and returns structured information about the client.</p>

<pre><code class="language-typescript"
		>import &#123; parseUserAgent &#125; from "$lib/utils/user-agent.js";

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
	<code>$lib/utils.ts</code> — Shared utility functions used across the
	<strong>Svelte 5</strong> application.
</p>

<h3><code>cn(...inputs: ClassValue[]): string</code></h3>

<p>
	Combines <code>clsx</code> (conditional class merging) with <code>tailwind-merge</code>
	(Tailwind CSS class deduplication). The standard pattern for dynamic class names in shadcn-svelte components.
</p>

<pre><code class="language-typescript"
		>import &#123; cn &#125; from "$lib/utils.js";

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
		>import type &#123; WithoutChild, WithoutChildren, WithElementRef &#125; from "$lib/utils.js";

// WithoutChild&lt;T&gt; — removes the "child" snippet prop
// WithoutChildren&lt;T&gt; — removes the "children" snippet prop
// WithElementRef&lt;T, E&gt; — adds a typed element ref prop</code
	></pre>

<h2>API Endpoints</h2>

<p>SvelteForge Admin includes two API endpoints accessible via standard HTTP requests.</p>

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
					<strong>Apex</strong> — RESTful API with OpenAPI 3.0 docs, CRUD endpoints, and webhook event
					system
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
