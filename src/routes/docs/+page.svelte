<svelte:head>
	<title>Introduction - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="SvelteForge Admin is a production-ready admin dashboard built with SvelteKit 2 and Svelte 5's runes API. Explore the docs to get started."
	/>
</svelte:head>

<h1>Welcome to SvelteForge Admin</h1>

<p>
	SvelteForge Admin is a <strong>production-ready admin dashboard</strong> built entirely with
	<strong>SvelteKit 2</strong> and <strong>Svelte 5's runes API</strong>. It provides everything you
	need to build internal tools, back-office applications, and content management systems — with
	authentication, role-based access control, a CMS, analytics dashboards, and more out of the box.
</p>

<p>
	Unlike admin templates built on React or Vue, SvelteForge leverages the
	<strong>Svelte compiler</strong> to ship dramatically less JavaScript to the browser. No virtual DOM,
	no runtime overhead — just efficient, compiled code that updates the DOM surgically.
</p>

<h2>Why Svelte 5</h2>

<p>
	Svelte 5 introduces <strong>runes</strong> — a new reactivity system that replaces Svelte 4's
	implicit <code>$:</code> syntax with explicit, composable primitives. SvelteForge Admin is built entirely
	on runes from the ground up:
</p>

<ul>
	<li>
		<strong><code>$state</code></strong> — Declare reactive state with fine-grained granularity. No wrapping
		in stores or signals — just assign and go.
	</li>
	<li>
		<strong><code>$props</code></strong> — Type-safe component props with destructuring. No more
		<code>export let</code>.
	</li>
	<li>
		<strong><code>$derived</code></strong> — Computed values that automatically track their dependencies
		and update only when needed.
	</li>
	<li>
		<strong><code>$effect</code></strong> — Side effects that run when their dependencies change, with
		automatic cleanup.
	</li>
</ul>

<p>The Svelte compiler turns these runes into highly optimized vanilla JavaScript at build time:</p>

<ul>
	<li><strong>Smaller bundle sizes</strong> — No framework runtime shipped to the client</li>
	<li><strong>Faster updates</strong> — Direct DOM manipulation instead of virtual DOM diffing</li>
	<li>
		<strong>Better DX</strong> — Less boilerplate than React hooks or Vue's Composition API
	</li>
</ul>

<h3>Example: Reactive state with Svelte 5 runes</h3>

<pre><code class="language-svelte"
		>&lt;script lang="ts"&gt;
  let count = $state(0);
  let doubled = $derived(count * 2);

  $effect(() =&gt; &#123;
    console.log(`Count is now $&#123;count&#125;`);
  &#125;);
&lt;/script&gt;

&lt;button onclick=&#123;() =&gt; count++&#125;&gt;
  &#123;count&#125; (doubled: &#123;doubled&#125;)
&lt;/button&gt;</code
	></pre>

<h2>Why SvelteKit</h2>

<p>
	<strong>SvelteKit</strong> is the official application framework for Svelte, and it powers every aspect
	of SvelteForge Admin:
</p>

<ul>
	<li>
		<strong>Server-side rendering (SSR)</strong> — Pages render on the server for fast initial loads,
		then hydrate on the client for interactivity.
	</li>
	<li>
		<strong>File-based routing</strong> — Routes are defined by the filesystem. SvelteForge uses
		SvelteKit's route groups (<code>(app)</code>, <code>(auth)</code>, <code>(public)</code>) to
		separate protected, authentication, and public pages with different layouts.
	</li>
	<li>
		<strong>Form actions</strong> — Server-side form handling with progressive enhancement via
		<code>use:enhance</code>. Forms work without JavaScript and upgrade seamlessly when JS is
		available.
	</li>
	<li>
		<strong>Progressive enhancement</strong> — The entire app works without client-side JavaScript and
		progressively enhances with it. No loading spinners, no skeleton screens for core functionality.
	</li>
	<li>
		<strong>Server-only modules</strong> — Sensitive code (auth, database, OAuth) lives in
		<code>$lib/server/</code> and is guaranteed never to leak to the client bundle.
	</li>
</ul>

<h2>Key Features</h2>

<p>SvelteForge Admin ships with a comprehensive feature set built on SvelteKit:</p>

<table>
	<thead>
		<tr>
			<th>Feature</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><strong>Authentication</strong></td>
			<td
				>Custom session-based auth with Argon2id password hashing, SHA-256 token hashing, and
				optional Google/GitHub OAuth via Arctic</td
			>
		</tr>
		<tr>
			<td><strong>Role-Based Access Control</strong></td>
			<td>Three roles (admin, editor, viewer) with granular permissions across all routes</td>
		</tr>
		<tr>
			<td><strong>Content Management</strong></td>
			<td>Full CMS with pages, status workflows (draft/published/archived), and rich metadata</td>
		</tr>
		<tr>
			<td><strong>Analytics Dashboard</strong></td>
			<td
				>Interactive charts powered by LayerChart v2 (D3-based) with area, bar, pie, and line charts</td
			>
		</tr>
		<tr>
			<td><strong>User Management</strong></td>
			<td>CRUD operations for users with role assignment, search, filtering, and CSV/JSON export</td
			>
		</tr>
		<tr>
			<td><strong>Notifications</strong></td>
			<td>Real-time notification bell with unread counts and type-based filtering</td>
		</tr>
		<tr>
			<td><strong>Settings</strong></td>
			<td>Application-wide settings with server-side persistence</td>
		</tr>
		<tr>
			<td><strong>Command Palette</strong></td>
			<td>Keyboard-driven search (<code>Ctrl+K</code>) for quick navigation across all pages</td>
		</tr>
		<tr>
			<td><strong>Dark/Light Mode</strong></td>
			<td>System-aware theme switching with persistent preference</td>
		</tr>
		<tr>
			<td><strong>Responsive Design</strong></td>
			<td>Mobile-first layout with collapsible sidebar, built on Tailwind CSS 4</td>
		</tr>
	</tbody>
</table>

<h2>Tech Stack</h2>

<table>
	<thead>
		<tr>
			<th>Technology</th>
			<th>Purpose</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><strong>SvelteKit 2.50 + Svelte 5</strong></td>
			<td>Application framework with runes-based reactivity</td>
		</tr>
		<tr>
			<td><strong>Tailwind CSS 4</strong></td>
			<td
				>Utility-first styling with OKLCH color system and native CSS <code>@theme</code> directive</td
			>
		</tr>
		<tr>
			<td><strong>shadcn-svelte</strong></td>
			<td>Accessible, composable UI components</td>
		</tr>
		<tr>
			<td><strong>Drizzle ORM + SQLite</strong></td>
			<td>Type-safe database access with better-sqlite3 in WAL mode</td>
		</tr>
		<tr>
			<td><strong>Custom Auth (@oslojs/crypto + Argon2)</strong></td>
			<td>Session-based authentication with secure password hashing</td>
		</tr>
		<tr>
			<td><strong>Arctic OAuth</strong></td>
			<td>Google and GitHub social login (environment-driven, optional)</td>
		</tr>
		<tr>
			<td><strong>LayerChart v2</strong></td>
			<td>D3-powered interactive charts for analytics dashboards</td>
		</tr>
		<tr>
			<td><strong>Vitest + Playwright</strong></td>
			<td>Unit and end-to-end testing</td>
		</tr>
		<tr>
			<td><strong>ESLint 9 + Prettier</strong></td>
			<td>Code quality and consistent formatting</td>
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
				SvelteForge Admin gives you a solid foundation. When you need more — 50+ pages, multiple
				dashboard layouts, advanced CRUD interfaces, theme customizers, and production-grade
				components — check out the premium templates at DashboardPack.
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
