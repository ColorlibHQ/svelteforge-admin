<svelte:head>
	<title>Analytics & Charts - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="Data visualization with LayerChart v2 in SvelteForge Admin — a Svelte 5 + SvelteKit dashboard with D3-based reactive charts."
	/>
</svelte:head>

<h1>Analytics & Charts</h1>

<p>
	SvelteForge Admin uses <strong>LayerChart v2</strong> for all data visualization. LayerChart is a
	D3-based charting library <strong>purpose-built for Svelte</strong> — it is fully reactive,
	composable, and SSR-compatible out of the box. Combined with <strong>Svelte 5</strong> runes and
	<strong>SvelteKit</strong> server-side data loading, the analytics system delivers fast, interactive
	charts with zero client-side data fetching.
</p>

<h2>Why LayerChart for Svelte</h2>

<p>
	Unlike wrapper libraries that port React charting solutions, LayerChart was designed from the
	ground up for the Svelte ecosystem:
</p>

<ul>
	<li>
		<strong>Built specifically for Svelte</strong> — not a React port or framework-agnostic wrapper
	</li>
	<li>
		<strong>D3-based calculations with Svelte rendering</strong> — uses D3 for scales, shapes, and math
		while Svelte handles the DOM
	</li>
	<li>
		<strong>Composable chart components</strong> — Area, Bar, Pie, Line, and more can be combined freely
	</li>
	<li>
		<strong>Fully reactive with Svelte 5 runes</strong> — chart data updates automatically when
		<code>$state</code> or <code>$derived</code> values change
	</li>
	<li>
		<strong>SSR compatibility</strong> — works with SvelteKit's server-side rendering via a simple Vite
		configuration
	</li>
</ul>

<h2>Vite Configuration</h2>

<p>
	LayerChart and its companion library <code>svelte-ux</code> must be listed in the
	<code>ssr.noExternal</code> array in your Vite config. Without this, SvelteKit's SSR will fail to process
	these packages:
</p>

<pre><code class="language-typescript"
		>// vite.config.ts
import &#123; sveltekit &#125; from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import &#123; defineConfig &#125; from 'vitest/config';

export default defineConfig(&#123;
  plugins: [tailwindcss(), sveltekit()],
  ssr: &#123;
    noExternal: ['layerchart', 'svelte-ux']
  &#125;,
  test: &#123;
    include: ['src/**/*.test.ts'],
  &#125;
&#125;);</code
	></pre>

<p>
	Additionally, <code>src/app.css</code> includes <code>@source</code> directives so Tailwind CSS v4 scans
	LayerChart and svelte-ux for utility classes:
</p>

<pre><code class="language-css"
		>@source "../node_modules/layerchart";
@source "../node_modules/svelte-ux";</code
	></pre>

<h2>Dashboard Charts</h2>

<p>
	The main dashboard at <code>/dashboard</code> includes KPI cards with animated counters and
	summary charts. The analytics page at <code>/analytics</code> provides deeper data exploration. Here
	is what each chart visualizes:
</p>

<table>
	<thead>
		<tr>
			<th>Chart Type</th>
			<th>Component</th>
			<th>Data</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Area chart</td>
			<td><code>AreaChart</code></td>
			<td>User registrations over time (monthly)</td>
		</tr>
		<tr>
			<td>Line chart</td>
			<td><code>LineChart</code></td>
			<td>Content creation trends (pages per month)</td>
		</tr>
		<tr>
			<td>Donut chart</td>
			<td><code>PieChart</code></td>
			<td>Page status distribution (published / draft / archived)</td>
		</tr>
		<tr>
			<td>Bar chart</td>
			<td><code>BarChart</code></td>
			<td>Top authors by page count</td>
		</tr>
	</tbody>
</table>

<h2>Analytics Page</h2>

<p>
	The <code>/analytics</code> route provides a grid-based layout with four chart panels. All data is
	loaded server-side via <code>+page.server.ts</code> and passed to the Svelte 5 component through
	<code>$props()</code>.
</p>

<h3>Chart Layout</h3>

<p>Charts are arranged in a responsive grid using shadcn-svelte Card components:</p>

<ul>
	<li>
		<strong>Top row (7-column grid):</strong> User Signups area chart (4 cols) + Content Creation line
		chart (3 cols)
	</li>
	<li>
		<strong>Bottom row (7-column grid):</strong> Pages by Status donut chart (3 cols) + Top Authors bar
		chart (4 cols)
	</li>
</ul>

<h2>Chart Implementation Patterns</h2>

<h3>PieChart (Donut) — Critical Pattern</h3>

<p>
	LayerChart's <code>PieChart</code> uses <strong>direct props</strong> — not a config object. This is
	the most common mistake when working with LayerChart:
</p>

<pre><code class="language-svelte"
		>&lt;!-- CORRECT: Direct props --&gt;
&lt;PieChart
  data=&#123;statusData&#125;
  value="value"
  c="key"
  cRange=&#123;statusColors&#125;
  innerRadius=&#123;0.6&#125;
  legend
&gt;
  &#123;#snippet tooltip()&#125;
    &lt;Chart.Tooltip nameKey="label" /&gt;
  &#123;/snippet&#125;
&lt;/PieChart&gt;

&lt;!-- WRONG: Config objects do NOT work --&gt;
&lt;PieChart
  data=&#123;statusData&#125;
  props=&#123;&#123; donut: &#123; innerRadius: 0.6 &#125;, legend: &#123; show: true &#125; &#125;&#125;
/&gt;</code
	></pre>

<h3>AreaChart / LineChart with Time Scales</h3>

<pre><code class="language-svelte"
		>&lt;script lang="ts"&gt;
  import &#123; AreaChart &#125; from "layerchart";
  import &#123; scaleUtc &#125; from "d3-scale";

  let &#123; data &#125; = $props();

  const signupData = $derived(
    data.signupsPerMonth.map((d) =&gt; (&#123;
      date: new Date(d.month),
      signups: d.count,
    &#125;))
  );
&lt;/script&gt;

&lt;AreaChart
  data=&#123;signupData&#125;
  x="date"
  xScale=&#123;scaleUtc()&#125;
  series=&#123;[&#123;
    key: "signups",
    label: "User Signups",
    color: "var(--chart-1)",
  &#125;]&#125;
  props=&#123;&#123;
    xAxis: &#123;
      format: (d: Date) =&gt;
        d.toLocaleDateString("en-US", &#123; month: "short" &#125;),
    &#125;,
  &#125;&#125;
&gt;
  &#123;#snippet tooltip()&#125;
    &lt;Chart.Tooltip /&gt;
  &#123;/snippet&#125;
&lt;/AreaChart&gt;</code
	></pre>

<h3>BarChart with Band Scale</h3>

<pre><code class="language-svelte"
		>&lt;script lang="ts"&gt;
  import &#123; BarChart &#125; from "layerchart";
  import &#123; scaleBand &#125; from "d3-scale";
&lt;/script&gt;

&lt;BarChart
  data=&#123;data.topAuthors&#125;
  x="name"
  xScale=&#123;scaleBand().padding(0.3)&#125;
  series=&#123;[&#123;
    key: "pageCount",
    label: "Pages",
    color: "var(--chart-5)",
  &#125;]&#125;
&gt;
  &#123;#snippet tooltip()&#125;
    &lt;Chart.Tooltip /&gt;
  &#123;/snippet&#125;
&lt;/BarChart&gt;</code
	></pre>

<h3>Chart Configuration Objects</h3>

<p>
	SvelteForge uses <code>Chart.ChartConfig</code> from shadcn-svelte to define labels and colors for each
	data series:
</p>

<pre><code class="language-typescript"
		>const statusConfig = &#123;
  published: &#123; label: "Published", color: "var(--chart-1)" &#125;,
  draft: &#123; label: "Draft", color: "var(--chart-2)" &#125;,
  archived: &#123; label: "Archived", color: "var(--chart-4)" &#125;,
&#125; satisfies Chart.ChartConfig;</code
	></pre>

<h3>Color Tokens</h3>

<p>
	Chart colors are defined as CSS custom properties in <code>src/app.css</code> using the OKLCH color
	space. Both light and dark mode variants are provided:
</p>

<table>
	<thead>
		<tr>
			<th>Token</th>
			<th>Usage</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>--chart-1</code></td>
			<td>Primary series (signups, published content)</td>
		</tr>
		<tr>
			<td><code>--chart-2</code></td>
			<td>Secondary series (drafts)</td>
		</tr>
		<tr>
			<td><code>--chart-3</code></td>
			<td>Tertiary series (content creation)</td>
		</tr>
		<tr>
			<td><code>--chart-4</code></td>
			<td>Quaternary series (archived content)</td>
		</tr>
		<tr>
			<td><code>--chart-5</code></td>
			<td>Quinary series (top authors)</td>
		</tr>
	</tbody>
</table>

<h3>Dark Mode Re-rendering</h3>

<p>
	LayerChart charts must re-render when the color mode changes so they pick up the updated CSS
	custom properties. SvelteForge wraps each chart in a <code>&#123;#key mode.current&#125;</code>
	block using <code>mode-watcher</code>:
</p>

<pre><code class="language-svelte"
		>&lt;script lang="ts"&gt;
  import &#123; mode &#125; from "mode-watcher";
&lt;/script&gt;

&#123;#key mode.current&#125;
  &lt;Chart.Container config=&#123;signupConfig&#125; class="h-[300px] w-full"&gt;
    &lt;AreaChart ... /&gt;
  &lt;/Chart.Container&gt;
&#123;/key&#125;</code
	></pre>

<p>
	<strong>Important:</strong> With Svelte 5 and mode-watcher, use <code>mode.current</code> (a runes
	object) — not <code>$mode</code> (the legacy store syntax).
</p>

<h2>Server-Side Data Loading</h2>

<p>
	All chart data is aggregated on the server in <code>+page.server.ts</code> using Drizzle ORM queries
	against the SQLite database. This ensures charts render with data on first paint — no loading spinners,
	no client-side fetch waterfalls.
</p>

<pre><code class="language-typescript"
		>// src/routes/(app)/analytics/+page.server.ts
import &#123; db &#125; from "$lib/server/db/index.js";
import &#123; users, pages, notifications &#125; from "$lib/server/db/schema.js";
import &#123; sql, eq &#125; from "drizzle-orm";

export const load: PageServerLoad = async () =&gt; &#123;
  // User signups per month
  const signupsPerMonth = await db
    .select(&#123;
      month: sql&lt;string&gt;`strftime('%Y-%m-01', created_at, 'unixepoch')`,
      count: sql&lt;number&gt;`count(*)`,
    &#125;)
    .from(users)
    .groupBy(sql`strftime('%Y-%m', created_at, 'unixepoch')`)
    .orderBy(sql`strftime('%Y-%m', created_at, 'unixepoch')`);

  // Pages by status (for pie/donut chart)
  const pagesByStatus = await db
    .select(&#123;
      status: pages.status,
      count: sql&lt;number&gt;`count(*)`,
    &#125;)
    .from(pages)
    .groupBy(pages.status);

  // Top authors by page count (for bar chart)
  const topAuthors = await db
    .select(&#123;
      name: users.name,
      pageCount: sql&lt;number&gt;`count($&#123;pages.id&#125;)`,
    &#125;)
    .from(pages)
    .innerJoin(users, eq(pages.authorId, users.id))
    .groupBy(users.id)
    .orderBy(sql`count($&#123;pages.id&#125;) desc`)
    .limit(5);

  return &#123; signupsPerMonth, pagesByStatus, topAuthors &#125;;
&#125;;</code
	></pre>

<h2>Animated Counters</h2>

<p>
	KPI cards on the dashboard use the <code>AnimatedCounter</code> component located at
	<code>$lib/components/animated-counter.svelte</code>. It animates from zero to the target value
	using <strong>easeOutExpo</strong> easing for a satisfying deceleration effect.
</p>

<pre><code class="language-svelte"
		>&lt;script lang="ts"&gt;
  import AnimatedCounter from "$lib/components/animated-counter.svelte";
&lt;/script&gt;

&lt;!-- Basic usage --&gt;
&lt;AnimatedCounter value=&#123;1234&#125; /&gt;

&lt;!-- Custom duration and formatting --&gt;
&lt;AnimatedCounter
  value=&#123;98.5&#125;
  duration=&#123;1200&#125;
  formatFn=&#123;(n) =&gt; n.toLocaleString("en-US") + "%"&#125;
/&gt;</code
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
			<td><code>value</code></td>
			<td><code>number</code></td>
			<td>required</td>
			<td>Target number to animate to</td>
		</tr>
		<tr>
			<td><code>duration</code></td>
			<td><code>number</code></td>
			<td><code>800</code></td>
			<td>Animation duration in milliseconds</td>
		</tr>
		<tr>
			<td><code>formatFn</code></td>
			<td><code>(n: number) =&gt; string</code></td>
			<td><code>n.toLocaleString()</code></td>
			<td>Custom formatting function for the displayed value</td>
		</tr>
	</tbody>
</table>

<p>
	The component uses <code>$effect</code> (Svelte 5) to trigger the animation whenever
	<code>value</code> changes, and cleans up with <code>cancelAnimationFrame</code> on teardown.
</p>

<h2>Extending Analytics</h2>

<h3>Adding a New Chart</h3>

<ol>
	<li>
		<strong>Add the server query</strong> in <code>+page.server.ts</code> — use Drizzle ORM with
		<code>sql</code> template literals for aggregations
	</li>
	<li>
		<strong>Import the chart component</strong> from <code>layerchart</code> (e.g.,
		<code>BarChart</code>, <code>AreaChart</code>, <code>PieChart</code>)
	</li>
	<li>
		<strong>Transform the data</strong> using <code>$derived</code> to map server data into the shape
		LayerChart expects
	</li>
	<li>
		<strong>Define a ChartConfig</strong> with labels and <code>var(--chart-N)</code> color tokens
	</li>
	<li>
		<strong>Wrap in <code>Chart.Container</code></strong> and include a
		<code>&#123;#snippet tooltip()&#125;</code> block for hover interactions
	</li>
</ol>

<h3>Using D3 Utilities</h3>

<p>LayerChart works with standard D3 modules. The most commonly used in SvelteForge:</p>

<ul>
	<li>
		<code>d3-scale</code> — <code>scaleUtc()</code> for time axes, <code>scaleBand()</code> for categorical
		axes
	</li>
	<li>
		<code>d3-array</code> — <code>extent()</code>, <code>max()</code>, <code>sum()</code> for data calculations
	</li>
	<li><code>d3-shape</code> — arc generators, curve interpolations for custom chart shapes</li>
</ul>

<pre><code class="language-bash"
		>pnpm add d3-scale d3-array d3-shape
pnpm add -D @types/d3-scale @types/d3-array @types/d3-shape</code
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
			<td><code>src/routes/(app)/analytics/+page.svelte</code></td>
			<td>Analytics page with all chart components</td>
		</tr>
		<tr>
			<td><code>src/routes/(app)/analytics/+page.server.ts</code></td>
			<td>Server-side data aggregation queries</td>
		</tr>
		<tr>
			<td><code>src/lib/components/animated-counter.svelte</code></td>
			<td>Animated number counter for KPI cards</td>
		</tr>
		<tr>
			<td><code>src/lib/components/ui/chart/</code></td>
			<td>shadcn-svelte chart wrapper (Container, Tooltip, ChartConfig)</td>
		</tr>
		<tr>
			<td><code>src/app.css</code></td>
			<td>Chart color tokens (--chart-1 through --chart-5)</td>
		</tr>
		<tr>
			<td><code>vite.config.ts</code></td>
			<td>SSR noExternal config for layerchart + svelte-ux</td>
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
				Advanced Analytics with DashboardPack
			</h3>
			<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
				Need 10+ chart types, real-time data streaming, and advanced analytics dashboards? Our
				premium templates ship with Recharts 3 integration, 5 dashboard layout variants, date range
				pickers, exportable reports, and drill-down data tables — all production-ready.
			</p>
			<ul class="text-muted-foreground mt-3 space-y-1 text-sm">
				<li>Recharts 3 with 10+ chart types (Radar, Treemap, Funnel, Sankey, and more)</li>
				<li>Real-time data with WebSocket-powered live updates</li>
				<li>5 dashboard variants: Analytics, E-commerce, CRM, SaaS, and Project Management</li>
				<li>Date range filtering, CSV/PDF export, and scheduled reports</li>
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
