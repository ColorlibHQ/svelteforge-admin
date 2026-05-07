<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Chart from "$lib/components/ui/chart/index.js";
	import { AreaChart, LineChart, PieChart, BarChart } from "layerchart";
	import { scaleUtc, scaleBand } from "d3-scale";
	import { mode } from "mode-watcher";

	let { data } = $props();

	const signupConfig = {
		signups: { label: "User Signups", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;

	const contentConfig = {
		pages: { label: "Pages Created", color: "var(--chart-3)" },
	} satisfies Chart.ChartConfig;

	const statusConfig = {
		published: { label: "Published", color: "var(--chart-1)" },
		draft: { label: "Draft", color: "var(--chart-2)" },
		archived: { label: "Archived", color: "var(--chart-4)" },
	} satisfies Chart.ChartConfig;

	const authorsConfig = {
		pageCount: { label: "Pages", color: "var(--chart-5)" },
	} satisfies Chart.ChartConfig;

	const signupData = $derived(
		data.signupsPerMonth.map((d) => ({
			date: new Date(d.month),
			signups: d.count,
		}))
	);

	const contentData = $derived(
		data.pagesPerMonth.map((d) => ({
			date: new Date(d.month),
			pages: d.count,
		}))
	);

	const statusData = $derived(
		data.pagesByStatus.map((d) => ({
			key: d.status,
			label: d.status.charAt(0).toUpperCase() + d.status.slice(1),
			value: d.count,
		}))
	);

	const statusColors = $derived(
		data.pagesByStatus.map((d) => {
			switch (d.status) {
				case "published":
					return statusConfig.published.color;
				case "draft":
					return statusConfig.draft.color;
				default:
					return statusConfig.archived.color;
			}
		})
	);
</script>

<svelte:head>
	<title>Analytics - SvelteForge Admin</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Analytics</h1>
		<p class="text-muted-foreground">Monitor your platform metrics and performance.</p>
	</div>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
		<Card.Root class="col-span-4">
			<Card.Header>
				<Card.Title>User Signups Over Time</Card.Title>
				<Card.Description>New registrations by month</Card.Description>
			</Card.Header>
			<Card.Content>
				{#key mode.current}
					{#if signupData.length > 0}
						<Chart.Container config={signupConfig} class="h-[300px] w-full">
							<AreaChart
								data={signupData}
								x="date"
								xScale={scaleUtc()}
								series={[
									{
										key: "signups",
										label: signupConfig.signups.label,
										color: signupConfig.signups.color,
									},
								]}
								props={{
									xAxis: {
										format: (d: Date) => d.toLocaleDateString("en-US", { month: "short" }),
									},
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip />
								{/snippet}
							</AreaChart>
						</Chart.Container>
					{:else}
						<div class="flex h-[300px] items-center justify-center">
							<p class="text-muted-foreground text-sm">No data yet</p>
						</div>
					{/if}
				{/key}
			</Card.Content>
		</Card.Root>

		<Card.Root class="col-span-3">
			<Card.Header>
				<Card.Title>Content Creation Over Time</Card.Title>
				<Card.Description>Pages created by month</Card.Description>
			</Card.Header>
			<Card.Content>
				{#key mode.current}
					{#if contentData.length > 0}
						<Chart.Container config={contentConfig} class="h-[300px] w-full">
							<LineChart
								data={contentData}
								x="date"
								xScale={scaleUtc()}
								series={[
									{
										key: "pages",
										label: contentConfig.pages.label,
										color: contentConfig.pages.color,
									},
								]}
								props={{
									xAxis: {
										format: (d: Date) => d.toLocaleDateString("en-US", { month: "short" }),
									},
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip />
								{/snippet}
							</LineChart>
						</Chart.Container>
					{:else}
						<div class="flex h-[300px] items-center justify-center">
							<p class="text-muted-foreground text-sm">No data yet</p>
						</div>
					{/if}
				{/key}
			</Card.Content>
		</Card.Root>
	</div>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
		<Card.Root class="col-span-3">
			<Card.Header>
				<Card.Title>Pages by Status</Card.Title>
				<Card.Description>Distribution of content statuses</Card.Description>
			</Card.Header>
			<Card.Content>
				{#key mode.current}
					{#if statusData.length > 0}
						<Chart.Container config={statusConfig} class="h-[300px] w-full">
							<PieChart
								data={statusData}
								value="value"
								c="key"
								cRange={statusColors}
								innerRadius={0.6}
								legend
							>
								{#snippet tooltip()}
									<Chart.Tooltip nameKey="label" />
								{/snippet}
							</PieChart>
						</Chart.Container>
					{:else}
						<div class="flex h-[300px] items-center justify-center">
							<p class="text-muted-foreground text-sm">No data yet</p>
						</div>
					{/if}
				{/key}
			</Card.Content>
		</Card.Root>

		<Card.Root class="col-span-4">
			<Card.Header>
				<Card.Title>Top Authors</Card.Title>
				<Card.Description>Users with the most content pages</Card.Description>
			</Card.Header>
			<Card.Content>
				{#key mode.current}
					{#if data.topAuthors.length > 0}
						<Chart.Container config={authorsConfig} class="h-[300px] w-full">
							<BarChart
								data={data.topAuthors}
								x="name"
								xScale={scaleBand().padding(0.3)}
								series={[
									{
										key: "pageCount",
										label: authorsConfig.pageCount.label,
										color: authorsConfig.pageCount.color,
									},
								]}
							>
								{#snippet tooltip()}
									<Chart.Tooltip />
								{/snippet}
							</BarChart>
						</Chart.Container>
					{:else}
						<div class="flex h-[300px] items-center justify-center">
							<p class="text-muted-foreground text-sm">No data yet</p>
						</div>
					{/if}
				{/key}
			</Card.Content>
		</Card.Root>
	</div>
</div>
