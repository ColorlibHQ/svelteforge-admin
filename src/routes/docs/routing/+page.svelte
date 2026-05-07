<svelte:head>
	<title>Routing - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="Understand SvelteKit's file-based routing in SvelteForge Admin. Route groups, auth guards, layouts, breadcrumbs, form actions, and API routes for your Svelte 5 admin dashboard."
	/>
</svelte:head>

<h1>Routing &amp; Navigation</h1>

<p>
	SvelteForge Admin is built on <strong>SvelteKit's</strong> file-based routing system. Every file
	inside <code>src/routes/</code> automatically becomes a route in your application — no router
	configuration needed. <strong>SvelteKit</strong> handles server-side rendering, client-side
	navigation, data loading, and form handling out of the box for every route your
	<strong>Svelte 5</strong> components define.
</p>

<h2>File-Based Routing Overview</h2>

<p>
	In <strong>SvelteKit</strong>, the filesystem <em>is</em> the router. Each directory inside
	<code>src/routes/</code> maps to a URL path, and special files within each directory define what happens
	at that route:
</p>

<table>
	<thead>
		<tr>
			<th>File</th>
			<th>Purpose</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>+page.svelte</code></td>
			<td>The <strong>Svelte 5</strong> component rendered for this route</td>
		</tr>
		<tr>
			<td><code>+page.server.ts</code></td>
			<td>Server-side data loading (<code>load</code>) and form mutations (<code>actions</code>)</td
			>
		</tr>
		<tr>
			<td><code>+layout.svelte</code></td>
			<td>Shared UI wrapper (sidebar, header) for this route and its children</td>
		</tr>
		<tr>
			<td><code>+layout.server.ts</code></td>
			<td>Server-side data loading shared across child routes</td>
		</tr>
		<tr>
			<td><code>+server.ts</code></td>
			<td>API endpoint (GET, POST, PUT, DELETE handlers)</td>
		</tr>
		<tr>
			<td><code>+error.svelte</code></td>
			<td>Custom error page for this route subtree</td>
		</tr>
	</tbody>
</table>

<h2>Route Groups in SvelteForge</h2>

<p>
	<strong>SvelteKit</strong> supports <strong>route groups</strong> — directories wrapped in parentheses
	that organize routes with shared layouts without affecting the URL. SvelteForge Admin uses route groups
	extensively to separate concerns:
</p>

<pre><code
		>src/routes/
  (app)/              &larr; Protected routes (dashboard, users, content...)
  (auth)/             &larr; Public auth routes (login, register...)
  (public)/           &larr; Public marketing pages (pricing)
  docs/               &larr; Documentation (standalone layout)
  api/                &larr; API endpoints
  logout/             &larr; Standalone logout action
  sitemap.xml/        &larr; Auto-generated sitemap</code
	></pre>

<p>
	The parentheses in <code>(app)</code>, <code>(auth)</code>, and <code>(public)</code> are stripped
	from the URL. So <code>src/routes/(app)/users/+page.svelte</code> renders at
	<code>/users</code>, not <code>/(app)/users</code>. This is a core
	<strong>SvelteKit</strong> feature that lets you apply different layouts to different route groups while
	keeping clean URLs.
</p>

<h3>(app) — Protected Routes</h3>

<p>
	All authenticated pages live under <code>(app)/</code>. The layout server file acts as an auth
	guard, redirecting unauthenticated users to the login page. Every <strong>Svelte 5</strong>
	component in this group receives user data and notification counts from the layout.
</p>

<table>
	<thead>
		<tr>
			<th>Route</th>
			<th>URL</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>(app)/+page.svelte</code></td>
			<td><code>/</code></td>
			<td>Dashboard with analytics overview</td>
		</tr>
		<tr>
			<td><code>(app)/users/</code></td>
			<td><code>/users</code></td>
			<td>User management with CRUD, search, and export</td>
		</tr>
		<tr>
			<td><code>(app)/content/</code></td>
			<td><code>/content</code></td>
			<td>Content management (pages list)</td>
		</tr>
		<tr>
			<td><code>(app)/content/new/</code></td>
			<td><code>/content/new</code></td>
			<td>Create new page</td>
		</tr>
		<tr>
			<td><code>(app)/content/[id]/edit/</code></td>
			<td><code>/content/:id/edit</code></td>
			<td>Edit existing page (dynamic route parameter)</td>
		</tr>
		<tr>
			<td><code>(app)/analytics/</code></td>
			<td><code>/analytics</code></td>
			<td>Charts and data visualization</td>
		</tr>
		<tr>
			<td><code>(app)/notifications/</code></td>
			<td><code>/notifications</code></td>
			<td>Notification center with filtering</td>
		</tr>
		<tr>
			<td><code>(app)/roles/</code></td>
			<td><code>/roles</code></td>
			<td>Role management</td>
		</tr>
		<tr>
			<td><code>(app)/database/</code></td>
			<td><code>/database</code></td>
			<td>Database browser and stats</td>
		</tr>
		<tr>
			<td><code>(app)/settings/</code></td>
			<td><code>/settings</code></td>
			<td>Application settings</td>
		</tr>
	</tbody>
</table>

<h3>(auth) — Public Auth Routes</h3>

<p>
	Authentication pages use a centered card layout with no sidebar. These are the only routes
	accessible without logging in (besides public and docs pages).
</p>

<table>
	<thead>
		<tr>
			<th>Route</th>
			<th>URL</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>(auth)/login/</code></td>
			<td><code>/login</code></td>
			<td>Email/password login + OAuth buttons</td>
		</tr>
		<tr>
			<td><code>(auth)/register/</code></td>
			<td><code>/register</code></td>
			<td>New account registration</td>
		</tr>
		<tr>
			<td><code>(auth)/forgot-password/</code></td>
			<td><code>/forgot-password</code></td>
			<td>Request password reset token</td>
		</tr>
		<tr>
			<td><code>(auth)/reset-password/</code></td>
			<td><code>/reset-password</code></td>
			<td>Set new password with valid token</td>
		</tr>
		<tr>
			<td><code>(auth)/lock/</code></td>
			<td><code>/lock</code></td>
			<td>Lock screen (re-enter password)</td>
		</tr>
		<tr>
			<td><code>(auth)/login/google/</code></td>
			<td><code>/login/google</code></td>
			<td>Google OAuth redirect + callback</td>
		</tr>
		<tr>
			<td><code>(auth)/login/github/</code></td>
			<td><code>/login/github</code></td>
			<td>GitHub OAuth redirect + callback</td>
		</tr>
	</tbody>
</table>

<h3>(public) — Public Marketing Pages</h3>

<table>
	<thead>
		<tr>
			<th>Route</th>
			<th>URL</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>(public)/pricing/</code></td>
			<td><code>/pricing</code></td>
			<td>Pricing page (no auth required)</td>
		</tr>
	</tbody>
</table>

<h3>Other Routes</h3>

<table>
	<thead>
		<tr>
			<th>Route</th>
			<th>URL</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>docs/</code></td>
			<td><code>/docs</code></td>
			<td>Documentation with its own sidebar layout</td>
		</tr>
		<tr>
			<td><code>api/search/</code></td>
			<td><code>/api/search</code></td>
			<td>Search endpoint for the command palette</td>
		</tr>
		<tr>
			<td><code>logout/</code></td>
			<td><code>/logout</code></td>
			<td>Server-only logout action (no +page.svelte, just +page.server.ts)</td>
		</tr>
		<tr>
			<td><code>sitemap.xml/</code></td>
			<td><code>/sitemap.xml</code></td>
			<td>Auto-generated XML sitemap</td>
		</tr>
	</tbody>
</table>

<h2>Auth Guard Deep Dive</h2>

<p>
	The auth guard is implemented in <code>(app)/+layout.server.ts</code>. Because
	<strong>SvelteKit</strong> runs layout server loads before page server loads, this single file
	protects every route in the <code>(app)</code> group.
</p>

<pre><code class="language-typescript"
		>// src/routes/(app)/+layout.server.ts
import &#123; redirect, error &#125; from "@sveltejs/kit";
import &#123; db &#125; from "$lib/server/db/index.js";
import &#123; notifications, appSettings &#125; from "$lib/server/db/schema.js";
import &#123; eq, and, or, isNull, sql, desc &#125; from "drizzle-orm";
import type &#123; LayoutServerLoad &#125; from "./$types.js";

export const load: LayoutServerLoad = async (&#123; locals &#125;) =&gt; &#123;
  // Auth check — redirect to login if not authenticated
  if (!locals.user) &#123;
    redirect(302, "/login");
  &#125;

  // Maintenance mode — block non-admins with 503
  const maintenanceSetting = await db.query.appSettings.findFirst(&#123;
    where: eq(appSettings.key, "maintenanceMode"),
  &#125;);
  if (maintenanceSetting?.value === "true" &amp;&amp; locals.user.role !== "admin") &#123;
    error(503, "The application is currently under maintenance.");
  &#125;

  // Load sidebar data: unread count + recent notifications
  const userNotificationFilter = or(
    eq(notifications.userId, locals.user.id),
    isNull(notifications.userId)
  );

  const [countResult] = await db
    .select(&#123; count: sql&lt;number&gt;`count(*)` &#125;)
    .from(notifications)
    .where(and(eq(notifications.read, false), userNotificationFilter));

  const recentNotifications = await db
    .select(&#123;
      id: notifications.id,
      title: notifications.title,
      message: notifications.message,
      type: notifications.type,
      createdAt: notifications.createdAt,
    &#125;)
    .from(notifications)
    .where(and(eq(notifications.read, false), userNotificationFilter))
    .orderBy(desc(notifications.createdAt))
    .limit(5);

  return &#123;
    user: locals.user,
    unreadNotificationCount: countResult?.count ?? 0,
    recentNotifications,
  &#125;;
&#125;;</code
	></pre>

<p>This layout server load does three things:</p>

<ol>
	<li>
		<strong>Authentication check</strong> — If <code>locals.user</code> is null (no valid session),
		<strong>SvelteKit's</strong> <code>redirect()</code> sends a 302 to
		<code>/login</code>. No child route ever renders.
	</li>
	<li>
		<strong>Maintenance mode</strong> — If the <code>maintenanceMode</code> app setting is "true", non-admin
		users see a 503 error. Admins can still access the dashboard to manage the app.
	</li>
	<li>
		<strong>Sidebar data</strong> — Loads unread notification count and the 5 most recent unread
		notifications. This data is available to every <strong>Svelte 5</strong> component in the
		<code>(app)</code> group via <code>$page.data</code>.
	</li>
</ol>

<h2>Server Hooks</h2>

<p>
	<strong>SvelteKit's</strong> <code>hooks.server.ts</code> runs on <em>every</em> request before
	any route handler. SvelteForge uses it to validate sessions and populate
	<code>event.locals</code>:
</p>

<pre><code class="language-typescript"
		>// src/hooks.server.ts
import &#123;
  validateSession,
  setSessionCookie,
  deleteSessionCookie,
  SESSION_COOKIE_NAME,
&#125; from "$lib/server/auth.js";
import type &#123; Handle &#125; from "@sveltejs/kit";

export const handle: Handle = async (&#123; event, resolve &#125;) =&gt; &#123;
  const token = event.cookies.get(SESSION_COOKIE_NAME);
  if (!token) &#123;
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  &#125;

  const &#123; session, user &#125; = await validateSession(token);

  if (session) &#123;
    // Refresh cookie and update session metadata (UA, IP)
    setSessionCookie(event.cookies, token, session.expiresAt);
    // ... update userAgent and ipAddress in DB
  &#125; else &#123;
    deleteSessionCookie(event.cookies);
  &#125;

  event.locals.user = user;
  event.locals.session = session;
  return resolve(event);
&#125;;</code
	></pre>

<p>
	After the hook runs, every <strong>SvelteKit</strong> server route (load functions, actions, API
	handlers) can access <code>event.locals.user</code> and <code>event.locals.session</code>. These
	types are defined in <code>src/app.d.ts</code>:
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

<h2>Layout Hierarchy</h2>

<p>
	<strong>SvelteKit</strong> nests layouts automatically. Each route group has its own layout that wraps
	all pages within it. SvelteForge Admin has four distinct layout trees:
</p>

<h3>Root Layout</h3>

<p>
	<code>+layout.svelte</code> at the root of <code>src/routes/</code>. Minimal — it simply renders
	its children. All global providers (fonts, CSS resets, theme) are applied here.
</p>

<h3>App Layout — <code>(app)/+layout.svelte</code></h3>

<p>
	The main application shell for authenticated users. This <strong>Svelte 5</strong> component renders:
</p>

<ul>
	<li>
		<strong>Sidebar</strong> (<code>app-sidebar.svelte</code>) — Navigation links, user avatar,
		collapsible on mobile.
	</li>
	<li>
		<strong>Top bar</strong> — Breadcrumb navigation, search, notification bell, theme toggle.
	</li>
	<li>
		<strong>Command palette</strong> — Keyboard-driven search (<code>Ctrl+K</code> /
		<code>Cmd+K</code>) that queries the <code>/api/search</code> endpoint.
	</li>
	<li>
		<strong>Notification bell</strong> — Shows unread count with recent notification dropdown.
	</li>
	<li>
		<strong>Theme toggle</strong> — Dark/light mode via <code>mode-watcher</code>.
	</li>
</ul>

<h3>Auth Layout — <code>(auth)/+layout.svelte</code></h3>

<p>
	A centered card layout for login, register, and password reset pages. No sidebar or top bar — just
	a clean, focused form in the center of the screen.
</p>

<h3>Docs Layout — <code>docs/+layout.svelte</code></h3>

<p>
	This documentation layout provides its own sidebar navigation with section groupings (Getting
	Started, Core Concepts, Features, Advanced) and prose styling for article content. It is separate
	from the <code>(app)</code> layout and does not require authentication.
</p>

<h2>Breadcrumb Navigation</h2>

<p>
	The app layout auto-generates breadcrumbs from the current URL pathname. This is implemented
	directly in the <strong>Svelte 5</strong> component using <code>$derived</code>:
</p>

<pre><code class="language-svelte"
		>&lt;script lang="ts"&gt;
  import &#123; page &#125; from "$app/state";

  let segments = $derived(
    page.url.pathname
      .split("/")
      .filter(Boolean)
      .map((s) =&gt; (&#123;
        label: s.charAt(0).toUpperCase() + s.slice(1),
        href: "/" + s,
      &#125;))
  );
&lt;/script&gt;</code
	></pre>

<ul>
	<li>The path is split into segments and each segment is capitalized.</li>
	<li>
		The root path (<code>/</code>) shows "Dashboard" as the breadcrumb.
	</li>
	<li>Each breadcrumb links to its URL segment for quick navigation.</li>
</ul>

<h2>Adding New Routes</h2>

<p>
	Adding a new protected page to SvelteForge Admin takes four steps. Because
	<strong>SvelteKit's</strong> file-based routing and the <code>(app)</code> layout guard work together,
	your new route is automatically authenticated and styled.
</p>

<h3>Step 1: Create the Route Directory</h3>

<pre><code class="language-bash">mkdir -p src/routes/\(app\)/reports</code></pre>

<h3>Step 2: Add the Server Load Function</h3>

<pre><code class="language-typescript"
		>// src/routes/(app)/reports/+page.server.ts
import &#123; db &#125; from "$lib/server/db/index.js";
import &#123; pages &#125; from "$lib/server/db/schema.js";
import &#123; sql &#125; from "drizzle-orm";
import type &#123; PageServerLoad &#125; from "./$types.js";

export const load: PageServerLoad = async () =&gt; &#123;
  const stats = await db
    .select(&#123;
      status: pages.status,
      count: sql&lt;number&gt;`count(*)`,
    &#125;)
    .from(pages)
    .groupBy(pages.status);

  return &#123; stats &#125;;
&#125;;</code
	></pre>

<h3>Step 3: Add the Svelte 5 Page Component</h3>

<pre><code class="language-svelte"
		>&lt;!-- src/routes/(app)/reports/+page.svelte --&gt;
&lt;script lang="ts"&gt;
  let &#123; data &#125; = $props();
&lt;/script&gt;

&lt;div class="space-y-6"&gt;
  &lt;h1 class="text-2xl font-bold"&gt;Reports&lt;/h1&gt;

  &lt;div class="grid gap-4 md:grid-cols-3"&gt;
    &#123;#each data.stats as stat&#125;
      &lt;div class="rounded-lg border p-4"&gt;
        &lt;p class="text-muted-foreground text-sm"&gt;&#123;stat.status&#125;&lt;/p&gt;
        &lt;p class="text-3xl font-bold"&gt;&#123;stat.count&#125;&lt;/p&gt;
      &lt;/div&gt;
    &#123;/each&#125;
  &lt;/div&gt;
&lt;/div&gt;</code
	></pre>

<h3>Step 4: Add Sidebar Link</h3>

<p>
	Add a navigation entry in <code>src/lib/components/app-sidebar.svelte</code>. The auth guard in
	<code>(app)/+layout.server.ts</code> automatically protects the new route — no additional configuration
	needed.
</p>

<h2>Form Actions</h2>

<p>
	<strong>SvelteKit</strong> form actions handle server-side mutations (create, update, delete) with built-in
	progressive enhancement. SvelteForge Admin uses them throughout — here is a pattern from the user management
	page:
</p>

<h3>Server-Side Action</h3>

<pre><code class="language-typescript"
		>// src/routes/(app)/users/+page.server.ts
import &#123; fail &#125; from "@sveltejs/kit";
import type &#123; Actions &#125; from "./$types.js";

export const actions: Actions = &#123;
  create: async (&#123; request &#125;) =&gt; &#123;
    const formData = await request.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    const username = formData.get("username");
    const password = formData.get("password");
    const role = formData.get("role");

    // Server-side validation
    if (typeof name !== "string" || name.length &lt; 1 || name.length &gt; 100) &#123;
      return fail(400, &#123; message: "Name is required (1-100 characters)" &#125;);
    &#125;
    if (typeof email !== "string" || !email.includes("@")) &#123;
      return fail(400, &#123; message: "Valid email is required" &#125;);
    &#125;

    // ... hash password, insert into database
    await db.insert(users).values(&#123;
      id: generateId(10),
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      passwordHash,
      name,
      role: role as "admin" | "editor" | "viewer",
    &#125;);

    return &#123; success: true &#125;;
  &#125;,
&#125;;</code
	></pre>

<h3>Svelte 5 Form Component</h3>

<pre><code class="language-svelte"
		>&lt;script lang="ts"&gt;
  import &#123; enhance &#125; from "$app/forms";

  let &#123; form &#125; = $props();
&lt;/script&gt;

&lt;form method="POST" action="?/create" use:enhance&gt;
  &lt;input name="name" required /&gt;
  &lt;input name="email" type="email" required /&gt;
  &lt;input name="username" required /&gt;
  &lt;input name="password" type="password" required /&gt;
  &lt;select name="role"&gt;
    &lt;option value="viewer"&gt;Viewer&lt;/option&gt;
    &lt;option value="editor"&gt;Editor&lt;/option&gt;
    &lt;option value="admin"&gt;Admin&lt;/option&gt;
  &lt;/select&gt;
  &lt;button type="submit"&gt;Create User&lt;/button&gt;

  &#123;#if form?.message&#125;
    &lt;p class="text-destructive"&gt;&#123;form.message&#125;&lt;/p&gt;
  &#123;/if&#125;
&lt;/form&gt;</code
	></pre>

<p>Key points about <strong>SvelteKit</strong> form actions:</p>

<ul>
	<li>
		<strong>Progressive enhancement</strong> — The <code>use:enhance</code> directive makes forms submit
		via fetch with no page reload, but they still work without JavaScript enabled.
	</li>
	<li>
		<strong>Server-side validation</strong> — Always validate on the server. The
		<code>fail()</code> function returns error data to the <strong>Svelte 5</strong> component via
		the <code>form</code> prop.
	</li>
	<li>
		<strong>Named actions</strong> — The <code>action="?/create"</code> attribute targets a specific
		named action. A single <code>+page.server.ts</code> can export multiple actions (create, update, delete).
	</li>
	<li>
		<strong>Automatic revalidation</strong> — After a successful action,
		<strong>SvelteKit</strong> automatically reruns the page's <code>load</code> function and
		updates the <strong>Svelte 5</strong> component with fresh data.
	</li>
</ul>

<h2>API Routes</h2>

<p>
	<strong>SvelteKit</strong> API routes are defined in <code>+server.ts</code> files and export HTTP method
	handlers.
</p>

<h3>/api/search — Command Palette Search</h3>

<p>
	The search endpoint powers the command palette (<code>Ctrl+K</code>). It queries users, pages, and
	notifications in parallel using <code>Promise.all</code>:
</p>

<pre><code class="language-typescript"
		>// src/routes/api/search/+server.ts
import &#123; json, error &#125; from "@sveltejs/kit";
import type &#123; RequestHandler &#125; from "./$types.js";

export const GET: RequestHandler = async (&#123; url, locals &#125;) =&gt; &#123;
  if (!locals.user) &#123;
    error(401, "Unauthorized");
  &#125;

  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length &lt; 2) return json([]);

  const pattern = `%$&#123;q&#125;%`;

  const [userResults, pageResults, notificationResults] =
    await Promise.all([
      db.select(&#123; id: users.id, name: users.name, email: users.email &#125;)
        .from(users)
        .where(or(sql`$&#123;users.name&#125; LIKE $&#123;pattern&#125;`, sql`$&#123;users.email&#125; LIKE $&#123;pattern&#125;`))
        .limit(5),
      db.select(&#123; id: pages.id, title: pages.title, slug: pages.slug &#125;)
        .from(pages)
        .where(sql`$&#123;pages.title&#125; LIKE $&#123;pattern&#125;`)
        .limit(5),
      // ... notifications query
    ]);

  return json(results);
&#125;;</code
	></pre>

<h3>/sitemap.xml — Auto-Generated Sitemap</h3>

<p>
	The sitemap endpoint generates XML dynamically from the application's routes. It is served at
	<code>/sitemap.xml</code> — <strong>SvelteKit</strong> treats directories named with file extensions
	as valid routes.
</p>

<h2>Page Transitions</h2>

<p>
	SvelteForge Admin uses the <strong>View Transitions API</strong> for smooth cross-fade animations
	when navigating between pages. <strong>SvelteKit</strong> has built-in support for view
	transitions — you can enable them by adding the <code>onNavigate</code> lifecycle hook:
</p>

<pre><code class="language-svelte"
		>&lt;script lang="ts"&gt;
  import &#123; onNavigate &#125; from "$app/navigation";

  onNavigate((navigation) =&gt; &#123;
    if (!document.startViewTransition) return;
    return new Promise((resolve) =&gt; &#123;
      document.startViewTransition(async () =&gt; &#123;
        resolve();
        await navigation.complete;
      &#125;);
    &#125;);
  &#125;);
&lt;/script&gt;</code
	></pre>

<p>
	This provides a smooth cross-fade between pages in browsers that support the View Transitions API,
	while falling back gracefully to instant navigation in older browsers.
</p>

<h2>Summary</h2>

<p>
	<strong>SvelteKit's</strong> routing system gives SvelteForge Admin a clean, convention-based architecture:
</p>

<ul>
	<li>
		<strong>Route groups</strong> (<code>(app)</code>, <code>(auth)</code>,
		<code>(public)</code>) separate concerns with different layouts.
	</li>
	<li>
		<strong>Layout server loads</strong> provide auth guards and shared data to all child
		<strong>Svelte 5</strong> components.
	</li>
	<li>
		<strong>Server hooks</strong> validate sessions on every request before any route handler runs.
	</li>
	<li>
		<strong>Form actions</strong> handle mutations with progressive enhancement and server-side validation.
	</li>
	<li>
		<strong>API routes</strong> power features like the command palette search.
	</li>
	<li>
		Adding a new page is as simple as creating files in the right directory — <strong
			>SvelteKit</strong
		>
		handles the rest.
	</li>
</ul>

<h2>Need More?</h2>

<div
	class="not-prose border-primary/30 bg-primary/5 my-8 rounded-xl border-2 border-dashed p-6 sm:p-8"
>
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
		<div class="flex-1">
			<h3 class="text-foreground text-lg font-bold sm:text-xl">Go Premium with DashboardPack</h3>
			<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
				SvelteForge Admin demonstrates <strong>SvelteKit's</strong> routing capabilities with a
				handful of well-crafted pages. DashboardPack premium templates take it further with 50+
				pages, nested route hierarchies, multi-step wizards, tabbed interfaces, and advanced
				<strong>Svelte 5</strong>
				component patterns — all built on <strong>SvelteKit</strong>.
			</p>
			<ul class="text-muted-foreground mt-3 space-y-1 text-sm">
				<li>
					<strong>Apex</strong> — 50+ pages with 5 unique dashboards, CRUD modules, and nested routing
					patterns
				</li>
				<li>
					<strong>Zenith</strong> — Advanced analytics with dynamic route parameters and drill-down views
				</li>
				<li>
					<strong>Signal</strong> — Real-time monitoring with streaming data via SvelteKit server-sent
					events
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
