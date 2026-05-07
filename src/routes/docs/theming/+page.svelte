<svelte:head>
	<title>Theming &amp; Styling - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="Learn how SvelteForge Admin uses Tailwind CSS 4 with OKLCH colors, native CSS theming, and dark mode — all powered by Svelte 5 and SvelteKit."
	/>
</svelte:head>

<h1>Theming &amp; Styling</h1>

<p>
	SvelteForge Admin uses <strong>Tailwind CSS 4</strong> with a native CSS theming system — there is
	no JavaScript configuration file. All colors are defined using the
	<strong>OKLCH color space</strong>, mapped to semantic design tokens, and consumed by both
	Tailwind utility classes and
	<strong>shadcn-svelte</strong> components. Dark mode is handled by
	<strong>mode-watcher</strong> and integrates seamlessly with <strong>Svelte 5's</strong> runes API.
</p>

<h2>Tailwind CSS 4 Setup</h2>

<p>
	Tailwind CSS 4 is a ground-up rewrite that moves configuration into native CSS. SvelteForge
	Admin's setup lives entirely in <code>src/app.css</code>:
</p>

<pre><code class="language-css"
		>@import "tailwindcss";
@import "tw-animate-css";

@source "../node_modules/layerchart";
@source "../node_modules/svelte-ux";

@custom-variant dark (&:is(.dark *));</code
	></pre>

<h4>What each line does</h4>

<ul>
	<li><code>@import "tailwindcss"</code> — Loads the Tailwind CSS 4 framework</li>
	<li>
		<code>@import "tw-animate-css"</code> — Adds animation utilities (fade, slide, zoom, etc.)
	</li>
	<li>
		<code>@source</code> directives — Tell Tailwind to scan LayerChart and svelte-ux packages for class
		names so they are included in the generated CSS
	</li>
	<li>
		<code>@custom-variant dark</code> — Defines the dark mode variant as class-based (<code
			>.dark</code
		>
		on an ancestor element) rather than the <code>prefers-color-scheme</code> media query
	</li>
</ul>

<h4>Vite plugin</h4>

<p>
	On the build side, SvelteForge uses <code>@tailwindcss/vite</code> as a Vite plugin. This replaces
	the PostCSS-based setup from Tailwind v3 and provides faster compilation integrated directly into
	the <strong>SvelteKit</strong> dev server.
</p>

<h2>OKLCH Color System</h2>

<p>
	All colors in SvelteForge Admin are defined in the <strong>OKLCH</strong> color space rather than the
	traditional HSL. OKLCH stands for:
</p>

<ul>
	<li><strong>L</strong> — Lightness (0 = black, 1 = white)</li>
	<li><strong>C</strong> — Chroma (0 = gray, higher = more saturated)</li>
	<li><strong>H</strong> — Hue angle (0-360, like a color wheel)</li>
</ul>

<h4>Why OKLCH over HSL?</h4>

<p>
	OKLCH is <strong>perceptually uniform</strong> — two colors with the same lightness value actually
	<em>look</em> equally bright to the human eye. In HSL, a yellow at 50% lightness looks far brighter
	than a blue at 50% lightness. OKLCH corrects this, making it much easier to create harmonious color
	palettes and maintain consistent contrast ratios across your entire theme.
</p>

<p>
	It also makes customization intuitive: to make a color lighter, increase L. To make it more
	vibrant, increase C. To shift the hue, change H. Each axis is independent.
</p>

<h2>Color Tokens</h2>

<p>
	Colors are defined as CSS custom properties in <code>:root</code> (light mode) and
	<code>.dark</code> (dark mode). Every component in the system references these tokens, so changing a
	single variable updates the entire UI.
</p>

<h3>Light mode (:root)</h3>

<table>
	<thead>
		<tr><th>Token</th><th>OKLCH Value</th><th>Usage</th></tr>
	</thead>
	<tbody>
		<tr
			><td><code>--background</code></td><td><code>oklch(1 0 0)</code></td><td
				>Page background (pure white)</td
			></tr
		>
		<tr
			><td><code>--foreground</code></td><td><code>oklch(0.141 0.005 285.823)</code></td><td
				>Primary text color (near black)</td
			></tr
		>
		<tr><td><code>--card</code></td><td><code>oklch(1 0 0)</code></td><td>Card backgrounds</td></tr>
		<tr
			><td><code>--card-foreground</code></td><td><code>oklch(0.141 0.005 285.823)</code></td><td
				>Card text</td
			></tr
		>
		<tr
			><td><code>--popover</code></td><td><code>oklch(1 0 0)</code></td><td
				>Popover/dropdown backgrounds</td
			></tr
		>
		<tr
			><td><code>--popover-foreground</code></td><td><code>oklch(0.141 0.005 285.823)</code></td><td
				>Popover text</td
			></tr
		>
		<tr
			><td><code>--primary</code></td><td><code>oklch(0.21 0.006 285.885)</code></td><td
				>Primary actions, active states</td
			></tr
		>
		<tr
			><td><code>--primary-foreground</code></td><td><code>oklch(0.985 0 0)</code></td><td
				>Text on primary backgrounds</td
			></tr
		>
		<tr
			><td><code>--secondary</code></td><td><code>oklch(0.967 0.001 286.375)</code></td><td
				>Secondary actions, subtle backgrounds</td
			></tr
		>
		<tr
			><td><code>--secondary-foreground</code></td><td><code>oklch(0.21 0.006 285.885)</code></td
			><td>Text on secondary backgrounds</td></tr
		>
		<tr
			><td><code>--muted</code></td><td><code>oklch(0.967 0.001 286.375)</code></td><td
				>Muted backgrounds, disabled states</td
			></tr
		>
		<tr
			><td><code>--muted-foreground</code></td><td><code>oklch(0.552 0.016 285.938)</code></td><td
				>Secondary text, placeholders</td
			></tr
		>
		<tr
			><td><code>--accent</code></td><td><code>oklch(0.967 0.001 286.375)</code></td><td
				>Hover/focus highlights</td
			></tr
		>
		<tr
			><td><code>--accent-foreground</code></td><td><code>oklch(0.21 0.006 285.885)</code></td><td
				>Text on accent backgrounds</td
			></tr
		>
		<tr
			><td><code>--destructive</code></td><td><code>oklch(0.577 0.245 27.325)</code></td><td
				>Delete buttons, error states</td
			></tr
		>
		<tr
			><td><code>--destructive-foreground</code></td><td><code>oklch(0.985 0 0)</code></td><td
				>Text on destructive backgrounds</td
			></tr
		>
		<tr
			><td><code>--border</code></td><td><code>oklch(0.92 0.004 286.32)</code></td><td
				>All borders globally</td
			></tr
		>
		<tr
			><td><code>--input</code></td><td><code>oklch(0.92 0.004 286.32)</code></td><td
				>Form input borders</td
			></tr
		>
		<tr
			><td><code>--ring</code></td><td><code>oklch(0.705 0.015 286.067)</code></td><td
				>Focus ring color</td
			></tr
		>
	</tbody>
</table>

<h3>Chart colors</h3>

<table>
	<thead>
		<tr><th>Token</th><th>Light</th><th>Dark</th></tr>
	</thead>
	<tbody>
		<tr
			><td><code>--chart-1</code></td><td><code>oklch(0.585 0.233 277.117)</code></td><td
				><code>oklch(0.673 0.245 277.117)</code></td
			></tr
		>
		<tr
			><td><code>--chart-2</code></td><td><code>oklch(0.685 0.169 237.323)</code></td><td
				><code>oklch(0.746 0.160 237.323)</code></td
			></tr
		>
		<tr
			><td><code>--chart-3</code></td><td><code>oklch(0.606 0.250 292.717)</code></td><td
				><code>oklch(0.700 0.242 292.717)</code></td
			></tr
		>
		<tr
			><td><code>--chart-4</code></td><td><code>oklch(0.704 0.140 181.071)</code></td><td
				><code>oklch(0.765 0.132 181.071)</code></td
			></tr
		>
		<tr
			><td><code>--chart-5</code></td><td><code>oklch(0.696 0.170 162.480)</code></td><td
				><code>oklch(0.765 0.160 162.480)</code></td
			></tr
		>
	</tbody>
</table>

<p>
	Notice how the dark mode chart colors have <strong>higher lightness values</strong> — this ensures the
	charts remain legible against the dark background.
</p>

<h3>Sidebar colors</h3>

<table>
	<thead>
		<tr><th>Token</th><th>Light</th><th>Dark</th></tr>
	</thead>
	<tbody>
		<tr
			><td><code>--sidebar</code></td><td><code>oklch(0.985 0 0)</code></td><td
				><code>oklch(0.21 0.006 285.885)</code></td
			></tr
		>
		<tr
			><td><code>--sidebar-foreground</code></td><td><code>oklch(0.141 0.005 285.823)</code></td><td
				><code>oklch(0.985 0 0)</code></td
			></tr
		>
		<tr
			><td><code>--sidebar-primary</code></td><td><code>oklch(0.21 0.006 285.885)</code></td><td
				><code>oklch(0.488 0.243 264.376)</code></td
			></tr
		>
		<tr
			><td><code>--sidebar-primary-foreground</code></td><td><code>oklch(0.985 0 0)</code></td><td
				><code>oklch(0.985 0 0)</code></td
			></tr
		>
		<tr
			><td><code>--sidebar-accent</code></td><td><code>oklch(0.967 0.001 286.375)</code></td><td
				><code>oklch(0.274 0.006 286.033)</code></td
			></tr
		>
		<tr
			><td><code>--sidebar-accent-foreground</code></td><td
				><code>oklch(0.21 0.006 285.885)</code></td
			><td><code>oklch(0.985 0 0)</code></td></tr
		>
		<tr
			><td><code>--sidebar-border</code></td><td><code>oklch(0.92 0.004 286.32)</code></td><td
				><code>oklch(1 0 0 / 10%)</code></td
			></tr
		>
		<tr
			><td><code>--sidebar-ring</code></td><td><code>oklch(0.705 0.015 286.067)</code></td><td
				><code>oklch(0.552 0.016 285.938)</code></td
			></tr
		>
	</tbody>
</table>

<p>
	The sidebar has its own color tokens so it can have a slightly different background or accent
	color from the main content area — useful for visually distinguishing navigation from content.
</p>

<h2>The @theme inline Block</h2>

<p>
	Tailwind CSS 4 uses a <code>@theme</code> directive to map CSS custom properties to Tailwind
	utility classes. SvelteForge Admin defines this in <code>src/app.css</code>:
</p>

<pre><code class="language-css"
		>@theme inline &#123;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* ... all other semantic tokens ... */
&#125;</code
	></pre>

<h4>How it works</h4>

<p>
	The <code>@theme inline</code> block tells Tailwind to use these CSS variables as its color and
	spacing values. The <code>--color-</code> prefix is stripped when generating utility classes, so
	<code>--color-primary</code> becomes <code>bg-primary</code>, <code>text-primary</code>,
	<code>border-primary</code>, etc.
</p>

<h4>Radius system</h4>

<p>
	A single <code>--radius</code> variable (0.625rem) drives all border radius values through calculated
	variants:
</p>

<ul>
	<li>
		<code>--radius-sm</code> — <code>calc(var(--radius) - 4px)</code> — Small elements like badges
	</li>
	<li><code>--radius-md</code> — <code>calc(var(--radius) - 2px)</code> — Inputs, buttons</li>
	<li><code>--radius-lg</code> — <code>var(--radius)</code> — Cards, dialogs</li>
	<li><code>--radius-xl</code> — <code>calc(var(--radius) + 4px)</code> — Large containers</li>
</ul>

<p>
	Change <code>--radius</code> once and every component in the system updates proportionally.
</p>

<h2>Dark Mode Implementation</h2>

<p>
	SvelteForge Admin uses class-based dark mode powered by the <strong>mode-watcher</strong> library.
	Here is how all the pieces fit together in the <strong>SvelteKit</strong> application:
</p>

<h3>How it works</h3>

<ol>
	<li>
		<strong>mode-watcher</strong> manages the theme state and persists the user's preference to
		<code>localStorage</code>
	</li>
	<li>It adds or removes the <code>.dark</code> class on the <code>&lt;html&gt;</code> element</li>
	<li>
		Tailwind's <code>@custom-variant dark (&:is(.dark *))</code> directive makes all
		<code>dark:</code> utilities activate when any ancestor has the <code>.dark</code> class
	</li>
	<li>
		The CSS custom properties in the <code>.dark</code> selector override the <code>:root</code>
		values, so every semantic color token flips automatically
	</li>
</ol>

<h3>System preference detection</h3>

<p>
	On first visit, mode-watcher checks the user's operating system preference via
	<code>prefers-color-scheme</code>. If the user has their OS set to dark mode, the app starts in
	dark mode. Once the user explicitly toggles the theme, their choice is saved and takes precedence
	over the system setting.
</p>

<h3>Svelte 5 integration</h3>

<p>
	In <strong>Svelte 5</strong>, mode-watcher exposes a <strong>runes object</strong> rather than a Svelte
	store. This is a critical distinction:
</p>

<pre><code class="language-svelte"
		>&lt;script lang="ts"&gt;
  import &#123; mode, toggleMode &#125; from "mode-watcher";

  // CORRECT — Svelte 5 runes object
  let isDark = $derived(mode.current === "dark");

  // WRONG — This is Svelte 4 store syntax, do NOT use
  // let isDark = $mode === "dark";
&lt;/script&gt;

&lt;button onclick=&#123;toggleMode&#125;&gt;
  &#123;isDark ? "Switch to light" : "Switch to dark"&#125;
&lt;/button&gt;</code
	></pre>

<p>
	Use <code>mode.current</code> to read the theme and <code>toggleMode()</code> to switch it. This pattern
	is used in the Theme Toggle component and the Command Palette's quick actions.
</p>

<h2>Customizing Colors</h2>

<p>
	To customize the color scheme, edit the CSS custom properties in <code>src/app.css</code>. Because
	all colors use OKLCH, you can adjust each axis independently:
</p>

<h4>Example: changing the primary color to blue</h4>

<pre><code class="language-css"
		>:root &#123;
  /* Original (dark gray) */
  /* --primary: oklch(0.21 0.006 285.885); */

  /* Custom blue primary */
  --primary: oklch(0.45 0.2 260);
  --primary-foreground: oklch(0.985 0 0);
&#125;

.dark &#123;
  /* Lighter blue for dark mode */
  --primary: oklch(0.65 0.2 260);
  --primary-foreground: oklch(0.15 0.005 260);
&#125;</code
	></pre>

<p>
	Every button, link, active state, sidebar highlight, and badge that uses <code>bg-primary</code>
	or <code>text-primary</code> will immediately reflect the change — no component edits required.
</p>

<h4>OKLCH tips for customization</h4>

<ul>
	<li>
		Keep <strong>L</strong> (lightness) between 0.3-0.5 for primary colors in light mode, and 0.6-0.8
		for dark mode
	</li>
	<li>
		Keep <strong>C</strong> (chroma) moderate (0.1-0.2) for professional palettes, higher (0.2+) for vibrant
		ones
	</li>
	<li>
		The <strong>H</strong> (hue) axis maps to: 0=red, 60=yellow, 120=green, 180=cyan, 240=blue, 300=purple
	</li>
</ul>

<h2>shadcn-svelte Theming</h2>

<p>
	All shadcn-svelte components use the semantic color tokens defined above. They reference classes
	like <code>bg-primary</code>, <code>text-muted-foreground</code>, <code>border-border</code>, and
	<code>bg-card</code> — so they adapt to your theme automatically.
</p>

<p>When you add a new shadcn-svelte component:</p>

<pre><code>npx shadcn-svelte@latest add &lt;component-name&gt;</code></pre>

<p>
	It will use the same tokens and immediately match your custom color scheme. No per-component theme
	configuration is needed.
</p>

<h2>Typography</h2>

<p>
	SvelteForge Admin uses the <strong>system font stack</strong> via Tailwind's default
	<code>font-sans</code> — this means the app uses the native font on each platform (SF Pro on macOS,
	Segoe UI on Windows, Roboto on Android) for the fastest possible text rendering with no web font downloads.
</p>

<p>
	Documentation pages (like this one) use <strong>Tailwind Typography</strong> (<code>prose</code>)
	classes applied in the docs layout for readable long-form content with proper heading hierarchy,
	paragraph spacing, code block styling, and table formatting.
</p>

<h2>Responsive Design</h2>

<p>
	SvelteForge Admin follows a <strong>mobile-first</strong> approach. Base styles target small screens,
	and responsive breakpoints add complexity for larger viewports.
</p>

<h4>Collapsible sidebar</h4>

<p>
	The main navigation sidebar uses the <code>IsMobile</code> hook (a <strong>Svelte 5</strong>
	runes-based class at <code>src/lib/hooks/is-mobile.svelte.ts</code>) to detect the 768px
	breakpoint. On mobile viewports, the sidebar collapses into a slide-out overlay with a hamburger
	toggle. On desktop, it remains visible as a fixed sidebar.
</p>

<h4>Grid layouts</h4>

<p>
	Dashboard cards and analytics grids use Tailwind's responsive grid utilities to stack vertically
	on mobile and expand to multi-column layouts on larger screens:
</p>

<pre><code class="language-html"
		>&lt;div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"&gt;
  &lt;!-- Stat cards stack on mobile, 2-up on tablet, 4-up on desktop --&gt;
&lt;/div&gt;</code
	></pre>

<h2>Base Layer Styles</h2>

<p>
	SvelteForge Admin applies two global base styles via Tailwind's <code>@layer base</code>
	directive:
</p>

<pre><code class="language-css"
		>@layer base &#123;
  * &#123;
    @apply border-border;
  &#125;
  body &#123;
    @apply bg-background text-foreground;
  &#125;
&#125;</code
	></pre>

<ul>
	<li>
		<strong>Global border color</strong> — Every element's border defaults to the
		<code>--border</code> token. This means you can add <code>border</code> to any element and it picks
		up the theme-appropriate border color automatically.
	</li>
	<li>
		<strong>Body defaults</strong> — The page background and text color are set from the semantic tokens,
		ensuring the entire app responds to theme changes from a single source of truth.
	</li>
</ul>

<h2>Want Advanced Theming?</h2>

<div
	class="not-prose border-primary/30 bg-primary/5 my-8 rounded-xl border-2 border-dashed p-6 sm:p-8"
>
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
		<div class="flex-1">
			<h3 class="text-foreground text-lg font-bold sm:text-xl">
				Live Theme Customizer on DashboardPack
			</h3>
			<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
				Want a live theme customizer with 6 color presets, 3 density levels, and RTL support? Our
				premium templates include it built-in — users can switch themes, adjust spacing, and toggle
				layout direction in real time without touching CSS.
			</p>
			<ul class="text-muted-foreground mt-3 space-y-1 text-sm">
				<li><strong>6 color presets</strong> — Switch entire palettes with one click</li>
				<li><strong>3 density levels</strong> — Compact, default, and comfortable spacing</li>
				<li><strong>RTL support</strong> — Full right-to-left layout mirroring</li>
				<li><strong>Persistent preferences</strong> — Saved per-user, not just per-session</li>
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
