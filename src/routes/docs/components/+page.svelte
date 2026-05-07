<svelte:head>
	<title>Components - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="Comprehensive guide to all Svelte 5 components in SvelteForge Admin — built with runes, shadcn-svelte, and SvelteKit."
	/>
</svelte:head>

<h1>Components</h1>

<p>
	Every component in SvelteForge Admin is built with <strong>Svelte 5's runes API</strong>. There
	are no legacy <code>export let</code> declarations or <code>$:</code> reactive statements anywhere
	in the codebase. Instead, components use <code>$props</code> for inputs, <code>$state</code> for
	local reactivity, <code>$derived</code> for computed values, <code>$effect</code> for side
	effects, and <code>&#123;@render&#125;</code> for snippet-based composition.
</p>

<p>
	This approach takes full advantage of the <strong>Svelte compiler</strong> — every rune is compiled
	away at build time into efficient vanilla JavaScript with no runtime overhead.
</p>

<h2>shadcn-svelte Foundation</h2>

<p>
	SvelteForge Admin's UI layer is built on <strong>shadcn-svelte</strong>, a collection of
	beautifully designed, accessible components built on top of
	<strong>bits-ui</strong> headless primitives. Unlike traditional component libraries, shadcn-svelte
	components are copied into your project — you own the code and can customize it freely.
</p>

<h3>Where components live</h3>

<p>
	All shadcn-svelte components are installed into <code>src/lib/components/ui/</code>. Each
	component has its own directory with an <code>index.ts</code> barrel export.
</p>

<h3>Important: do not edit directly</h3>

<p>
	If you need to update a shadcn-svelte component to the latest version, re-add it with the CLI
	rather than editing the files manually:
</p>

<pre><code>npx shadcn-svelte@latest add &lt;component-name&gt;</code></pre>

<p>This will overwrite the component with the latest version while preserving your theme tokens.</p>

<h3>Available UI components</h3>

<p>SvelteForge Admin includes the following shadcn-svelte components out of the box:</p>

<table>
	<thead>
		<tr>
			<th>Component</th>
			<th>Purpose</th>
		</tr>
	</thead>
	<tbody>
		<tr
			><td><strong>Button</strong></td><td
				>Primary interaction element with multiple variants (default, destructive, outline,
				secondary, ghost, link)</td
			></tr
		>
		<tr
			><td><strong>Card</strong></td><td
				>Content container with header, content, and footer sections</td
			></tr
		>
		<tr><td><strong>Dialog</strong></td><td>Modal overlay for focused interactions</td></tr>
		<tr
			><td><strong>Alert Dialog</strong></td><td>Confirmation modals for destructive actions</td
			></tr
		>
		<tr><td><strong>Dropdown Menu</strong></td><td>Contextual menu with keyboard navigation</td></tr
		>
		<tr><td><strong>Avatar</strong></td><td>User profile image with fallback initials</td></tr>
		<tr><td><strong>Badge</strong></td><td>Status indicators and labels</td></tr>
		<tr><td><strong>Breadcrumb</strong></td><td>Navigation trail for page hierarchy</td></tr>
		<tr><td><strong>Separator</strong></td><td>Visual divider between content sections</td></tr>
		<tr><td><strong>Sidebar</strong></td><td>Collapsible navigation sidebar primitives</td></tr>
		<tr><td><strong>Sonner</strong></td><td>Toast notification system</td></tr>
		<tr
			><td><strong>Command</strong></td><td>Command palette primitives (search + keyboard nav)</td
			></tr
		>
		<tr><td><strong>Popover</strong></td><td>Floating content anchored to a trigger</td></tr>
		<tr><td><strong>Input</strong></td><td>Text input with consistent styling</td></tr>
		<tr><td><strong>Label</strong></td><td>Accessible form labels</td></tr>
		<tr><td><strong>Select</strong></td><td>Dropdown select with keyboard support</td></tr>
		<tr
			><td><strong>Table</strong></td><td>Data tables with header, body, and row components</td></tr
		>
		<tr><td><strong>Tabs</strong></td><td>Tabbed content navigation</td></tr>
		<tr><td><strong>Tooltip</strong></td><td>Hover-triggered contextual hints</td></tr>
		<tr><td><strong>Sheet</strong></td><td>Slide-in panel from screen edge</td></tr>
	</tbody>
</table>

<h2>App-Level Components</h2>

<p>
	Built on top of the shadcn-svelte primitives, SvelteForge Admin includes purpose-built
	<strong>Svelte 5</strong> components for the admin dashboard experience. Each one uses the runes API
	exclusively.
</p>

<h3>1. App Sidebar</h3>

<p><code>src/lib/components/app-sidebar.svelte</code></p>

<p>
	The primary navigation component for the entire application. It provides a collapsible sidebar
	with grouped navigation links, a user dropdown, and notification count integration.
</p>

<h4>Structure</h4>

<ul>
	<li><strong>Overview group</strong> — Dashboard, Analytics</li>
	<li><strong>Management group</strong> — Users, Content, Notifications</li>
	<li><strong>System group</strong> — Roles, Database, Settings</li>
</ul>

<h4>User dropdown</h4>

<p>
	The sidebar footer displays the current user's avatar, name, and email. Clicking opens a dropdown
	menu with:
</p>

<ul>
	<li>Role badge (admin, editor, or viewer) with color coding</li>
	<li>Link to account settings</li>
	<li>Logout action</li>
</ul>

<h4>Notification badge</h4>

<p>
	The Notifications link displays an unread count badge when there are unread notifications. This
	count is passed as a prop and updates reactively.
</p>

<h4>Svelte 5 patterns used</h4>

<ul>
	<li>
		<code>$derived</code> — Builds the reactive navigation array so active states update automatically
		when the URL changes
	</li>
	<li>
		Built entirely with shadcn-svelte Sidebar primitives (<code>Sidebar.Content</code>,
		<code>Sidebar.Group</code>, <code>Sidebar.MenuItem</code>, etc.)
	</li>
</ul>

<h4>Props</h4>

<table>
	<thead>
		<tr><th>Prop</th><th>Type</th><th>Description</th></tr>
	</thead>
	<tbody>
		<tr
			><td><code>user</code></td><td><code>&#123; name, email, username, role &#125;</code></td><td
				>Current authenticated user</td
			></tr
		>
		<tr
			><td><code>notificationCount</code></td><td><code>number</code></td><td
				>Unread notification count for badge display</td
			></tr
		>
	</tbody>
</table>

<h3>2. Command Palette</h3>

<p><code>src/lib/components/command-palette.svelte</code></p>

<p>
	A keyboard-driven command palette triggered by <strong>Cmd+K</strong> (macOS) or
	<strong>Ctrl+K</strong> (Windows/Linux). It provides instant navigation, search, and quick actions —
	a power-user feature built on bits-ui Command primitives and the shadcn Dialog.
</p>

<h4>Three sections</h4>

<ol>
	<li>
		<strong>Navigation</strong> — Eight quick-access routes: Dashboard, Users, Content, Analytics, Notifications,
		Roles, Database, Settings
	</li>
	<li>
		<strong>Search Results</strong> — API-driven search that queries
		<code>/api/search?q=&#123;query&#125;</code>. Results are type-aware and display contextual
		icons: user results show a user icon, page results show a document icon, notification results
		show a bell icon.
	</li>
	<li>
		<strong>Quick Actions</strong> — "New Page" (navigates to content creation) and "Toggle Theme"
		(calls <code>toggleMode()</code> from mode-watcher)
	</li>
</ol>

<h4>Search behavior</h4>

<p>
	Search is <strong>debounced at 250ms</strong> to prevent excessive API calls. As the user types, the
	component waits 250ms after the last keystroke before sending the request. Results appear inline below
	the navigation section.
</p>

<h4>Svelte 5 patterns used</h4>

<ul>
	<li><code>$state</code> — Tracks the search query string and results array</li>
	<li>
		<code>$effect</code> — Implements the debounce timer, automatically cleaning up on dependency changes
	</li>
	<li>Integrates with <strong>mode-watcher</strong> for the theme toggle quick action</li>
</ul>

<h3>3. Notification Bell</h3>

<p><code>src/lib/components/notification-bell.svelte</code></p>

<p>
	A popover-based notification indicator in the top navigation bar. It shows the unread count as a
	badge and displays the most recent notifications in a dropdown.
</p>

<h4>Features</h4>

<ul>
	<li>
		<strong>Unread count badge</strong> — Displays the count directly. When the count exceeds 9, it shows
		"9+" to keep the badge compact.
	</li>
	<li><strong>Last 5 notifications</strong> — The popover shows up to 5 unread notifications</li>
	<li>
		<strong>Type-specific styling</strong> — Each notification type has its own icon and color:
		<ul>
			<li><strong>Info</strong> — Blue icon</li>
			<li><strong>Warning</strong> — Yellow icon</li>
			<li><strong>Error</strong> — Red icon</li>
			<li><strong>Success</strong> — Green icon</li>
		</ul>
	</li>
	<li>
		<strong>Time-ago display</strong> — Shows relative timestamps: "just now", "Xm ago", "Xh ago", "Xd
		ago"
	</li>
	<li>
		<strong>Footer link</strong> — "View all notifications" links to <code>/notifications</code>
	</li>
</ul>

<h4>Props</h4>

<table>
	<thead>
		<tr><th>Prop</th><th>Type</th><th>Description</th></tr>
	</thead>
	<tbody>
		<tr
			><td><code>count</code></td><td><code>number</code></td><td
				>Total unread notification count</td
			></tr
		>
		<tr
			><td><code>notifications</code></td><td><code>Notification[]</code></td><td
				>Array of recent unread notifications to display in the popover</td
			></tr
		>
	</tbody>
</table>

<h3>4. Theme Toggle</h3>

<p><code>src/lib/components/theme-toggle.svelte</code></p>

<p>
	A button that toggles between light and dark mode. It calls <code>toggleMode()</code> from the
	<strong>mode-watcher</strong> library.
</p>

<h4>Visual behavior</h4>

<p>
	The button displays a sun icon in dark mode and a moon icon in light mode, with smooth CSS
	transitions between states using <code>rotate</code> and <code>scale</code> transforms.
</p>

<h4>Critical Svelte 5 note</h4>

<p>
	The theme toggle uses <code>mode.current</code> to read the current theme — this is a
	<strong>Svelte 5 runes object</strong> from mode-watcher. Do <strong>NOT</strong> use
	<code>$mode</code> (which is the Svelte 4 store syntax). This distinction is critical when working with
	mode-watcher in a Svelte 5 / SvelteKit project.
</p>

<h4>Button style</h4>

<p>
	Rendered as a <strong>ghost</strong> variant button from shadcn-svelte for a minimal, icon-only appearance.
</p>

<h3>5. Animated Counter</h3>

<p><code>src/lib/components/animated-counter.svelte</code></p>

<p>
	Smoothly animates a number from 0 to a target value, commonly used in dashboard stat cards. The
	animation runs on mount and whenever the target value changes.
</p>

<h4>Animation details</h4>

<ul>
	<li><strong>Timing function</strong> — easeOutExpo for a natural deceleration curve</li>
	<li><strong>Default duration</strong> — 800ms</li>
	<li>Uses <code>requestAnimationFrame</code> for smooth 60fps animation</li>
</ul>

<h4>Svelte 5 patterns used</h4>

<p>
	The animation is driven by <code>$effect</code> — whenever the <code>value</code> prop changes, the
	effect re-runs and starts a new animation from 0 to the new target.
</p>

<h4>Props</h4>

<table>
	<thead>
		<tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr>
	</thead>
	<tbody>
		<tr
			><td><code>value</code></td><td><code>number</code></td><td>—</td><td
				>Target number to animate to</td
			></tr
		>
		<tr
			><td><code>duration</code></td><td><code>number</code></td><td><code>800</code></td><td
				>Animation duration in milliseconds</td
			></tr
		>
		<tr
			><td><code>format</code></td><td><code>(n: number) =&gt; string</code></td><td>—</td><td
				>Optional custom format function (e.g., for currency or percentages)</td
			></tr
		>
	</tbody>
</table>

<h3>6. Data Table Pagination</h3>

<p><code>src/lib/components/data-table-pagination.svelte</code></p>

<p>
	A reusable pagination component used across the Users, Content, and Notifications tables. It
	provides page navigation and page-size controls with a consistent UI.
</p>

<h4>Features</h4>

<ul>
	<li>
		<strong>"Showing X-Y of Z" display</strong> — Clear indication of which records are visible
	</li>
	<li>
		<strong>Page size selector</strong> — Dropdown with options for 10, 25, or 50 items per page
	</li>
	<li>
		<strong>Previous/Next navigation</strong> — Buttons with disabled states at boundary pages
	</li>
</ul>

<p>
	This component is a great example of <strong>SvelteKit</strong> reusability — the same component works
	across multiple routes because it accepts standardized pagination data through props.
</p>

<h3>7. Delete Confirm Dialog</h3>

<p><code>src/lib/components/delete-confirm-dialog.svelte</code></p>

<p>
	An alert dialog for confirming destructive actions like deleting a user or removing content. Built
	on the shadcn-svelte Alert Dialog primitive.
</p>

<h4>Implementation details</h4>

<ul>
	<li>
		Uses a <strong>SvelteKit form action</strong> with <code>use:enhance</code> for progressive enhancement
		— the delete works even without JavaScript
	</li>
	<li>Cancel and Confirm buttons with the confirm styled as <code>destructive</code> variant</li>
	<li>The dialog prevents accidental deletions by requiring an explicit confirmation click</li>
</ul>

<h3>8. Role Change Dialog</h3>

<p><code>src/lib/components/role-change-dialog.svelte</code></p>

<p>
	A confirmation dialog shown when an admin changes a user's role. It clearly displays the
	transition being made — for example, "editor" to "admin" — so the admin can verify the change
	before confirming.
</p>

<h3>9. User Form Dialog</h3>

<p><code>src/lib/components/user-form-dialog.svelte</code></p>

<p>
	A modal dialog for creating and editing users. It serves dual purpose — the same component handles
	both "create new user" and "edit existing user" workflows.
</p>

<h4>Form fields</h4>

<ul>
	<li><strong>Name</strong> — Full display name</li>
	<li><strong>Email</strong> — Email address with validation</li>
	<li><strong>Username</strong> — Unique username</li>
	<li><strong>Password</strong> — Required for creation, optional for editing</li>
	<li><strong>Role</strong> — Select dropdown with admin, editor, and viewer options</li>
</ul>

<h4>Error handling</h4>

<p>
	Server-side validation errors are returned from <strong>SvelteKit</strong> form actions and displayed
	inline next to the relevant fields.
</p>

<h3>10. Apps Menu</h3>

<p><code>src/lib/components/apps-menu.svelte</code></p>

<p>
	A quick-access grid menu in the top navigation bar for fast section navigation. It opens as a
	dropdown with icon + label pairs for each major section of the admin dashboard.
</p>

<h2>Svelte 5 Reactive Hooks</h2>

<p>
	SvelteForge Admin includes custom reactive utilities that leverage <strong>Svelte 5's</strong>
	class-based reactivity pattern.
</p>

<h3>IsMobile</h3>

<p><code>src/lib/hooks/is-mobile.svelte.ts</code></p>

<p>
	A reactive hook class that detects whether the viewport is below a mobile breakpoint (768px). It
	extends the <code>MediaQuery</code> class for responsive breakpoint detection.
</p>

<h4>Usage</h4>

<pre><code class="language-svelte"
		>&lt;script lang="ts"&gt;
  import &#123; IsMobile &#125; from "$lib/hooks/is-mobile.svelte";

  const isMobile = new IsMobile();
&lt;/script&gt;

&#123;#if isMobile.current&#125;
  &lt;p&gt;Mobile layout&lt;/p&gt;
&#123;:else&#125;
  &lt;p&gt;Desktop layout&lt;/p&gt;
&#123;/if&#125;</code
	></pre>

<p>
	Because this is a <strong>Svelte 5</strong> runes-based class (note the <code>.svelte.ts</code>
	file extension), the <code>current</code> property is reactive — components re-render automatically
	when the viewport crosses the 768px boundary.
</p>

<h2>The cn() Utility</h2>

<p><code>src/lib/utils.ts</code></p>

<p>
	A utility function that combines <strong>clsx</strong> (conditional class names) with
	<strong>tailwind-merge</strong> (deduplicates and resolves conflicting Tailwind classes). It is used
	throughout the codebase for composing class names:
</p>

<pre><code class="language-ts"
		>import &#123; cn &#125; from "$lib/utils";

// Merge base classes with conditional and override classes
cn("px-4 py-2 bg-primary", isActive && "bg-primary/90", className);
// tailwind-merge ensures no conflicting classes survive</code
	></pre>

<p>
	Import it from <code>$lib/utils</code> — this is the standard pattern across all
	<strong>SvelteKit</strong> components in the project.
</p>

<h2>Need More Components?</h2>

<div
	class="not-prose border-primary/30 bg-primary/5 my-8 rounded-xl border-2 border-dashed p-6 sm:p-8"
>
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
		<div class="flex-1">
			<h3 class="text-foreground text-lg font-bold sm:text-xl">
				50+ Pages with DashboardPack Premium
			</h3>
			<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
				Want Chat, Mail, Kanban boards, Calendar, File Manager, and more? Our premium Svelte-quality
				templates on DashboardPack ship with 50+ pages, advanced CRUD interfaces, and dozens of
				pre-built components — all built to the same standards you see here in SvelteForge Admin.
			</p>
			<ul class="text-muted-foreground mt-3 space-y-1 text-sm">
				<li><strong>Chat</strong> — Real-time messaging UI with conversations and contacts</li>
				<li><strong>Kanban</strong> — Drag-and-drop project boards</li>
				<li><strong>Calendar</strong> — Event management with day/week/month views</li>
				<li><strong>Mail</strong> — Full email client interface with folders and compose</li>
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
		</div>
	</div>
</div>
