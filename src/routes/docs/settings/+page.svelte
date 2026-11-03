<svelte:head>
	<title>Settings - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="Comprehensive guide to SvelteForge Admin's settings page — profile updates, password changes, session management, app settings, and appearance — all built with Svelte 5 runes and SvelteKit form actions."
	/>
</svelte:head>

<h1>Settings</h1>

<p>
	The Settings page is one of the most feature-rich areas of SvelteForge Admin, combining multiple
	management sections into a single tabbed interface. Built entirely with <strong>Svelte 5</strong>
	runes and <strong>SvelteKit</strong> form actions, it covers profile management, password changes, session
	auditing, application configuration, and appearance preferences — all with progressive enhancement and
	server-side validation.
</p>

<p>
	Each section is a separate tab powered by <code>$state</code> for reactive tab switching. All
	mutations use <strong>SvelteKit</strong> form actions with <code>use:enhance</code> for
	non-blocking submissions, and success/error feedback is delivered via
	<strong>svelte-sonner</strong> toast notifications.
</p>

<h2>Profile Settings</h2>

<p>
	The Profile tab allows users to update their display name and email address. The form action
	validates inputs server-side, then hands the change to <strong>Better Auth</strong> through
	<code>auth.api.updateUser()</code> and <code>auth.api.changeEmail()</code>, passing the request
	headers so Better Auth knows which session is calling.
</p>

<h3>How It Works</h3>

<ol>
	<li><strong>Display name</strong> — Required, 1-100 characters</li>
	<li>
		<strong>Email</strong> — Validated for format, lowercased, and checked for uniqueness by Better Auth
	</li>
</ol>

<pre><code class="language-ts"
		>// Profile update form action (simplified)
updateProfile: async (&#123; request, locals &#125;) =&gt; &#123;
  // ... validate name and email ...

  try &#123;
    await auth.api.updateUser(&#123; body: &#123; name &#125;, headers: request.headers &#125;);

    if (newEmail !== locals.user.email) &#123;
      // Unverified accounts switch immediately; verified ones get a confirmation link.
      await auth.api.changeEmail(&#123;
        body: &#123; newEmail, callbackURL: "/settings" &#125;,
        headers: request.headers,
      &#125;);
    &#125;
  &#125; catch (err) &#123;
    return authFailure(err);
  &#125;

  return &#123; success: true, action: "profile", emailPending &#125;;
&#125;</code
	></pre>

<p>
	Accounts with an unverified email (every email/password account in a default install) change email
	immediately. Accounts with a verified email, such as OAuth sign-ups, receive a confirmation link
	through <code>sendAuthEmail()</code> and keep the old address until they approve it. In demo mode
	the shared <code>demo</code> account cannot change its profile; the guard lives in Better Auth's
	<code>hooks.before</code>, so it also covers the raw <code>/api/auth</code> endpoints.
</p>

<h2>Password Change</h2>

<p>
	The Password tab requires the current password for verification before accepting a new one. This
	prevents unauthorized password changes even if a session is compromised on a shared device.
</p>

<h3>Validation Rules</h3>

<ul>
	<li><strong>Current password</strong> — Verified against the stored Argon2id hash</li>
	<li><strong>New password</strong> — Minimum 8 characters, maximum 255 characters</li>
	<li><strong>Confirm password</strong> — Must exactly match the new password</li>
</ul>

<pre><code class="language-ts"
		>// Password change form action (simplified)
changePassword: async (&#123; request &#125;) =&gt; &#123;
  // ... validate lengths (PASSWORD_MIN / PASSWORD_MAX) and confirmation ...

  try &#123;
    await auth.api.changePassword(&#123;
      body: &#123; currentPassword, newPassword, revokeOtherSessions: false &#125;,
      headers: request.headers,
    &#125;);
  &#125; catch (err) &#123;
    if (isAPIError(err) &amp;&amp; err.body?.code === "INVALID_PASSWORD") &#123;
      return fail(400, &#123; message: "Current password is incorrect" &#125;);
    &#125;
    return authFailure(err);
  &#125;

  return &#123; success: true, action: "password" &#125;;
&#125;</code
	></pre>

<p>
	Better Auth verifies the current password and stores the new one in
	<code>accounts.password</code> using the same <strong>Argon2id</strong> parameters as registration
	(19 MB memory cost, 2 iterations), configured through the <code>emailAndPassword.password</code>
	hooks in <code>auth.ts</code>.
</p>

<h2>Session Management</h2>

<p>
	The Sessions tab provides a complete audit trail of all active sessions for the current user. This
	is a security-critical feature that gives users visibility into where their account is active and
	the ability to revoke suspicious sessions.
</p>

<h3>Session Information</h3>

<p>Each session row displays:</p>

<ul>
	<li><strong>Device type</strong> — Desktop, mobile, or tablet (detected from user-agent)</li>
	<li><strong>Browser</strong> — Name and version (Chrome 120, Firefox 121, Safari 17, etc.)</li>
	<li><strong>Operating system</strong> — Windows, macOS, Linux, iOS, Android</li>
	<li><strong>IP address</strong> — The IP recorded when the session was created</li>
	<li><strong>Started</strong> — Relative timestamp of when the session was created</li>
	<li><strong>Current session badge</strong> — Highlights the session you are currently using</li>
</ul>

<p>
	User-agent parsing is handled by the <code>parseUserAgent()</code> utility in
	<code>src/lib/utils/user-agent.ts</code>. It extracts browser name/version, OS name/version, and
	device type from the raw user-agent string using pattern matching — no external parsing library
	required.
</p>

<h3>Revoking Sessions</h3>

<p>Two revocation options are available:</p>

<ol>
	<li>
		<strong>Revoke individual session</strong> — Deletes a specific session from the database. The current
		session cannot be revoked here; use logout instead.
	</li>
	<li>
		<strong>Revoke all other sessions</strong> — Keeps the current session active but deletes every other
		session for the user. This is the "log me out everywhere else" action.
	</li>
</ol>

<pre><code class="language-ts"
		>// Revoke a single session
revokeSession: async (&#123; request, locals &#125;) =&gt; &#123;
  // Scope the lookup to the current user so one user can't revoke another's session.
  const target = db
    .select(&#123; token: sessions.token &#125;)
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, locals.user.id)))
    .get();
  if (!target) return fail(404, &#123; message: "Session not found" &#125;);

  await auth.api.revokeSession(&#123; body: &#123; token: target.token &#125;, headers: request.headers &#125;);
  return &#123; success: true, action: "session" &#125;;
&#125;

// Revoke all other sessions
revokeAllOtherSessions: async (&#123; request &#125;) =&gt; &#123;
  await auth.api.revokeOtherSessions(&#123; headers: request.headers &#125;);
  return &#123; success: true, action: "sessions" &#125;;
&#125;</code
	></pre>

<p>
	The session lookup always scopes to the current user's ID, preventing users from revoking sessions
	belonging to other accounts. The bearer <code>token</code> column is never sent to the browser;
	the page only receives the session <code>id</code>.
</p>

<h3>Session Metadata</h3>

<p>
	Better Auth records the user agent and IP address when a session is created. The Sessions tab
	shows that device information alongside how long ago each session started.
</p>

<h2>App Settings (Admin-Only)</h2>

<p>
	The App Settings tab is only visible to users with the <code>admin</code> role. It provides a
	key-value configuration interface backed by the <code>appSettings</code> table in
	<strong>Drizzle ORM</strong>.
</p>

<h3>Available Settings</h3>

<table>
	<thead>
		<tr>
			<th>Key</th>
			<th>Purpose</th>
			<th>Default</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>siteName</code></td>
			<td>Application display name shown in the sidebar and browser title</td>
			<td><code>SvelteForge Admin</code></td>
		</tr>
		<tr>
			<td><code>timezone</code></td>
			<td>Server timezone for date formatting and scheduling</td>
			<td><code>UTC</code></td>
		</tr>
		<tr>
			<td><code>defaultRole</code></td>
			<td>Role assigned to newly registered users</td>
			<td><code>viewer</code></td>
		</tr>
		<tr>
			<td><code>maintenanceMode</code></td>
			<td>When <code>"true"</code>, blocks all non-admin users with a 503 error</td>
			<td><code>false</code></td>
		</tr>
	</tbody>
</table>

<h3>Upsert Pattern</h3>

<p>
	Settings are saved using a Drizzle ORM upsert (insert with <code>onConflictDoUpdate</code>). This
	means the form action works identically whether a setting exists or is being created for the first
	time:
</p>

<pre><code class="language-ts"
		>// App settings form action
appSettings: async (&#123; request, locals &#125;) =&gt; &#123;
  if (locals.user.role !== "admin") &#123;
    return fail(403, &#123; message: "Admin access required" &#125;);
  &#125;

  const formData = await request.formData();
  const settings = Object.fromEntries(formData.entries());

  for (const [key, value] of Object.entries(settings)) &#123;
    await db.insert(appSettings)
      .values(&#123; key, value: value.toString() &#125;)
      .onConflictDoUpdate(&#123;
        target: appSettings.key,
        set: &#123; value: value.toString() &#125;,
      &#125;);
  &#125;

  return &#123; success: true, message: "Settings saved" &#125;;
&#125;</code
	></pre>

<p>
	<strong>Maintenance mode</strong> is particularly powerful — toggling it on immediately blocks all
	non-admin users from accessing any route in the <code>(app)</code> route group. The auth guard in
	<code>src/routes/(app)/+layout.server.ts</code> checks this setting on every request and returns a 503
	error for non-admin users. Admins retain full access to disable maintenance mode when ready.
</p>

<h2>Appearance</h2>

<p>
	The Appearance section controls the dark/light mode toggle, powered by
	<strong>mode-watcher</strong> with system preference detection.
</p>

<h3>How It Works</h3>

<ul>
	<li><strong>Three modes</strong> — Light, Dark, and System (follows OS preference)</li>
	<li>
		<strong>Persistence</strong> — Mode preference is stored in <code>localStorage</code> and persists
		across sessions
	</li>
	<li>
		<strong>No flash</strong> — mode-watcher applies the theme before the page renders, preventing the
		flash of wrong theme
	</li>
</ul>

<h3>Svelte 5 Integration</h3>

<p>
	A critical <strong>Svelte 5</strong> pattern to note: mode-watcher v1 exports a
	<code>mode</code> object that is a runes-based reactive object, <strong>not</strong> a Svelte
	store. You must use <code>mode.current</code> to read the current mode — using the legacy
	<code>$mode</code> store syntax will not work:
</p>

<pre><code class="language-ts"
		>// CORRECT — Svelte 5 runes pattern
import &#123; mode &#125; from "mode-watcher";

// In your component
const isDark = $derived(mode.current === "dark");

// WRONG — This is Svelte 4 store syntax, does NOT work
// $mode === "dark"  // &lt;-- Will not compile in Svelte 5</code
	></pre>

<p>
	The toggle component renders different icons based on the current mode and uses
	<code>mode.set()</code> to switch between <code>"light"</code>, <code>"dark"</code>, and
	<code>"system"</code>.
</p>

<h2>Svelte 5 Patterns in Settings</h2>

<p>
	The Settings page demonstrates several key <strong>Svelte 5</strong> patterns that are used throughout
	SvelteForge Admin:
</p>

<h3>Tabbed Interface with <code>$state</code></h3>

<pre><code class="language-svelte"
		>&lt;script lang="ts"&gt;
  let activeTab = $state("profile");

  const tabs = [
    &#123; id: "profile", label: "Profile", icon: UserIcon &#125;,
    &#123; id: "password", label: "Password", icon: LockIcon &#125;,
    &#123; id: "sessions", label: "Sessions", icon: MonitorIcon &#125;,
    &#123; id: "appearance", label: "Appearance", icon: PaletteIcon &#125;,
    &#123; id: "app", label: "App Settings", icon: SettingsIcon &#125;,
  ];
&lt;/script&gt;

&#123;#each tabs as tab&#125;
  &lt;button
    class:active=&#123;activeTab === tab.id&#125;
    onclick=&#123;() =&gt; (activeTab = tab.id)&#125;
  &gt;
    &lt;tab.icon class="size-4" /&gt;
    &#123;tab.label&#125;
  &lt;/button&gt;
&#123;/each&#125;

&#123;#if activeTab === "profile"&#125;
  &lt;!-- Profile form --&gt;
&#123;:else if activeTab === "password"&#125;
  &lt;!-- Password form --&gt;
&#123;/if&#125;</code
	></pre>

<h3>Form Data with <code>$state</code></h3>

<pre><code class="language-svelte"
		>&lt;script lang="ts"&gt;
  let &#123; data &#125; = $props();

  let name = $state(data.user.name);
  let email = $state(data.user.email);
  let avatarUrl = $state(data.user.avatarUrl ?? "");
&lt;/script&gt;

&lt;form method="POST" action="?/profile" use:enhance&gt;
  &lt;input name="name" bind:value=&#123;name&#125; /&gt;
  &lt;input name="email" type="email" bind:value=&#123;email&#125; /&gt;
  &lt;input name="avatarUrl" bind:value=&#123;avatarUrl&#125; /&gt;
  &lt;button type="submit"&gt;Save Changes&lt;/button&gt;
&lt;/form&gt;</code
	></pre>

<h3>Progressive Enhancement with <code>use:enhance</code></h3>

<p>
	All forms on the Settings page use <strong>SvelteKit's</strong> <code>use:enhance</code> directive.
	This means forms work without JavaScript (full page reload on submit) and upgrade to AJAX-style submissions
	when JavaScript is available. The enhance callback handles toast notifications:
</p>

<pre><code class="language-svelte"
		>&lt;form
  method="POST"
  action="?/profile"
  use:enhance=&#123;() =&gt; &#123;
    return async (&#123; result, update &#125;) =&gt; &#123;
      if (result.type === "success") &#123;
        toast.success("Profile updated successfully");
      &#125; else if (result.type === "failure") &#123;
        toast.error(result.data?.message ?? "Something went wrong");
      &#125;
      await update();
    &#125;;
  &#125;&#125;
&gt;</code
	></pre>

<h2>Need More?</h2>

<div
	class="not-prose border-primary/30 bg-primary/5 my-8 rounded-xl border-2 border-dashed p-6 sm:p-8"
>
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
		<div class="flex-1">
			<h3 class="text-foreground text-lg font-bold sm:text-xl">Go Premium with DashboardPack</h3>
			<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
				SvelteForge Admin provides a complete settings foundation with <strong>Svelte 5</strong>
				and <strong>SvelteKit</strong>. Need profile picture upload with drag-and-drop, two-factor
				authentication (TOTP/SMS), billing management with Stripe integration, and team
				administration with invite flows? Our premium templates at DashboardPack include all of
				these and more.
			</p>
			<ul class="text-muted-foreground mt-3 space-y-1 text-sm">
				<li>
					<strong>Profile picture upload</strong> — Drag-and-drop with crop, resize, and CDN storage
				</li>
				<li>
					<strong>Two-factor authentication</strong> — TOTP setup with QR code and backup codes
				</li>
				<li>
					<strong>Billing management</strong> — Stripe subscription management with invoices
				</li>
				<li>
					<strong>Team administration</strong> — Invite members, assign roles, manage permissions
				</li>
				<li>
					<strong>Notification preferences</strong> — Granular email and in-app notification controls
				</li>
			</ul>
		</div>
		<div class="flex shrink-0 flex-col gap-2">
			<a
				href="https://dashboardpack.com/theme-details/svelteforge-premium/?utm_source=svelteforge&utm_medium=docs&utm_content=docs-settings&utm_campaign=upgrade-svelteforge-premium"
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
