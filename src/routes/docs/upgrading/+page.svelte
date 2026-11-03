<svelte:head
	><title>Upgrading - SvelteForge Admin Documentation</title><meta
		name="description"
		content="Upgrade SvelteForge Admin to v2.0 (Better Auth) and v1.4 (SvelteKit 3): breaking changes, environment variables, OAuth redirect URIs, and the database migration."
	/></svelte:head
>
<h1>Upgrading</h1>
<p>
	Newest release first. Upgrade one major version at a time and back up your SQLite database before
	each step.
</p>
<h2 id="v2-0">Upgrading to v2.0</h2>
<p>
	v2.0 replaces the hand-rolled authentication (Arctic OAuth and SHA-256 session tokens) with
	<a href="https://better-auth.com" target="_blank" rel="noopener noreferrer">Better Auth</a>
	1.7.15. The user experience is the same, but the database schema, environment, OAuth redirect URIs,
	and server-side auth APIs changed. Existing passwords and OAuth links are preserved by a migration script;
	<strong>every user is signed out once</strong> because sessions cannot be carried over.
</p>
<h3>Breaking changes</h3>
<ul>
	<li>
		<strong>New required variable:</strong> <code>BETTER_AUTH_SECRET</code>. The app refuses to
		start in production without it. Generate it with <code>openssl rand -base64 32</code>.
	</li>
	<li>
		<strong>OAuth redirect URIs changed.</strong> Register
		<code>&#123;ORIGIN&#125;/api/auth/callback/google</code> and
		<code>&#123;ORIGIN&#125;/api/auth/callback/github</code>. The old
		<code>/login/google/callback</code> and <code>/login/github/callback</code> routes are gone.
		<code>/login/google</code> and <code>/login/github</code> still exist as start routes.
	</li>
	<li>
		<strong>Minimum password length is now 8</strong> (was 6). Existing shorter passwords keep working
		until they are changed.
	</li>
	<li>
		<strong>Session cookie:</strong> <code>auth_session</code> is replaced by
		<code>better-auth.session_token</code>, HMAC-signed with <code>BETTER_AUTH_SECRET</code>.
		Everyone signs in again after the upgrade.
	</li>
	<li>
		<strong>Schema:</strong> <code>users.password_hash</code> and the <code>oauth_accounts</code>
		and
		<code>password_reset_tokens</code> tables are removed. Passwords and OAuth links move to
		<code>accounts</code>, reset tokens to <code>verifications</code>. <code>users</code> gains
		<code>email_verified</code>, <code>display_username</code>, <code>banned</code>,
		<code>ban_reason</code>, and <code>ban_expires</code>. <code>sessions</code> gains a
		<code>token</code> column and uses timestamps for expiry.
	</li>
	<li>
		<strong>Removed dependencies and code:</strong> <code>arctic</code>,
		<code>@oslojs/encoding</code>,
		<code>src/lib/server/oauth.ts</code>, the OAuth callback routes, and the
		<code>generateSessionToken</code>, <code>createSession</code>, <code>validateSession</code>,
		<code>invalidateSession</code>, <code>setSessionCookie</code>, and
		<code>deleteSessionCookie</code> functions, plus the <code>SESSION_COOKIE_NAME</code> constant.
		Use
		<code>auth.api.*</code> with <code>request.headers</code> instead, and
		<code>locals.user</code> / <code>locals.session</code> for the current user.
	</li>
	<li>
		<strong>Emails:</strong> password-reset and email-change links go through
		<code>sendAuthEmail()</code> in <code>src/lib/server/email.ts</code>. It logs to the console
		until you connect an email provider.
	</li>
	<li>
		<strong>Tests:</strong> mock the database with <code>mockDbModule()</code>, create sessions with
		<code>createAuthHeaders()</code>, and register <code>src/test-setup.ts</code> in Vitest
		<code>setupFiles</code>. See <a href="/docs/testing">Testing</a>.
	</li>
</ul>
<h3>What stays the same</h3>
<ul>
	<li>Argon2id with the same parameters, so existing hashes verify without a password reset.</li>
	<li>Login by username, three roles (admin, editor, viewer), and 30-day sliding sessions.</li>
	<li>The first registered account becomes admin; all later accounts are viewers.</li>
	<li>Content, notifications, and app settings are untouched.</li>
</ul>
<h3>Upgrade steps</h3>
<ol>
	<li>
		<strong>Back up</strong> your database file (the migration also writes its own copy).
	</li>
	<li>
		<strong>Set <code>BETTER_AUTH_SECRET</code></strong> in the server environment (and in your
		local
		<code>.env</code>). Keep <code>ORIGIN</code> set to the public URL.
	</li>
	<li>
		<strong>Update OAuth redirect URIs</strong> with Google and GitHub to the new
		<code>/api/auth/callback/*</code> addresses. Skip this if you do not use social login.
	</li>
	<li>
		<strong>Update the code and install:</strong> pull v2.0 and run <code>pnpm install</code>.
	</li>
	<li>
		<strong>Run the migration</strong> before anything else touches the schema. Point
		<code>DATABASE_URL</code> at your database if it is not <code>svelteforge.db</code>.
	</li>
	<li>
		<strong>Confirm the schema</strong> with <code>pnpm db:push</code>. It should report no changes.
	</li>
	<li>
		<strong>Restart</strong> the app and sign in again.
	</li>
</ol>
<pre><code class="language-bash"
		>cp svelteforge.db svelteforge.db.manual-backup
openssl rand -base64 32          # put the output in BETTER_AUTH_SECRET
pnpm install
pnpm db:migrate-v2               # writes svelteforge.db.pre-v2.bak, then migrates
pnpm db:push                     # expect "No changes detected"</code
	></pre>
<p>
	<strong>Run <code>db:migrate-v2</code> before <code>db:push</code>.</strong> Pushing the new
	schema first would drop <code>users.password_hash</code> without copying it, losing every password.
</p>
<h3>What the migration does</h3>
<ul>
	<li>
		Copies each user's Argon2id hash from <code>users.password_hash</code> to an
		<code>accounts</code> row with <code>providerId = "credential"</code>.
	</li>
	<li>
		Moves Google and GitHub links from <code>oauth_accounts</code> to <code>accounts</code>, and
		marks those users' emails as verified.
	</li>
	<li>
		Adds the new <code>users</code> columns, sets <code>display_username</code> from
		<code>username</code>, and drops <code>password_hash</code>.
	</li>
	<li>
		Recreates <code>sessions</code> in the new shape (all existing sessions are dropped) and drops
		<code>oauth_accounts</code> and <code>password_reset_tokens</code>, so pending reset links stop
		working.
	</li>
	<li>
		Runs inside a transaction and finishes with a foreign-key check. It refuses to run on a database
		that has already been migrated.
	</li>
</ul>
<h3>Customized code</h3>
<ul>
	<li>
		Replace calls to the removed session helpers with <code>auth.api.*</code> methods, always
		passing
		<code>request.headers</code>, and convert errors with <code>authFailure()</code>.
	</li>
	<li>
		Do not insert users or passwords directly. Use <code>auth.api.signUpEmail()</code> or
		<code>auth.api.createUser()</code> so the credential account is created too.
	</li>
	<li>
		Anything querying <code>users.passwordHash</code> or <code>oauthAccounts</code> must read
		<code>accounts</code> instead.
	</li>
	<li>
		Role changes, deletions, and (in demo mode) edits to the shared demo account are guarded inside
		Better Auth, so they also apply to direct <code>/api/auth/*</code> requests.
	</li>
</ul>
<p>
	See <a href="/docs/authentication">Authentication</a> for the full configuration. Two-factor authentication,
	passkeys, organizations, and impersonation are not part of the free edition.
</p>
<hr />
<h2 id="v1-4">Upgrading to v1.4</h2>
<p>
	v1.4 adopts SvelteKit 3, Svelte 5, Node adapter 6, and pnpm 12. Back up your SQLite database and
	review local customizations before updating. The release does not require a schema migration.
</p>
<h3>Runtime and packages</h3>
<p>
	Use Node 22.17 or newer (Node 24 is used in CI and Docker), and the pnpm version pinned in <code
		>package.json</code
	>. TypeScript stays on 6 because the current Svelte tooling does not support 7. The lockfile
	records both application dependencies and pnpm’s integrity metadata; commit both YAML documents.
</p>
<pre><code class="language-bash"
		>pnpm install --frozen-lockfile
pnpm check
pnpm lint
pnpm format:check
pnpm test
pnpm test:e2e</code
	></pre>
<h3>Configuration and imports</h3>
<p>
	SvelteKit options now live in <code>sveltekit(...)</code> in <code>vite.config.ts</code>. Remove
	the old <code>svelte.config.js</code>. The <code>#lib</code> imports are declared in
	<code>package.json</code>; include extensions and use <code>index.js</code> for directory exports.
</p>
<pre><code class="language-ts"
		>import &#123; Button &#125; from "#lib/components/ui/button/index.js";
import &#123; db &#125; from "#lib/server/db/index.js";
import &#123; dev &#125; from "$app/env";
import &#123; GOOGLE_CLIENT_ID &#125; from "$app/env/private";</code
	></pre>
<p>
	The TypeScript config extends <code>$app/tsconfig</code>. Optional OAuth variables are declared in
	<code>src/env.ts</code>; an empty value disables its provider.
</p>
<h3>Production origin</h3>
<p>
	Set <code>ORIGIN</code> before building. The Vite configuration passes it to
	<code>paths.origin</code>, which replaces adapter-node’s runtime origin setting. Rebuild if the
	public URL changes. Keep <code>ORIGIN</code> in the runtime environment too because OAuth uses it for
	callback URLs.
</p>
<pre><code class="language-bash"
		>ORIGIN=https://admin.example.com pnpm build
node --env-file=.env build/index.js

# Docker: bake the public origin into the build
docker build --build-arg ORIGIN=https://admin.example.com -t svelteforge-admin .</code
	></pre>
<h3>Permissions and integration changes</h3>
<ul>
	<li>Only the first registered account receives admin access; later accounts are viewers.</li>
	<li>
		Role changes require admin access. Editors can create/edit content and delete their own content.
		Viewers cannot mutate content.
	</li>
	<li>
		Pass <code>event.cookies</code> to session-cookie helpers, and await async session functions.
	</li>
	<li>
		External OAuth redirects explicitly opt in to the provider’s origin. Use <code
			>Response.json()</code
		> for JSON endpoints.
	</li>
</ul>
<h3>Verify deployment</h3>
<p>
	The GitHub deployment workflow installs matching server dependencies and verifies the build commit
	through <code>/api/health</code>. Confirm login, protected routes, docs, and charts after
	deployment. Never run the demo seed against a production database containing customer data.
</p>
<p>
	For customized applications, also consult <a
		href="https://svelte.dev/docs/kit/migrating-to-sveltekit-3"
		>the official SvelteKit 3 migration guide</a
	>.
</p>
