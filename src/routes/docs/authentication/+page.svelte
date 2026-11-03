<svelte:head>
	<title>Authentication - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="How SvelteForge Admin authenticates users with Better Auth: sessions, Argon2id passwords, Google and GitHub OAuth, password reset, roles and permissions, and route protection in SvelteKit."
	/>
</svelte:head>

<h1>Authentication</h1>

<p>
	SvelteForge Admin uses <a href="https://better-auth.com" target="_blank" rel="noopener noreferrer"
		>Better Auth</a
	>
	for authentication, wired into <strong>SvelteKit</strong> through server hooks, form actions, and server-only
	modules. Better Auth handles sessions, cookies, OAuth, password reset tokens, and the user-management
	API; SvelteForge adds username sign-in, three roles, Argon2id password hashing, and a few safety guards
	on top.
</p>

<ul>
	<li>
		<strong>better-auth</strong> with the <code>username</code> and <code>admin</code> plugins and
		the
		<code>sveltekitCookies</code> plugin
	</li>
	<li>
		<strong>@node-rs/argon2</strong> — Argon2id password hashing (memory-hard, GPU-resistant), kept from
		v1 so existing hashes keep working
	</li>
	<li>
		<strong>Drizzle ORM</strong> — Better Auth's tables are ordinary Drizzle tables in
		<code>schema.ts</code>
	</li>
</ul>

<p>
	Coming from v1.x? The hand-rolled session code and Arctic are gone; see
	<a href="/docs/upgrading">Upgrading</a> for the migration steps.
</p>

<h2>Architecture</h2>

<p>Four pieces work together:</p>

<ol>
	<li>
		<strong><code>src/lib/server/auth.ts</code></strong> — Creates the <code>auth</code> instance with
		all configuration, hooks, and plugins.
	</li>
	<li>
		<strong><code>src/hooks.server.ts</code></strong> — On every request, resolves the session into
		<code>event.locals</code> and lets Better Auth serve <code>/api/auth/*</code>.
	</li>
	<li>
		<strong>Form actions</strong> — Login, register, settings, and user management call
		<code>auth.api.*</code> methods directly on the server, passing <code>request.headers</code>.
	</li>
	<li>
		<strong>Drizzle tables</strong> — <code>users</code>, <code>sessions</code>,
		<code>accounts</code>, and <code>verifications</code> store everything.
	</li>
</ol>

<h2>Server Hooks</h2>

<p>
	<strong>SvelteKit</strong> server hooks run on <strong>every request</strong>. SvelteForge's hook
	does two things:
</p>

<pre><code class="language-ts"
		>// src/hooks.server.ts
export const handle: Handle = async (&#123; event, resolve &#125;) =&gt; &#123;
  event.locals.user = null;
  event.locals.session = null;

  if (!building) &#123;
    try &#123;
      const result = await auth.api.getSession(&#123; headers: event.request.headers &#125;);
      if (result) &#123;
        event.locals.user = result.user as SessionUser;
        event.locals.session = result.session;
      &#125;
    &#125; catch (err) &#123;
      // DB error or corrupt cookie: continue as unauthenticated.
      console.error("Session lookup failed:", err);
    &#125;
  &#125;

  // Serves /api/auth/* (OAuth callbacks, reset links, ...) and passes
  // every other request on to SvelteKit.
  return svelteKitHandler(&#123; event, resolve, auth, building &#125;);
&#125;;</code
	></pre>

<ol>
	<li>
		<strong>Populates</strong> <code>event.locals.user</code> and <code>event.locals.session</code> so
		every load function and form action can read the signed-in user. Any failure results in an unauthenticated
		request rather than an error page.
	</li>
	<li>
		<strong>Serves Better Auth's HTTP endpoints</strong> under <code>/api/auth/*</code> through
		<code>svelteKitHandler</code>. This is where OAuth providers redirect back to and where password
		reset links land.
	</li>
</ol>

<p>
	The <code>App.Locals</code> interface in <code>src/app.d.ts</code> types both values:
</p>

<pre><code class="language-ts"
		>interface Locals &#123;
  user: SessionUser | null;
  session: Session | null;
&#125;</code
	></pre>

<p>
	<code>SessionUser</code> and <code>Session</code> are derived from the Better Auth instance (<code
		>auth.$Infer.Session</code
	>). <code>SessionUser</code> narrows <code>username</code> and
	<code>role</code> to <code>string</code> and the <code>admin | editor | viewer</code> union,
	because the
	<code>users</code> table guarantees both.
</p>

<h2>Better Auth Configuration</h2>

<p>
	Everything lives in <code>src/lib/server/auth.ts</code>, a server-only module that
	<strong>SvelteKit</strong> will never include in the client bundle. A condensed walkthrough:
</p>

<h3>Secret and base URL</h3>

<pre><code class="language-ts"
		>export const auth = betterAuth(&#123;
  appName: "SvelteForge Admin",
  baseURL: ORIGIN || "http://localhost:5173",
  secret: BETTER_AUTH_SECRET || undefined,
  database: drizzleAdapter(db, &#123; provider: "sqlite", schema, usePlural: true &#125;),
  // ...
&#125;);</code
	></pre>

<p>
	<code>BETTER_AUTH_SECRET</code> signs the session cookie and is required in production: the module
	throws at startup if it is missing (outside development, the build step, and tests). Generate one
	with <code>openssl rand -base64 32</code>. <code>ORIGIN</code> doubles as Better Auth's base URL, so
	it controls OAuth callback URLs and the links in emails.
</p>

<h3>Sessions</h3>

<pre><code class="language-ts"
		>session: &#123;
  // 30-day sessions that slide forward once less than 15 days remain.
  expiresIn: 30 * DAY_SECONDS,
  updateAge: 15 * DAY_SECONDS,
&#125;,</code
	></pre>

<ul>
	<li>
		<strong>Lifetime:</strong> 30 days. Once a session has less than 15 days left, the next request extends
		it (sliding expiration).
	</li>
	<li>
		<strong>Cookie:</strong> <code>better-auth.session_token</code>, httpOnly and SameSite=Lax, and
		secure over HTTPS. The value is the session token <strong>signed with HMAC</strong> using
		<code>BETTER_AUTH_SECRET</code>.
	</li>
	<li>
		<strong>Storage:</strong> The <code>sessions</code> table holds the raw token, expiry, user agent,
		and IP address (recorded when the session is created). A leaked database alone cannot be turned into
		a valid cookie, because forging one requires the secret.
	</li>
	<li>
		<strong>Every request</strong> looks the session up in the database; there is no cookie cache, so
		revoking a session takes effect immediately.
	</li>
</ul>

<h3>Passwords: Argon2id</h3>

<p>
	Better Auth defaults to scrypt. SvelteForge replaces it with the Argon2id functions in
	<code>src/lib/server/password.ts</code>, which are plain functions with no SvelteKit imports so
	the seed script and the v2 migration can use them too:
</p>

<pre><code class="language-ts"
		>// src/lib/server/password.ts
const ARGON2_OPTIONS = &#123;
  memoryCost: 19456,   // ~19 MB memory
  timeCost: 2,         // 2 iterations
  outputLen: 32,       // 256-bit output
  parallelism: 1,      // Single-threaded
&#125; as const;

export const hashPassword = (password: string) =&gt; hash(password, ARGON2_OPTIONS);
export async function verifyPassword(&#123; hash, password &#125;) &#123;
  try &#123; return await verify(hash, password, ARGON2_OPTIONS); &#125;
  catch &#123; return false; &#125;  // malformed hash = mismatch
&#125;

// auth.ts
emailAndPassword: &#123;
  enabled: true,
  minPasswordLength: PASSWORD_MIN,   // 8
  maxPasswordLength: PASSWORD_MAX,   // 255
  password: &#123; hash: hashPassword, verify: verifyPassword &#125;,
  resetPasswordTokenExpiresIn: 60 * 60,
  revokeSessionsOnPasswordReset: true,
  sendResetPassword: async (&#123; user, url &#125;) =&gt; &#123; /* sendAuthEmail(...) */ &#125;,
&#125;,</code
	></pre>

<p>
	Hashes are stored in <code>accounts.password</code> for the <code>credential</code> account of
	each user. The minimum length is <strong>8</strong> characters (v1 allowed 6). Usernames are 3-31
	characters of lowercase letters, numbers, hyphens, and underscores. These limits are exported as
	<code>USERNAME_MIN</code>, <code>USERNAME_MAX</code>, <code>USERNAME_PATTERN</code>,
	<code>PASSWORD_MIN</code>, and <code>PASSWORD_MAX</code> so forms and tests share one source of truth.
</p>

<h3>Plugins</h3>

<pre><code class="language-ts"
		>plugins: [
  username(&#123;
    minUsernameLength: USERNAME_MIN,
    maxUsernameLength: USERNAME_MAX,
    usernameValidator: (value) =&gt; USERNAME_PATTERN.test(value),
    validationOrder: &#123; username: "post-normalization" &#125;,
  &#125;),
  admin(&#123; ac, roles, defaultRole: "viewer", adminRoles: ["admin"] &#125;),
  // Must stay last: forwards Set-Cookie from auth.api calls to SvelteKit.
  sveltekitCookies(getRequestEvent),
],</code
	></pre>

<ul>
	<li>
		<strong><code>username</code></strong> — Adds <code>username</code> and
		<code>displayUsername</code>
		columns and the <code>signInUsername</code> API. Login uses username, not email.
	</li>
	<li>
		<strong><code>admin</code></strong> — Adds the <code>role</code> column, ban fields, and admin
		APIs (<code>createUser</code>, <code>setRole</code>, <code>removeUser</code>, ...). New users
		default to
		<code>viewer</code>.
	</li>
	<li>
		<strong><code>sveltekitCookies</code></strong> — When you call
		<code>auth.api.signInUsername()</code>
		inside a form action, Better Auth needs to set a cookie on SvelteKit's response. This plugin does
		that through <code>getRequestEvent()</code>. It must be the <strong>last</strong> plugin.
	</li>
</ul>

<h3>Other options</h3>

<ul>
	<li>
		<code>user.fields: &#123; image: "avatarUrl" &#125;</code> — Better Auth's <code>image</code>
		field is stored in the existing <code>avatar_url</code> column.
	</li>
	<li>
		<code>verification.storeIdentifier: "hashed"</code> — Password-reset and confirmation tokens are stored
		as SHA-256 hashes, so a leaked database cannot be used to reset anyone's password (Better Auth's default
		is plain text).
	</li>
	<li>
		<code>user.changeEmail</code> — Enabled. Accounts with an unverified email switch immediately (<code
			>updateEmailWithoutVerification</code
		>); verified accounts, such as OAuth sign-ups, get a confirmation link.
	</li>
</ul>

<h2>Calling Better Auth from Form Actions</h2>

<p>
	SvelteForge's forms are ordinary <strong>SvelteKit</strong> form actions with progressive
	enhancement. They validate input, then call a server-side <code>auth.api.*</code> method. Always
	pass
	<code>request.headers</code> so Better Auth can identify the caller from the session cookie.
</p>

<pre><code class="language-ts"
		>// src/routes/(auth)/login/+page.server.ts
export const actions: Actions = &#123;
  default: async (&#123; request &#125;) =&gt; &#123;
    const formData = await request.formData();
    const username = formData.get("username");
    const password = formData.get("password");

    // ... validate types and lengths ...

    try &#123;
      // Sets the session cookie through the sveltekitCookies plugin.
      await auth.api.signInUsername(&#123;
        body: &#123; username, password &#125;,
        headers: request.headers,
      &#125;);
    &#125; catch (err) &#123;
      if (isAPIError(err) &amp;&amp; (err.statusCode === 401 || err.statusCode === 400)) &#123;
        return fail(400, &#123; message: "Incorrect username or password" &#125;);
      &#125;
      if (isAPIError(err)) &#123;
        return fail(err.statusCode, &#123; message: err.body?.message ?? "Sign-in failed" &#125;);
      &#125;
      throw err;
    &#125;

    redirect(302, "/");
  &#125;,
&#125;;</code
	></pre>

<p>
	Login deliberately returns the same message for unknown users and wrong passwords, which prevents
	username enumeration. Banned accounts and similar cases keep Better Auth's own message.
</p>

<h3><code>authFailure()</code></h3>

<p>
	Better Auth throws an <code>APIError</code> when something is wrong. Most actions turn that into a
	form failure with one helper from <code>src/lib/server/auth-errors.ts</code>:
</p>

<pre><code class="language-ts"
		>export function authFailure(err: unknown, fallback = "Something went wrong. Please try again.") &#123;
  if (isAPIError(err)) &#123;
    const status = typeof err.statusCode === "number" &amp;&amp; err.statusCode &gt;= 400 ? err.statusCode : 400;
    return fail(status, &#123; message: err.body?.message || err.message || fallback &#125;);
  &#125;
  throw err;   // redirects and unexpected errors pass through
&#125;

// Usage
try &#123;
  await auth.api.changePassword(&#123; body: &#123; currentPassword, newPassword &#125;, headers: request.headers &#125;);
&#125; catch (err) &#123;
  return authFailure(err);
&#125;</code
	></pre>

<h3>Which routes call what</h3>

<table>
	<thead>
		<tr>
			<th>Route</th>
			<th>Better Auth call</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>/login</code></td>
			<td><code>auth.api.signInUsername()</code></td>
		</tr>
		<tr>
			<td><code>/register</code></td>
			<td><code>auth.api.signUpEmail()</code> (signs the user in)</td>
		</tr>
		<tr>
			<td><code>/logout</code></td>
			<td><code>auth.api.signOut()</code> (deletes the session row, clears the cookie)</td>
		</tr>
		<tr>
			<td><code>/forgot-password</code></td>
			<td><code>auth.api.requestPasswordReset()</code></td>
		</tr>
		<tr>
			<td><code>/reset-password</code></td>
			<td><code>auth.api.resetPassword()</code></td>
		</tr>
		<tr>
			<td><code>/lock</code></td>
			<td><code>auth.api.verifyPassword()</code></td>
		</tr>
		<tr>
			<td><code>/login/google</code>, <code>/login/github</code></td>
			<td><code>auth.api.signInSocial()</code></td>
		</tr>
		<tr>
			<td>Settings</td>
			<td>
				<code>updateUser</code>, <code>changeEmail</code>, <code>changePassword</code>,
				<code>revokeSession</code>, <code>revokeOtherSessions</code>
			</td>
		</tr>
		<tr>
			<td>Users and Roles</td>
			<td
				><code>createUser</code>, <code>adminUpdateUser</code>, <code>setRole</code>,
				<code>removeUser</code></td
			>
		</tr>
	</tbody>
</table>

<h2>Registration and the First Admin</h2>

<p>
	The register action validates name, email, username, and password, then calls
	<code>auth.api.signUpEmail()</code>. Better Auth creates the user and a <code>credential</code>
	account and signs the user in.
</p>

<p>
	<strong>First user privilege:</strong> The first registered user automatically becomes
	<code>admin</code>. This is done in a Better Auth <code>databaseHooks.user.create.after</code>
	hook with a single atomic <code>UPDATE</code> that promotes the user only if they are the oldest row
	and no admin exists yet, so two people registering at the same moment cannot both become admin.
</p>

<pre><code class="language-ts"
		>databaseHooks: &#123;
  user: &#123;
    create: &#123;
      before: async (user) =&gt; &#123;
        // validates name; derives a unique username for OAuth sign-ups
      &#125;,
      after: async (user) =&gt; &#123;
        db.run(sql`
          UPDATE users SET role = 'admin'
          WHERE id = $&#123;user.id&#125;
            AND id = (SELECT id FROM users ORDER BY rowid LIMIT 1)
            AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin')
        `);
      &#125;,
    &#125;,
  &#125;,
&#125;,</code
	></pre>

<p>
	Later registrations get the <code>viewer</code> role. OAuth sign-ups arrive without a username, so
	the <code>before</code> hook derives a unique one from the email address.
</p>

<h2>OAuth (Google + GitHub)</h2>

<p>
	Social login is built into Better Auth and is <strong>entirely optional</strong>. A provider is
	enabled only when both its client ID and secret are set:
</p>

<pre><code class="language-ts"
		>const socialProviders = &#123;
  ...(GOOGLE_CLIENT_ID &amp;&amp; GOOGLE_CLIENT_SECRET
    ? &#123; google: &#123; clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET &#125; &#125;
    : &#123;&#125;),
  ...(GITHUB_CLIENT_ID &amp;&amp; GITHUB_CLIENT_SECRET
    ? &#123; github: &#123; clientId: GITHUB_CLIENT_ID, clientSecret: GITHUB_CLIENT_SECRET &#125; &#125;
    : &#123;&#125;),
&#125;;

export function getEnabledProviders(): ("google" | "github")[] &#123;
  return Object.keys(socialProviders) as ("google" | "github")[];
&#125;</code
	></pre>

<p>
	The login page loads <code>getEnabledProviders()</code> and only renders buttons for configured providers.
</p>

<h3>Setting up a provider</h3>

<ol>
	<li>
		Create the OAuth app in the <a
			href="https://console.cloud.google.com/apis/credentials"
			target="_blank"
			rel="noopener noreferrer">Google Cloud Console</a
		>
		or
		<a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer"
			>GitHub Developer Settings</a
		>.
	</li>
	<li>
		Register the redirect (callback) URL, replacing the origin with your own:
		<ul>
			<li><code>&#123;ORIGIN&#125;/api/auth/callback/google</code></li>
			<li><code>&#123;ORIGIN&#125;/api/auth/callback/github</code></li>
		</ul>
	</li>
	<li>
		Add <code>GOOGLE_CLIENT_ID</code> / <code>GOOGLE_CLIENT_SECRET</code> and/or
		<code>GITHUB_CLIENT_ID</code> / <code>GITHUB_CLIENT_SECRET</code> to your environment, then restart.
	</li>
</ol>

<p>
	For local development with the default origin, the Google URI is
	<code>http://localhost:5173/api/auth/callback/google</code>. In v1 the callbacks were
	<code>/login/google/callback</code> and <code>/login/github/callback</code>; update them when
	upgrading.
</p>

<h3>The flow</h3>

<ol>
	<li>
		<strong>Start</strong> — <code>/login/google</code> (or <code>/login/github</code>) calls
		<code>auth.api.signInSocial()</code> and redirects the browser to the provider. Better Auth stores
		the OAuth state and PKCE verifier.
	</li>
	<li>
		<strong>Callback</strong> — The provider redirects to
		<code>/api/auth/callback/&#123;provider&#125;</code>, handled by <code>svelteKitHandler</code>
		in the hook. Better Auth validates state, exchanges the code, and creates or links the user and an
		<code>accounts</code> row.
	</li>
	<li>
		<strong>Finish</strong> — The user lands on <code>/</code>. On failure they return to
		<code>/login?error=oauth</code> and see a "Social sign-in failed" message.
	</li>
</ol>

<pre><code class="language-ts"
		>// src/routes/(auth)/login/google/+server.ts
export const GET: RequestHandler = async (&#123; request &#125;) =&gt; &#123;
  if (!getEnabledProviders().includes("google")) redirect(302, "/login");

  const &#123; url &#125; = await auth.api.signInSocial(&#123;
    body: &#123; provider: "google", callbackURL: "/", errorCallbackURL: "/login?error=oauth" &#125;,
    headers: request.headers,
  &#125;);
  if (!url) redirect(302, "/login?error=oauth");

  redirect(302, url, &#123; external: [new URL(url).origin] &#125;);
&#125;;</code
	></pre>

<p>
	OAuth users have no password. They get the <code>viewer</code> role unless they are the very first account
	on a fresh install, and a unique username derived from their email. Their email is already verified
	by the provider, so changing it later uses a confirmation link.
</p>

<h2>Password Reset and Email</h2>

<p>Reset and confirmation emails all go through one function:</p>

<pre><code class="language-ts"
		>// src/lib/server/email.ts
export async function sendAuthEmail(email: &#123; to: string; subject: string; text: string; url: string &#125;) &#123;
  console.log(`[Auth email] To: $&#123;email.to&#125;`);
  console.log(`[Auth email] Subject: $&#123;email.subject&#125;`);
  console.log(`[Auth email] Link: $&#123;email.url&#125;`);
  // Optional: AUTH_EMAIL_OUTBOX=/path/to/outbox.jsonl also appends each message as a JSON line.
&#125;</code
	></pre>

<p>
	<strong>SvelteForge ships without an email provider.</strong> The default implementation logs the
	message and link to the server console, which is enough for development. Before production,
	replace the body of <code>sendAuthEmail()</code> with your provider (Resend, Postmark, SES,
	Nodemailer, ...). Setting <code>AUTH_EMAIL_OUTBOX</code> additionally appends every message to a JSONL
	file; the E2E tests use it to read reset links.
</p>

<h3>Step 1: Request a reset (<code>/forgot-password</code>)</h3>

<ol>
	<li>The user enters their email address.</li>
	<li>
		The action calls
		<code
			>auth.api.requestPasswordReset(&#123; body: &#123; email, redirectTo: "/reset-password" &#125;
			&#125;)</code
		>.
	</li>
	<li>
		Better Auth stores a hashed, one-hour token in <code>verifications</code> and calls
		<code>sendResetPassword</code>, which calls <code>sendAuthEmail()</code>.
	</li>
	<li>The response is always success, so it never reveals whether the email exists.</li>
</ol>

<h3>Step 2: Choose a new password (<code>/reset-password</code>)</h3>

<ol>
	<li>
		Better Auth validates the token and redirects to <code>/reset-password?token=...</code>, or with
		<code>?error=INVALID_TOKEN</code> for a bad or expired link.
	</li>
	<li>
		The action validates the new password and calls
		<code>auth.api.resetPassword(&#123; body: &#123; newPassword, token &#125; &#125;)</code>.
	</li>
	<li>
		<code>revokeSessionsOnPasswordReset</code> signs the user out everywhere, then the action
		redirects to <code>/login</code>.
	</li>
</ol>

<h2>Screen Lock</h2>

<p>
	The screen lock feature (<code>/lock</code>) lets an authenticated user lock the screen and
	re-enter their password to continue. The page requires an active session (otherwise it redirects
	to
	<code>/login</code>) and checks the password with <code>auth.api.verifyPassword()</code>; no new
	session is created.
</p>

<h2>Roles and Permissions</h2>

<p>
	Roles are a SQLite text enum: <code>admin</code>, <code>editor</code>, <code>viewer</code>. Access
	control for Better Auth's admin APIs is defined in <code>src/lib/permissions.ts</code> and shared by
	the server and the UI:
</p>

<pre><code class="language-ts"
		>export const statements = &#123;
  user: ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins",
         "delete", "set-password", "set-email", "get", "update"],
  session: ["list", "revoke", "delete"],
&#125; as const;

export const ac = createAccessControl(statements);

export const roles = &#123;
  admin: ac.newRole(&#123; user: ["create", "list", "set-role", "ban", "delete",
                          "set-password", "set-email", "get", "update"],
                   session: ["list", "revoke", "delete"] &#125;),
  editor: ac.newRole(&#123; user: [], session: [] &#125;),
  viewer: ac.newRole(&#123; user: [], session: [] &#125;),
&#125;;</code
	></pre>

<table>
	<thead>
		<tr>
			<th>Role</th>
			<th>Admin API (users, sessions)</th>
			<th>App behavior</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>admin</code></td>
			<td>Full access except impersonation</td>
			<td>Manages users, roles, and settings; bypasses maintenance mode</td>
		</tr>
		<tr>
			<td><code>editor</code></td>
			<td>None</td>
			<td>Creates and edits content, deletes their own content</td>
		</tr>
		<tr>
			<td><code>viewer</code></td>
			<td>None</td>
			<td>Read-only access to the dashboard</td>
		</tr>
	</tbody>
</table>

<p>
	<strong>Impersonation is granted to no role in the free edition.</strong> The statements exist so
	the admin plugin's types line up, but neither <code>admin</code> nor any other role holds them. Two-factor
	auth, passkeys, organizations, and impersonation are possible through Better Auth plugins in SvelteForge
	Premium.
</p>

<h2>Safety Guards</h2>

<p>
	A <code>hooks.before</code> middleware in <code>auth.ts</code> runs before Better Auth executes
	any endpoint. Because it lives in Better Auth rather than in the form actions, the rules apply
	equally to SvelteForge's forms and to raw requests against <code>/api/auth/*</code>:
</p>

<ul>
	<li>
		<strong>Demo account protection</strong> — When <code>DEMO_MODE=true</code>, the shared
		<code>demo</code> user cannot call <code>/update-user</code>, <code>/change-email</code>,
		<code>/change-password</code>, or <code>/delete-user</code>.
	</li>
	<li>
		<strong>Last-admin protection</strong> — <code>/admin/set-role</code>,
		<code>/admin/update-user</code>, and <code>/admin/remove-user</code> are refused if they would demote
		or delete the only remaining admin.
	</li>
	<li>
		<strong>Authored content</strong> — <code>/admin/remove-user</code> is refused for users who authored
		pages. Reassign or delete their content first.
	</li>
</ul>

<pre><code class="language-ts"
		>hooks: &#123;
  before: createAuthMiddleware(async (ctx) =&gt; &#123;
    if (isDemoMode() &amp;&amp; DEMO_PROTECTED_PATHS.has(ctx.path)) &#123;
      const session = await getSessionFromCtx(ctx);
      if (session?.user.username === "demo") &#123;
        throw new APIError("FORBIDDEN", &#123; message: "The shared demo account cannot be modified" &#125;);
      &#125;
    &#125;
    // ... last-admin and authored-content checks ...
  &#125;),
&#125;,</code
	></pre>

<h2>Protecting Routes</h2>

<p>
	Because the hook fills <code>event.locals</code> on every request, guarding a route is a check on
	<code>locals.user</code>. Protected pages live in the <code>(app)</code> route group, whose layout server
	load function guards all of them at once:
</p>

<pre><code class="language-ts"
		>// src/routes/(app)/+layout.server.ts
export const load: LayoutServerLoad = async (&#123; locals &#125;) =&gt; &#123;
  if (!locals.user) &#123;
    redirect(302, "/login");
  &#125;

  // Maintenance mode: admins bypass it, everyone else gets a 503
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
	Because this is a <strong>layout</strong> load function, it runs before every page inside
	<code>(app)</code>. For role-specific actions, check <code>locals.user.role</code> as well. Never rely
	on hiding a button: every action must enforce its own rule on the server.
</p>

<pre><code class="language-ts"
		>// In any +page.server.ts action
if (locals.user?.role !== "admin") &#123;
  return fail(403, &#123; message: "Admin access required" &#125;);
&#125;</code
	></pre>

<p>
	<strong>Public routes:</strong> the <code>docs/</code> directory and anything else outside a
	<code>(group)/</code> is not covered by the <code>(app)</code> guard and is reachable without signing
	in.
</p>

<h2>Maintenance Mode</h2>

<p>
	The auth guard also enforces maintenance mode. When the <code>maintenanceMode</code> app setting
	is
	<code>"true"</code>, all non-admin users receive a <strong>503 Service Unavailable</strong> error. Admins
	can still use the application to turn it back off from the Settings page, with no code changes or redeployment.
</p>

<h2>Session Management UI</h2>

<p>
	Settings &gt; Sessions lists the signed-in user's active sessions with browser, operating system,
	IP address, and how long ago each began (parsed with <code>src/lib/utils/user-agent.ts</code>).
	Users can revoke one session (<code>auth.api.revokeSession</code>) or all others (<code
		>auth.api.revokeOtherSessions</code
	>). The session <code>token</code> column is never sent to the browser; revocation looks it up on the
	server by session id, scoped to the current user.
</p>

<h2>Database Schema</h2>

<p>
	Four tables, defined with <strong>Drizzle ORM</strong> in
	<code>src/lib/server/db/schema.ts</code>, belong to Better Auth:
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
				><code>id</code>, <code>name</code>, <code>email</code>, <code>emailVerified</code>,
				<code>username</code>, <code>role</code>, <code>banned</code>, <code>avatarUrl</code></td
			>
		</tr>
		<tr>
			<td><code>sessions</code></td>
			<td>Active sessions</td>
			<td
				><code>token</code>, <code>userId</code>, <code>expiresAt</code>, <code>userAgent</code>,
				<code>ipAddress</code></td
			>
		</tr>
		<tr>
			<td><code>accounts</code></td>
			<td>Login methods</td>
			<td
				><code>userId</code>, <code>providerId</code> (<code>credential</code>, <code>google</code>,
				<code>github</code>), <code>accountId</code>, <code>password</code> (Argon2id hash)</td
			>
		</tr>
		<tr>
			<td><code>verifications</code></td>
			<td>Reset and confirmation tokens, OAuth state</td>
			<td><code>identifier</code> (hashed), <code>value</code>, <code>expiresAt</code></td>
		</tr>
	</tbody>
</table>

<p>
	See the <a href="/docs/database">Database</a> guide for the full definitions. If you add Better
	Auth plugins that need new columns, regenerate the schema with
	<code>npx @better-auth/cli generate</code> and update <code>SCHEMA_SQL</code> in
	<code>test-utils.ts</code>.
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
			<td>Argon2id with 19 MB memory cost, 2 iterations; minimum 8 characters</td>
		</tr>
		<tr>
			<td>Session cookie</td>
			<td>
				<code>better-auth.session_token</code>, httpOnly, SameSite=Lax, secure over HTTPS, signed
				with
				<code>BETTER_AUTH_SECRET</code>
			</td>
		</tr>
		<tr>
			<td>Session lifetime</td>
			<td>30 days with sliding expiration (extends when less than 15 days remain)</td>
		</tr>
		<tr>
			<td>Reset and verification tokens</td>
			<td>Stored as SHA-256 hashes, one-hour expiry; resetting signs the user out everywhere</td>
		</tr>
		<tr>
			<td>Username enumeration</td>
			<td>Generic error on login; identical response on password-reset requests</td>
		</tr>
		<tr>
			<td>OAuth</td>
			<td
				>State and PKCE handled by Better Auth; redirect URIs fixed to <code
					>/api/auth/callback/*</code
				></td
			>
		</tr>
		<tr>
			<td>Privileged operations</td>
			<td
				>Admin plugin permission checks plus last-admin and demo-account guards in <code
					>hooks.before</code
				></td
			>
		</tr>
		<tr>
			<td>Server boundary</td>
			<td
				>All auth code in <code>#lib/server/</code> — <strong>SvelteKit</strong> prevents client-side
				import</td
			>
		</tr>
		<tr>
			<td>Startup check</td>
			<td>The app refuses to start in production without <code>BETTER_AUTH_SECRET</code></td>
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
				<strong>SvelteKit</strong> authentication foundation on Better Auth. When you need enterprise-grade
				features — multi-tenant auth, 2FA, passkeys, impersonation, API key management, audit logs, and
				advanced RBAC — check out the premium templates at DashboardPack.
			</p>
			<ul class="text-muted-foreground mt-3 space-y-1 text-sm">
				<li>
					<strong>Apex (Svelte)</strong> — SvelteKit admin with 6 dashboards, 39 pages, and a authentication
					screens for backend integration
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
				href="https://dashboardpack.com/theme-details/svelteforge-premium/?utm_source=svelteforge&utm_medium=docs&utm_content=docs-authentication&utm_campaign=upgrade-svelteforge-premium"
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
