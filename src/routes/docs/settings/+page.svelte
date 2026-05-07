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
	The Profile tab allows users to update their display name, email address, and avatar URL. The form
	action validates all inputs server-side before persisting changes via <strong>Drizzle ORM</strong
	>.
</p>

<h3>How It Works</h3>

<ol>
	<li><strong>Display name</strong> — Free text field, required, trimmed before storing</li>
	<li>
		<strong>Email</strong> — Validated for format and checked for uniqueness against the
		<code>users</code> table
	</li>
	<li>
		<strong>Avatar URL</strong> — Optional URL string for a profile picture (Gravatar, uploaded image,
		etc.)
	</li>
</ol>

<pre><code class="language-ts"
		>// Profile update form action (simplified)
profile: async (&#123; request, locals &#125;) =&gt; &#123;
  if (!locals.user) return fail(401, &#123; message: "Unauthorized" &#125;);

  const formData = await request.formData();
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const avatarUrl = formData.get("avatarUrl")?.toString().trim() || null;

  // Validate required fields
  if (!name || !email) &#123;
    return fail(400, &#123; message: "Name and email are required" &#125;);
  &#125;

  // Check email uniqueness (exclude current user)
  const existing = await db.query.users.findFirst(&#123;
    where: and(eq(users.email, email), ne(users.id, locals.user.id)),
  &#125;);
  if (existing) &#123;
    return fail(400, &#123; message: "Email is already in use" &#125;);
  &#125;

  await db.update(users)
    .set(&#123; name, email, avatarUrl &#125;)
    .where(eq(users.id, locals.user.id));

  return &#123; success: true, message: "Profile updated" &#125;;
&#125;</code
	></pre>

<p>
	The email uniqueness check explicitly excludes the current user's ID, so submitting the form
	without changing the email does not trigger a conflict. All queries use
	<strong>Drizzle ORM's</strong> type-safe query builder.
</p>

<h2>Password Change</h2>

<p>
	The Password tab requires the current password for verification before accepting a new one. This
	prevents unauthorized password changes even if a session is compromised on a shared device.
</p>

<h3>Validation Rules</h3>

<ul>
	<li><strong>Current password</strong> — Verified against the stored hash using Argon2id</li>
	<li><strong>New password</strong> — Minimum 6 characters, maximum 255 characters</li>
	<li><strong>Confirm password</strong> — Must exactly match the new password</li>
</ul>

<pre><code class="language-ts"
		>// Password change form action (simplified)
password: async (&#123; request, locals &#125;) =&gt; &#123;
  const formData = await request.formData();
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  // Validate lengths
  if (newPassword.length &lt; 6 || newPassword.length &gt; 255) &#123;
    return fail(400, &#123; message: "Password must be 6-255 characters" &#125;);
  &#125;

  if (newPassword !== confirmPassword) &#123;
    return fail(400, &#123; message: "Passwords do not match" &#125;);
  &#125;

  // Verify current password with Argon2id
  const user = await db.query.users.findFirst(&#123;
    where: eq(users.id, locals.user.id),
  &#125;);

  const valid = await verify(user.passwordHash, currentPassword, &#123;
    memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1,
  &#125;);

  if (!valid) &#123;
    return fail(400, &#123; message: "Current password is incorrect" &#125;);
  &#125;

  // Hash and store new password
  const passwordHash = await hash(newPassword, &#123;
    memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1,
  &#125;);

  await db.update(users)
    .set(&#123; passwordHash &#125;)
    .where(eq(users.id, locals.user.id));

  return &#123; success: true, message: "Password updated" &#125;;
&#125;</code
	></pre>

<p>
	The new password is re-hashed with the same <strong>Argon2id</strong> parameters used during registration
	(19 MB memory cost, 2 iterations). This ensures consistent security across all password operations in
	the application.
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
	<li><strong>IP address</strong> — The last-seen IP for this session</li>
	<li><strong>Last activity</strong> — Relative timestamp of the most recent request</li>
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
		<strong>Revoke individual session</strong> — Deletes a specific session from the database. If
		the revoked session is the current one, the <code>auth_session</code> cookie is also cleared, effectively
		logging the user out.
	</li>
	<li>
		<strong>Revoke all other sessions</strong> — Keeps the current session active but deletes every other
		session for the user. This is the "log me out everywhere else" action.
	</li>
</ol>

<pre><code class="language-ts"
		>// Revoke a single session
revokeSession: async (&#123; request, locals, cookies &#125;) =&gt; &#123;
  const formData = await request.formData();
  const sessionId = formData.get("sessionId");

  await db.delete(sessions).where(
    and(eq(sessions.id, sessionId), eq(sessions.userId, locals.user.id))
  );

  // If revoking current session, clear the cookie
  if (sessionId === locals.session.id) &#123;
    deleteSessionCookie(cookies);
  &#125;

  return &#123; success: true, message: "Session revoked" &#125;;
&#125;

// Revoke all other sessions
revokeAllOtherSessions: async (&#123; locals &#125;) =&gt; &#123;
  await db.delete(sessions).where(
    and(
      eq(sessions.userId, locals.user.id),
      ne(sessions.id, locals.session.id)
    )
  );

  return &#123; success: true, message: "All other sessions revoked" &#125;;
&#125;</code
	></pre>

<p>
	The revocation queries always scope to the current user's ID, preventing users from revoking
	sessions belonging to other accounts. This is enforced at the database query level, not just
	through UI restrictions.
</p>

<h3>Session Metadata Updates</h3>

<p>
	Session metadata (user agent, IP address) is updated on <strong>every request</strong> via the
	<strong>SvelteKit</strong> server hook in <code>hooks.server.ts</code>. This means the Sessions
	tab always reflects the most recent device and location information, even for long-lived sessions.
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
