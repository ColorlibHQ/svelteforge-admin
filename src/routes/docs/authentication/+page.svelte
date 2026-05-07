<svelte:head>
	<title>Authentication - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="Deep dive into SvelteForge Admin's custom session-based authentication built with Svelte 5, SvelteKit server hooks, @oslojs/crypto, Argon2id, and Arctic OAuth."
	/>
</svelte:head>

<h1>Authentication</h1>

<p>
	SvelteForge Admin implements authentication from scratch using <strong>SvelteKit's</strong> server infrastructure
	— no Lucia, no Auth.js, no external auth framework. The entire system is built on three low-level libraries:
</p>

<ul>
	<li>
		<strong>@oslojs/crypto</strong> — SHA-256 hashing for session tokens
	</li>
	<li>
		<strong>@oslojs/encoding</strong> — Base32 and hex encoding
	</li>
	<li>
		<strong>@node-rs/argon2</strong> — Argon2id password hashing (memory-hard, GPU-resistant)
	</li>
</ul>

<p>
	By owning the auth code, you get full control over session lifetimes, cookie settings, metadata
	tracking, and token rotation — with zero dependency on third-party auth services. This approach
	leverages <strong>SvelteKit's</strong> server hooks, form actions, and server-only modules to keep sensitive
	logic completely off the client.
</p>

<h2>Session Management</h2>

<p>
	All session logic lives in <code>src/lib/server/auth.ts</code> — a server-only module that
	<strong>SvelteKit</strong> guarantees will never leak to the client bundle. The module exports five
	core functions:
</p>

<h3><code>generateSessionToken()</code></h3>

<p>
	Creates a cryptographically secure session token using 20 bytes of randomness, encoded as base32
	(no padding). This token is what gets stored in the user's cookie:
</p>

<pre><code class="language-ts"
		>export function generateSessionToken(): string &#123;
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
&#125;</code
	></pre>

<p>
	The Web Crypto API (<code>crypto.getRandomValues</code>) provides the randomness — it is available
	in both Node.js and all modern runtimes that <strong>SvelteKit</strong> deploys to.
</p>

<h3><code>hashToken()</code></h3>

<p>
	Hashes the raw session token with SHA-256 before storing it in the database. This is a critical
	security measure: the raw token lives only in the user's httpOnly cookie, while the database
	stores only the hash. If the database is compromised, attackers cannot recover valid session
	tokens.
</p>

<pre><code class="language-ts"
		>function hashToken(token: string): string &#123;
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
&#125;</code
	></pre>

<p>
	SHA-256 is intentionally used here instead of Argon2. Session tokens are already high-entropy
	random values — they do not need the slow, memory-hard hashing that passwords require. SHA-256 is
	fast, deterministic, and perfectly secure for this use case.
</p>

<h3><code>createSession()</code></h3>

<p>
	Creates a new session in the database. The token is hashed to produce the session ID, and metadata
	(user agent, IP address) is stored alongside it for security auditing:
</p>

<pre><code class="language-ts"
		>export async function createSession(
  token: string,
  userId: string,
  metadata?: &#123; userAgent?: string | null; ipAddress?: string | null &#125;
): Promise&lt;Session&gt; &#123;
  const sessionId = hashToken(token);
  const expiresAt = Date.now() + SESSION_LIFETIME_MS; // 30 days

  const session: Session = &#123;
    id: sessionId,
    userId,
    expiresAt,
    userAgent: metadata?.userAgent ?? null,
    ipAddress: metadata?.ipAddress ?? null,
    createdAt: new Date(),
  &#125;;

  await db.insert(sessions).values(session);
  return session;
&#125;</code
	></pre>

<p>
	Sessions have a <strong>30-day lifetime</strong> by default, configurable via the
	<code>SESSION_LIFETIME_MS</code> constant.
</p>

<h3><code>validateSession()</code></h3>

<p>
	Validates a session token by hashing it and looking up the result in the database. Handles two key
	scenarios:
</p>

<ol>
	<li>
		<strong>Expired session</strong> — Deletes the session from the database and returns
		<code>null</code>
	</li>
	<li>
		<strong>Session nearing expiry</strong> — If less than 15 days remain, the session is automatically
		extended to a fresh 30-day window (sliding expiration)
	</li>
</ol>

<pre><code class="language-ts"
		>export async function validateSession(token: string): Promise&lt;SessionValidationResult&gt; &#123;
  const sessionId = hashToken(token);

  const result = await db
    .select(&#123;
      session: sessions,
      user: &#123;
        id: users.id,
        email: users.email,
        username: users.username,
        name: users.name,
        role: users.role,
        avatarUrl: users.avatarUrl,
      &#125;,
    &#125;)
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId));

  if (result.length === 0) &#123;
    return &#123; session: null, user: null &#125;;
  &#125;

  const &#123; session, user &#125; = result[0];

  // Expired — clean up and reject
  if (session.expiresAt &lt;= Date.now()) &#123;
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return &#123; session: null, user: null &#125;;
  &#125;

  // Auto-extend if within refresh threshold (15 days)
  if (session.expiresAt - Date.now() &lt; SESSION_REFRESH_THRESHOLD_MS) &#123;
    session.expiresAt = Date.now() + SESSION_LIFETIME_MS;
    await db
      .update(sessions)
      .set(&#123; expiresAt: session.expiresAt &#125;)
      .where(eq(sessions.id, sessionId));
  &#125;

  return &#123; session, user &#125;;
&#125;</code
	></pre>

<p>
	The join with the <code>users</code> table returns a <code>SessionUser</code> object containing
	only the fields needed for the UI: <code>id</code>, <code>email</code>, <code>username</code>,
	<code>name</code>, <code>role</code>, and <code>avatarUrl</code>. Password hashes never leave the
	server.
</p>

<h3><code>setSessionCookie()</code> / <code>deleteSessionCookie()</code></h3>

<p>
	Manage the <code>auth_session</code> cookie with security-hardened defaults:
</p>

<pre><code class="language-ts"
		>export function setSessionCookie(cookies: Cookies, token: string, expiresAt: number): void &#123;
  cookies.set(SESSION_COOKIE_NAME, token, &#123;
    httpOnly: true,     // Not accessible via JavaScript
    sameSite: "lax",    // Sent with top-level navigations
    secure: !dev,       // HTTPS-only in production
    path: "/",
    expires: new Date(expiresAt),
  &#125;);
&#125;

export function deleteSessionCookie(cookies: Cookies): void &#123;
  cookies.set(SESSION_COOKIE_NAME, "", &#123;
    httpOnly: true,
    sameSite: "lax",
    secure: !dev,
    path: "/",
    maxAge: 0,          // Immediately expire
  &#125;);
&#125;</code
	></pre>

<p>
	The cookie name <code>auth_session</code> is exported as a constant so it can be referenced
	consistently across the codebase. The <code>secure</code> flag is automatically disabled in
	development (via <strong>SvelteKit's</strong> <code>dev</code> variable) to allow HTTP on localhost.
</p>

<h2>Server Hooks</h2>

<p>
	<strong>SvelteKit</strong> server hooks run on <strong>every single request</strong> — page loads,
	form submissions, API calls, everything. SvelteForge's <code>hooks.server.ts</code> is the backbone
	of the auth system:
</p>

<pre><code class="language-ts"
		>// src/hooks.server.ts
export const handle: Handle = async (&#123; event, resolve &#125;) =&gt; &#123;
  const token = event.cookies.get(SESSION_COOKIE_NAME);
  if (!token) &#123;
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  &#125;

  const &#123; session, user &#125; = await validateSession(token);

  if (session) &#123;
    // Refresh cookie with current expiresAt (handles auto-extension)
    setSessionCookie(event.cookies, token, session.expiresAt);

    // Update session metadata on every request
    const ua = event.request.headers.get("user-agent");
    const ip = event.getClientAddress();
    await db
      .update(sessions)
      .set(&#123; userAgent: ua, ipAddress: ip &#125;)
      .where(eq(sessions.id, session.id));
  &#125; else &#123;
    deleteSessionCookie(event.cookies);
  &#125;

  event.locals.user = user;
  event.locals.session = session;
  return resolve(event);
&#125;;</code
	></pre>

<p>This hook performs four operations on every request:</p>

<ol>
	<li><strong>Read</strong> the <code>auth_session</code> cookie</li>
	<li><strong>Validate</strong> the session token (checks expiry, auto-extends if needed)</li>
	<li>
		<strong>Populate</strong> <code>event.locals.user</code> and <code>event.locals.session</code> so
		every server load function and form action can access the authenticated user
	</li>
	<li>
		<strong>Update metadata</strong> — the user agent and IP address are refreshed on every request, giving
		you an accurate audit trail in Settings &gt; Sessions
	</li>
</ol>

<p>
	The <code>App.Locals</code> interface is typed in <code>src/app.d.ts</code>, ensuring TypeScript
	knows about <code>locals.user</code> and <code>locals.session</code> throughout the entire
	<strong>SvelteKit</strong> application:
</p>

<pre><code class="language-ts"
		>interface Locals &#123;
  user: SessionUser | null;
  session: Session | null;
&#125;</code
	></pre>

<h2>Password Hashing</h2>

<p>
	SvelteForge uses <strong>Argon2id</strong> via <code>@node-rs/argon2</code> — the winner of the Password
	Hashing Competition and the recommended algorithm for new applications. The parameters are tuned for
	security:
</p>

<pre><code class="language-ts"
		>import &#123; hash, verify &#125; from "@node-rs/argon2";

// Hashing (registration, password reset)
const passwordHash = await hash(password, &#123;
  memoryCost: 19456,   // ~19 MB memory
  timeCost: 2,         // 2 iterations
  outputLen: 32,       // 256-bit output
  parallelism: 1,      // Single-threaded
&#125;);

// Verification (login, screen lock)
const valid = await verify(existingUser.passwordHash, password, &#123;
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
&#125;);</code
	></pre>

<p>
	These parameters ensure that each hash operation requires ~19 MB of memory and two passes, making
	brute-force and GPU attacks impractical. The <code>@node-rs/argon2</code> package uses native Rust bindings
	for performance — significantly faster than pure JavaScript implementations.
</p>

<h2>Login Flow</h2>

<p>
	The login form is a standard <strong>SvelteKit</strong> form action with progressive enhancement. The
	entire flow happens server-side:
</p>

<ol>
	<li><strong>Validate inputs</strong> — username (3-31 chars) and password (6-255 chars)</li>
	<li><strong>Look up user</strong> — query by lowercase username using Drizzle ORM</li>
	<li><strong>Verify password</strong> — Argon2id comparison against stored hash</li>
	<li><strong>Create session</strong> — generate token, hash it, store in DB with metadata</li>
	<li><strong>Set cookie</strong> — httpOnly, sameSite=lax, secure in production</li>
	<li><strong>Redirect</strong> — send user to the dashboard</li>
</ol>

<pre><code class="language-ts"
		>// src/routes/(auth)/login/+page.server.ts
export const actions: Actions = &#123;
  default: async (&#123; request, cookies, getClientAddress &#125;) =&gt; &#123;
    const formData = await request.formData();
    const username = formData.get("username");
    const password = formData.get("password");

    // ... validation ...

    const existingUser = await db.query.users.findFirst(&#123;
      where: eq(users.username, username.toLowerCase()),
    &#125;);

    if (!existingUser) &#123;
      return fail(400, &#123; message: "Incorrect username or password" &#125;);
    &#125;

    const validPassword = await verify(existingUser.passwordHash, password, &#123;
      memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1,
    &#125;);

    if (!validPassword) &#123;
      return fail(400, &#123; message: "Incorrect username or password" &#125;);
    &#125;

    const token = generateSessionToken();
    const session = await createSession(token, existingUser.id, &#123;
      userAgent: request.headers.get("user-agent"),
      ipAddress: getClientAddress(),
    &#125;);
    setSessionCookie(cookies, token, session.expiresAt);

    redirect(302, "/");
  &#125;,
&#125;;</code
	></pre>

<p>
	Notice the deliberate use of a generic error message (<em>"Incorrect username or password"</em>)
	for both missing users and wrong passwords — this prevents username enumeration attacks.
</p>

<p>
	The login page uses <strong>SvelteKit's</strong> <code>use:enhance</code> directive for progressive
	enhancement. The form works without JavaScript and upgrades seamlessly when JS is available, avoiding
	full page reloads on submission.
</p>

<h2>Registration Flow</h2>

<ol>
	<li>
		<strong>Validate inputs</strong> — name, email, username (lowercase alphanumeric + hyphens/underscores),
		password
	</li>
	<li><strong>Hash password</strong> — Argon2id with the same parameters as login</li>
	<li>
		<strong>Generate user ID</strong> — cryptographic random ID via <code>generateId(10)</code>
	</li>
	<li>
		<strong>Insert user</strong> — Drizzle ORM insert with unique constraint on email and username
	</li>
	<li><strong>Create session</strong> — immediately log the user in</li>
	<li><strong>Redirect</strong> — send to dashboard</li>
</ol>

<pre><code class="language-ts"
		>// src/routes/(auth)/register/+page.server.ts
const passwordHash = await hash(password, &#123;
  memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1,
&#125;);

const userId = generateId(10);

try &#123;
  await db.insert(users).values(&#123;
    id: userId,
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    passwordHash,
    name,
    role: "admin", // First user gets admin role
  &#125;);
&#125; catch &#123;
  return fail(400, &#123; message: "Username or email already taken" &#125;);
&#125;</code
	></pre>

<p>
	<strong>First user privilege:</strong> The first registered user automatically receives the
	<code>admin</code> role. This bootstraps the application without requiring database seeding or manual
	role assignment.
</p>

<h2>OAuth (Google + GitHub)</h2>

<p>
	Social login is implemented using the <strong>Arctic</strong> library, which provides minimal,
	type-safe OAuth 2.0 clients. OAuth is <strong>entirely optional</strong> — providers are configured
	via environment variables, and the system degrades gracefully when they are not set.
</p>

<h3>Provider Configuration</h3>

<pre><code class="language-ts"
		>// src/lib/server/oauth.ts
import * as arctic from "arctic";
import &#123; env &#125; from "$env/dynamic/private";

function getBaseUrl(): string &#123;
  return env.ORIGIN || "http://localhost:5173";
&#125;

export const google =
  env.GOOGLE_CLIENT_ID &amp;&amp; env.GOOGLE_CLIENT_SECRET
    ? new arctic.Google(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        `$&#123;getBaseUrl()&#125;/login/google/callback`
      )
    : null;

export const github =
  env.GITHUB_CLIENT_ID &amp;&amp; env.GITHUB_CLIENT_SECRET
    ? new arctic.GitHub(
        env.GITHUB_CLIENT_ID,
        env.GITHUB_CLIENT_SECRET,
        `$&#123;getBaseUrl()&#125;/login/github/callback`
      )
    : null;

export function getEnabledProviders(): string[] &#123;
  const providers: string[] = [];
  if (google) providers.push("google");
  if (github) providers.push("github");
  return providers;
&#125;</code
	></pre>

<p>Key design decisions:</p>

<ul>
	<li>
		<strong>Environment-driven:</strong> Providers are <code>null</code> when their env vars are missing.
		No errors, no crashes — just graceful absence.
	</li>
	<li>
		<strong>Dynamic callback URLs:</strong> The <code>ORIGIN</code> env var controls the base URL, so
		callback URLs work across localhost, staging, and production without code changes.
	</li>
	<li>
		<strong>Conditional UI:</strong> The login page calls <code>getEnabledProviders()</code> via its
		<strong>SvelteKit</strong> load function and only renders social login buttons for configured providers.
	</li>
</ul>

<h3>Login Page Integration</h3>

<pre><code class="language-ts"
		>// src/routes/(auth)/login/+page.server.ts
export const load: PageServerLoad = async (&#123; locals &#125;) =&gt; &#123;
  if (locals.user) redirect(302, "/");
  return &#123;
    enabledProviders: getEnabledProviders(),
  &#125;;
&#125;;</code
	></pre>

<p>
	The <strong>Svelte 5</strong> login component uses <code>$props()</code> to receive the enabled providers
	and conditionally renders Google/GitHub buttons only when available.
</p>

<h3>OAuth Flow</h3>

<p>The OAuth flow uses two <strong>SvelteKit</strong> server routes per provider:</p>

<ol>
	<li>
		<strong>Initiation</strong> (<code>/login/google/+server.ts</code>) — Generates a random state
		and code verifier, stores them in short-lived httpOnly cookies (10 minutes), and redirects the
		user to the provider's authorization URL.
	</li>
	<li>
		<strong>Callback</strong> (<code>/login/google/callback/+server.ts</code>) — Validates the state
		parameter against the stored cookie, exchanges the authorization code for tokens, fetches the
		user's profile, and either logs in an existing user or creates a new account.
	</li>
</ol>

<p>The callback handler implements account linking logic:</p>

<ol>
	<li>Check if an <code>oauthAccounts</code> record exists for this provider + provider user ID</li>
	<li>If yes: create a session for the linked user and redirect to dashboard</li>
	<li>If no: create a new user + OAuth account link + session</li>
	<li>If user creation fails (email conflict): attempt to link to the existing user by email</li>
</ol>

<p>
	OAuth users get a random, unusable password hash — they can only authenticate via their social
	provider. The user role is set to <code>viewer</code> by default (unlike the first registered user
	who gets <code>admin</code>).
</p>

<h2>Password Reset Flow</h2>

<p>Password reset follows industry best practices with hashed tokens and time-limited validity:</p>

<h3>Step 1: Request Reset (<code>/forgot-password</code>)</h3>

<ol>
	<li>User enters their email address</li>
	<li>Server generates a 25-character random token via <code>generateId(25)</code></li>
	<li>
		Token is hashed with SHA-256 and stored in the <code>passwordResetTokens</code> table with a 1-hour
		expiry
	</li>
	<li>The reset URL is logged to the console (no email service configured in development)</li>
	<li>Response always returns success — never reveals whether the email exists</li>
</ol>

<pre><code class="language-ts"
		>// Generate and store hashed token
const token = generateId(25);
const tokenHash = /* SHA-256 hash of token */;
const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

await db.insert(passwordResetTokens).values(&#123;
  id: tokenId,
  userId: user.id,
  tokenHash,
  expiresAt,
&#125;);

console.log(`[Password Reset] URL: /reset-password?token=$&#123;token&#125;`);</code
	></pre>

<h3>Step 2: Reset Password (<code>/reset-password</code>)</h3>

<ol>
	<li>User clicks the reset link containing the raw token</li>
	<li>Server hashes the submitted token and looks up the matching record</li>
	<li>Validates the token has not expired</li>
	<li>Hashes the new password with Argon2id</li>
	<li>Updates the user's password hash and deletes the used token</li>
	<li>Redirects to the login page</li>
</ol>

<h2>Screen Lock</h2>

<p>
	The screen lock feature (<code>/lock</code>) allows authenticated users to lock their session and
	require password re-entry to continue. This is useful for shared workstations or brief absences.
</p>

<p>
	The lock page requires an active session (unauthenticated users are redirected to <code
		>/login</code
	>). It displays the user's name and avatar, and verifies the entered password against the stored
	Argon2id hash before redirecting back to the dashboard.
</p>

<h2>Session Metadata</h2>

<p>
	Every session stores the user agent and IP address, updated on <strong>every request</strong> via the
	server hook. This metadata powers the Settings &gt; Sessions panel, where users can see:
</p>

<ul>
	<li>
		Browser name and version (parsed from the user-agent string using <code
			>src/lib/utils/user-agent.ts</code
		>)
	</li>
	<li>Operating system</li>
	<li>IP address</li>
	<li>Session creation time</li>
	<li>Last activity (based on metadata updates)</li>
</ul>

<p>
	This provides a security audit trail — users can identify unfamiliar sessions and administrators
	can monitor access patterns.
</p>

<h2>Auth Guard</h2>

<p>
	Protected routes are guarded by a single <strong>SvelteKit</strong> layout server load function in
	<code>src/routes/(app)/+layout.server.ts</code>:
</p>

<pre><code class="language-ts"
		>export const load: LayoutServerLoad = async (&#123; locals &#125;) =&gt; &#123;
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
	Because this is a <strong>layout</strong> load function, it runs before every page inside the
	<code>(app)</code> route group. No individual page needs to check authentication — it is handled once
	at the layout level.
</p>

<h2>Maintenance Mode</h2>

<p>
	The auth guard also enforces maintenance mode. When the <code>maintenanceMode</code> app setting
	is set to <code>"true"</code>, all non-admin users receive a
	<strong>503 Service Unavailable</strong>
	error. Admin users can still access the application to manage settings and bring it back online.
</p>

<p>
	This is controlled via the Settings page in the admin dashboard — toggle it on/off without any
	code changes or redeployment.
</p>

<h2>Database Schema</h2>

<p>
	The authentication system uses four tables defined with <strong>Drizzle ORM</strong> in
	<code>src/lib/server/db/schema.ts</code>:
</p>

<table>
	<thead>
		<tr>
			<th>Table</th>
			<th>Purpose</th>
			<th>Key Columns</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>users</code></td>
			<td>User accounts</td>
			<td
				><code>id</code>, <code>email</code>, <code>username</code>, <code>passwordHash</code>,
				<code>role</code>, <code>avatarUrl</code></td
			>
		</tr>
		<tr>
			<td><code>sessions</code></td>
			<td>Active sessions</td>
			<td
				><code>id</code> (hashed token), <code>userId</code>, <code>expiresAt</code>,
				<code>userAgent</code>, <code>ipAddress</code></td
			>
		</tr>
		<tr>
			<td><code>oauthAccounts</code></td>
			<td>OAuth provider links</td>
			<td
				><code>userId</code>, <code>provider</code>, <code>providerUserId</code> (unique index on provider
				+ providerUserId)</td
			>
		</tr>
		<tr>
			<td><code>passwordResetTokens</code></td>
			<td>Password reset requests</td>
			<td><code>userId</code>, <code>tokenHash</code>, <code>expiresAt</code></td>
		</tr>
	</tbody>
</table>

<p>
	Roles are defined as a SQLite text enum: <code>admin</code>, <code>editor</code>,
	<code>viewer</code>. The role determines access levels throughout the application — admin users
	can manage other users, change settings, and bypass maintenance mode.
</p>

<h2>Security Summary</h2>

<table>
	<thead>
		<tr>
			<th>Measure</th>
			<th>Implementation</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Password storage</td>
			<td>Argon2id with 19 MB memory cost, 2 iterations</td>
		</tr>
		<tr>
			<td>Session tokens</td>
			<td>20 bytes of <code>crypto.getRandomValues()</code>, base32 encoded</td>
		</tr>
		<tr>
			<td>Token storage</td>
			<td>SHA-256 hash in DB; raw token only in httpOnly cookie</td>
		</tr>
		<tr>
			<td>Cookie security</td>
			<td><code>httpOnly</code>, <code>sameSite=lax</code>, <code>secure</code> in production</td>
		</tr>
		<tr>
			<td>Session lifetime</td>
			<td>30 days with sliding expiration (auto-extends at 15 days)</td>
		</tr>
		<tr>
			<td>Username enumeration</td>
			<td>Generic error messages on login; silent responses on password reset</td>
		</tr>
		<tr>
			<td>Reset tokens</td>
			<td>SHA-256 hashed, 1-hour expiry, single-use (deleted after use)</td>
		</tr>
		<tr>
			<td>OAuth state</td>
			<td>Random state parameter in httpOnly cookie, verified on callback</td>
		</tr>
		<tr>
			<td>Server boundary</td>
			<td
				>All auth code in <code>$lib/server/</code> — <strong>SvelteKit</strong> prevents client-side
				import</td
			>
		</tr>
		<tr>
			<td>Metadata tracking</td>
			<td>User agent and IP address updated on every request</td>
		</tr>
	</tbody>
</table>

<h2>Need More?</h2>

<div
	class="not-prose border-primary/30 bg-primary/5 my-8 rounded-xl border-2 border-dashed p-6 sm:p-8"
>
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
		<div class="flex-1">
			<h3 class="text-foreground text-lg font-bold sm:text-xl">Go Premium with DashboardPack</h3>
			<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
				SvelteForge Admin gives you a solid <strong>Svelte 5</strong> +
				<strong>SvelteKit</strong> authentication foundation. When you need enterprise-grade features
				— multi-tenant auth, 2FA, API key management, audit logs, and advanced RBAC — check out the premium
				templates at DashboardPack.
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
