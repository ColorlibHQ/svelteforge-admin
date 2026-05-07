<svelte:head>
	<title>Notifications - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="In-app notification system for SvelteForge Admin — built with SvelteKit form actions, Svelte 5 reactivity, and Drizzle ORM."
	/>
</svelte:head>

<h1>Notifications</h1>

<p>
	SvelteForge Admin includes a full in-app notification system built with
	<strong>SvelteKit</strong> form actions and <strong>Svelte 5</strong> reactivity. Notifications support
	four severity types, per-user and global targeting, real-time badge counts, and bulk operations — all
	without any external dependencies or third-party services.
</p>

<h2>Notification Types</h2>

<p>
	Each notification has a <code>type</code> field that determines its visual styling — icon, color, and
	badge appearance:
</p>

<table>
	<thead>
		<tr>
			<th>Type</th>
			<th>Color</th>
			<th>Icon</th>
			<th>Use Case</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>info</code></td>
			<td>Blue</td>
			<td>InfoIcon</td>
			<td>General information, system announcements</td>
		</tr>
		<tr>
			<td><code>warning</code></td>
			<td>Yellow / Amber</td>
			<td>AlertTriangleIcon</td>
			<td>Attention needed, approaching limits</td>
		</tr>
		<tr>
			<td><code>error</code></td>
			<td>Red</td>
			<td>CircleAlertIcon</td>
			<td>Errors, failures, critical issues</td>
		</tr>
		<tr>
			<td><code>success</code></td>
			<td>Green</td>
			<td>CheckCircleIcon</td>
			<td>Completed actions, confirmations</td>
		</tr>
	</tbody>
</table>

<p>
	Colors are applied with dark mode variants using Tailwind CSS utility classes (e.g.,
	<code>text-yellow-600 dark:text-yellow-400</code>).
</p>

<h2>Database Schema</h2>

<p>
	Notifications are stored in the <code>notifications</code> table, defined in
	<code>src/lib/server/db/schema.ts</code> using Drizzle ORM:
</p>

<pre><code class="language-typescript"
		>export const notifications = sqliteTable("notifications", &#123;
  id: text("id").primaryKey(),
  userId: text("user_id").references(() =&gt; users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", &#123;
    enum: ["info", "warning", "error", "success"]
  &#125;).notNull().default("info"),
  read: integer("read", &#123; mode: "boolean" &#125;).notNull().default(false),
  createdAt: integer("created_at", &#123; mode: "timestamp" &#125;)
    .notNull()
    .$defaultFn(() =&gt; new Date()),
&#125;);</code
	></pre>

<table>
	<thead>
		<tr>
			<th>Column</th>
			<th>Type</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>id</code></td>
			<td><code>text</code> (PK)</td>
			<td>Unique identifier generated with <code>generateId()</code></td>
		</tr>
		<tr>
			<td><code>userId</code></td>
			<td><code>text</code> (nullable)</td>
			<td>Target user. <strong>NULL = global notification</strong> shown to all users</td>
		</tr>
		<tr>
			<td><code>title</code></td>
			<td><code>text</code></td>
			<td>Short notification heading</td>
		</tr>
		<tr>
			<td><code>message</code></td>
			<td><code>text</code></td>
			<td>Notification body text</td>
		</tr>
		<tr>
			<td><code>type</code></td>
			<td><code>text</code> (enum)</td>
			<td>One of: info, warning, error, success</td>
		</tr>
		<tr>
			<td><code>read</code></td>
			<td><code>integer</code> (boolean)</td>
			<td>Whether the user has read this notification</td>
		</tr>
		<tr>
			<td><code>createdAt</code></td>
			<td><code>integer</code> (timestamp)</td>
			<td>Creation timestamp (Drizzle <code>mode: "timestamp"</code> for Date objects)</td>
		</tr>
	</tbody>
</table>

<p>
	<strong>Global notifications:</strong> When <code>userId</code> is <code>NULL</code>, the
	notification is shown to every user. This is useful for system-wide announcements, maintenance
	warnings, or feature launch notices. User-specific notifications are linked via a foreign key to
	the <code>users</code> table.
</p>

<h2>Notification Bell Component</h2>

<p>
	The notification bell lives in the top navigation bar of the app layout (the header area of the
	sidebar shell). It is implemented as a Svelte 5 component at
	<code>$lib/components/notification-bell.svelte</code>.
</p>

<h3>Props</h3>

<pre><code class="language-typescript"
		>let &#123;
  count = 0,
  notifications = []
&#125;: &#123;
  count: number;
  notifications: Notification[]
&#125; = $props();</code
	></pre>

<table>
	<thead>
		<tr>
			<th>Prop</th>
			<th>Type</th>
			<th>Default</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>count</code></td>
			<td><code>number</code></td>
			<td><code>0</code></td>
			<td>Number of unread notifications (displayed as badge)</td>
		</tr>
		<tr>
			<td><code>notifications</code></td>
			<td><code>Notification[]</code></td>
			<td><code>[]</code></td>
			<td>Array of recent unread notifications for the popover preview</td>
		</tr>
	</tbody>
</table>

<h3>Features</h3>

<ul>
	<li>
		<strong>Unread count badge</strong> — displays the count on a red circle; caps at
		<code>"9+"</code> for double digits
	</li>
	<li>
		<strong>Popover preview</strong> — clicking the bell opens a popover showing the 5 most recent
		unread notifications via shadcn-svelte's <code>Popover</code> component
	</li>
	<li>
		<strong>Type-specific icons</strong> — each notification in the popover shows the corresponding icon
		(info, warning, error, success) with color coding
	</li>
	<li>
		<strong>Time-ago display</strong> — relative timestamps: "just now", "Xm ago", "Xh ago", "Xd ago"
	</li>
	<li>
		<strong>"View all" footer</strong> — links to the full <code>/notifications</code> page
	</li>
	<li>
		<strong>Empty state</strong> — shows a bell icon with "No notifications" when the list is empty
	</li>
</ul>

<h3>Time-Ago Helper</h3>

<pre><code class="language-typescript"
		>function timeAgo(date: Date | null) &#123;
  if (!date) return "";
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes &lt; 1) return "just now";
  if (minutes &lt; 60) return `$&#123;minutes&#125;m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours &lt; 24) return `$&#123;hours&#125;h ago`;
  const days = Math.floor(hours / 24);
  return `$&#123;days&#125;d ago`;
&#125;</code
	></pre>

<h2>Notifications Page</h2>

<p>
	The full notifications management page at <code>/notifications</code> provides a complete CRUD
	interface using <strong>SvelteKit form actions</strong> with progressive enhancement.
</p>

<h3>Available Actions</h3>

<table>
	<thead>
		<tr>
			<th>Action</th>
			<th>Form Action</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Mark as read</td>
			<td><code>?/markRead</code></td>
			<td>Mark a single notification as read (hidden input: <code>id</code>)</td>
		</tr>
		<tr>
			<td>Mark all as read</td>
			<td><code>?/markAllRead</code></td>
			<td>Bulk-mark all unread notifications for the current user</td>
		</tr>
		<tr>
			<td>Delete</td>
			<td><code>?/delete</code></td>
			<td>Delete a single notification (hidden input: <code>id</code>)</td>
		</tr>
	</tbody>
</table>

<h3>Page Features</h3>

<ul>
	<li>
		<strong>Unread count header</strong> — dynamically shows "You have X unread notifications" or
		"All caught up" using <code>$derived</code>
	</li>
	<li>
		<strong>Unread highlighting</strong> — unread notifications get a
		<code>border-primary/30 bg-primary/5</code> card style with a "New" badge
	</li>
	<li>
		<strong>Type icons and colors</strong> — same icon/color mapping as the bell component for visual
		consistency
	</li>
	<li>
		<strong>Formatted timestamps</strong> — full date display using
		<code>Intl.DateTimeFormat</code> (e.g., "Mar 7, 2:30 PM")
	</li>
	<li>
		<strong>Empty state</strong> — dashed border placeholder with bell icon when no notifications exist
	</li>
	<li>
		<strong>Toast feedback</strong> — success and error toasts via <code>svelte-sonner</code>
		after form submissions
	</li>
</ul>

<h2>Server-Side Data Loading</h2>

<p>
	The notifications page loads data through SvelteKit's <code>+page.server.ts</code> load function.
	The query fetches both user-specific notifications and global notifications (where
	<code>userId IS NULL</code>):
</p>

<pre><code class="language-typescript"
		>// src/routes/(app)/notifications/+page.server.ts
import &#123; db &#125; from "$lib/server/db/index.js";
import &#123; notifications &#125; from "$lib/server/db/schema.js";
import &#123; eq, or, isNull, desc &#125; from "drizzle-orm";

export const load: PageServerLoad = async (&#123; locals &#125;) =&gt; &#123;
  const items = await db
    .select()
    .from(notifications)
    .where(
      or(
        eq(notifications.userId, locals.user!.id),
        isNull(notifications.userId)
      )
    )
    .orderBy(desc(notifications.createdAt));

  return &#123; notifications: items &#125;;
&#125;;</code
	></pre>

<p>
	The <code>(app)</code> layout server also loads the unread count so the notification bell badge stays
	current across all protected pages without additional requests.
</p>

<h2>Creating Notifications</h2>

<p>
	To create a notification from any server-side code (form actions, API routes, hooks), insert
	directly into the notifications table:
</p>

<pre><code class="language-typescript"
		>import &#123; db &#125; from "$lib/server/db/index.js";
import &#123; notifications &#125; from "$lib/server/db/schema.js";
import &#123; generateId &#125; from "$lib/server/id.js";

// User-specific notification
await db.insert(notifications).values(&#123;
  id: generateId(),
  userId: "user_abc123",
  title: "Content Published",
  message: "Your article 'Getting Started' is now live.",
  type: "success",
&#125;);

// Global notification (shown to all users)
await db.insert(notifications).values(&#123;
  id: generateId(),
  userId: null,
  title: "Scheduled Maintenance",
  message: "The platform will be down for maintenance on Sunday 2am-4am UTC.",
  type: "warning",
&#125;);</code
	></pre>

<p>
	The <code>read</code> field defaults to <code>false</code> and <code>createdAt</code> is
	auto-generated by Drizzle's <code>$defaultFn</code> — you do not need to set either.
</p>

<h2>Svelte 5 Patterns</h2>

<p>
	The notification system demonstrates several <strong>Svelte 5</strong> reactivity patterns:
</p>

<h3>Reactive Derived State</h3>

<pre><code class="language-typescript"
		>// Computed unread count — updates automatically when data changes
const unreadCount = $derived(
  data.notifications.filter((n) =&gt; !n.read).length
);</code
	></pre>

<h3>Props with Defaults</h3>

<pre><code class="language-typescript"
		>// Svelte 5 $props() with destructured defaults
let &#123;
  count = 0,
  notifications = []
&#125;: &#123;
  count: number;
  notifications: Notification[];
&#125; = $props();</code
	></pre>

<h3>Progressive Enhancement with use:enhance</h3>

<pre><code class="language-svelte"
		>&lt;!-- Form action with SvelteKit's progressive enhancement --&gt;
&lt;form method="POST" action="?/markRead" use:enhance&gt;
  &lt;input type="hidden" name="id" value=&#123;notification.id&#125; /&gt;
  &lt;Button variant="ghost" size="icon" type="submit"&gt;
    &lt;CheckIcon class="size-4" /&gt;
  &lt;/Button&gt;
&lt;/form&gt;</code
	></pre>

<p>
	The <code>use:enhance</code> directive from <code>$app/forms</code> prevents full-page reloads on form
	submission. SvelteKit automatically invalidates the page data after the action completes, so the notification
	list and unread count update reactively.
</p>

<h3>Effect-Based Toast Feedback</h3>

<pre><code class="language-typescript"
		>// Show toast notifications after form actions
$effect(() =&gt; &#123;
  if (form?.message) toast.error(form.message);
  if (form?.success) toast.success("Done");
&#125;);</code
	></pre>

<h2>Security</h2>

<p>
	All notification actions (mark read, delete) include authorization checks. The
	<code>where</code> clause ensures users can only modify their own notifications or global notifications:
</p>

<pre><code class="language-typescript"
		>// Only allow actions on user's own or global notifications
.where(
  and(
    eq(notifications.id, id),
    or(
      eq(notifications.userId, locals.user!.id),
      isNull(notifications.userId)
    )
  )
)</code
	></pre>

<h2>Key Files</h2>

<table>
	<thead>
		<tr>
			<th>File</th>
			<th>Purpose</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>src/lib/components/notification-bell.svelte</code></td>
			<td>Bell icon with popover preview in the app header</td>
		</tr>
		<tr>
			<td><code>src/routes/(app)/notifications/+page.svelte</code></td>
			<td>Full notifications list page with CRUD actions</td>
		</tr>
		<tr>
			<td><code>src/routes/(app)/notifications/+page.server.ts</code></td>
			<td>Server load function and form actions (markRead, markAllRead, delete)</td>
		</tr>
		<tr>
			<td><code>src/lib/server/db/schema.ts</code></td>
			<td>Drizzle schema — notifications table definition</td>
		</tr>
		<tr>
			<td><code>src/lib/server/id.ts</code></td>
			<td>ID generator used for new notification records</td>
		</tr>
	</tbody>
</table>

<h2>Need More?</h2>

<div
	class="not-prose border-primary/30 bg-primary/5 my-8 rounded-xl border-2 border-dashed p-6 sm:p-8"
>
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
		<div class="flex-1">
			<h3 class="text-foreground text-lg font-bold sm:text-xl">
				Real-Time Notifications with DashboardPack
			</h3>
			<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
				Need real-time notifications with WebSocket support, push notifications, and email
				integration? Our premium templates include live notification streams, configurable delivery
				channels (in-app, email, push), notification preferences per user, and scheduled
				notification campaigns.
			</p>
			<ul class="text-muted-foreground mt-3 space-y-1 text-sm">
				<li>WebSocket-powered real-time notification delivery</li>
				<li>Push notifications via Web Push API with service workers</li>
				<li>Email notification digests (instant, hourly, daily)</li>
				<li>Per-user notification preferences and mute controls</li>
				<li>Notification templates with variable interpolation</li>
			</ul>
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
