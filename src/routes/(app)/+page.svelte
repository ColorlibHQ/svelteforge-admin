<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Chart from "$lib/components/ui/chart/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import { Skeleton } from "$lib/components/ui/skeleton/index.js";
	import AnimatedCounter from "$lib/components/animated-counter.svelte";
	import { AreaChart, PieChart, BarChart } from "layerchart";
	import { scaleUtc, scaleBand } from "d3-scale";
	import { mode } from "mode-watcher";
	import UsersIcon from "@lucide/svelte/icons/users";
	import ActivityIcon from "@lucide/svelte/icons/activity";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import BellIcon from "@lucide/svelte/icons/bell";
	import TrendingUpIcon from "@lucide/svelte/icons/trending-up";
	import TrendingDownIcon from "@lucide/svelte/icons/trending-down";
	import BookOpenIcon from "@lucide/svelte/icons/book-open";
	import PenToolIcon from "@lucide/svelte/icons/pen-tool";
	import ServerIcon from "@lucide/svelte/icons/server";
	import InfoIcon from "@lucide/svelte/icons/info";
	import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
	import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
	import CheckCircleIcon from "@lucide/svelte/icons/check-circle";

	let { data } = $props();

	// --- Chart configs ---

	const signupChartConfig = {
		signups: { label: "Signups", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;

	const roleChartConfig = {
		admin: { label: "Admin", color: "var(--chart-1)" },
		editor: { label: "Editor", color: "var(--chart-3)" },
		viewer: { label: "Viewer", color: "var(--chart-2)" },
	} satisfies Chart.ChartConfig;

	const contentTrendConfig = {
		published: { label: "Published", color: "var(--chart-5)" },
		draft: { label: "Draft", color: "var(--chart-2)" },
	} satisfies Chart.ChartConfig;

	const pageStatusConfig = {
		published: { label: "Published", color: "var(--chart-5)" },
		draft: { label: "Draft", color: "var(--chart-2)" },
		archived: { label: "Archived", color: "var(--chart-4)" },
	} satisfies Chart.ChartConfig;

	// --- Derived data ---

	const chartData = $derived(
		data.monthlySignups.map((d) => ({
			date: new Date(d.month),
			signups: d.count,
		}))
	);

	const roleData = $derived(
		data.roleDistribution.map((d) => ({
			key: d.role,
			label: d.role.charAt(0).toUpperCase() + d.role.slice(1),
			value: d.count,
		}))
	);

	const roleColors = $derived(
		data.roleDistribution.map((d) => {
			switch (d.role) {
				case "admin":
					return roleChartConfig.admin.color;
				case "editor":
					return roleChartConfig.editor.color;
				default:
					return roleChartConfig.viewer.color;
			}
		})
	);

	const contentTrendData = $derived(() => {
		const months = new Map<string, { month: string; published: number; draft: number }>();
		for (const row of data.contentTrend) {
			const existing = months.get(row.month) ?? { month: row.month, published: 0, draft: 0 };
			if (row.status === "published") existing.published = row.count;
			else if (row.status === "draft") existing.draft = row.count;
			months.set(row.month, existing);
		}
		return [...months.values()];
	});

	const pageStatusData = $derived(
		data.pagesByStatus.map((d) => ({
			key: d.status,
			label: d.status.charAt(0).toUpperCase() + d.status.slice(1),
			value: d.count,
		}))
	);

	const pageStatusColors = $derived(
		data.pagesByStatus.map((d) => {
			switch (d.status) {
				case "published":
					return pageStatusConfig.published.color;
				case "draft":
					return pageStatusConfig.draft.color;
				default:
					return pageStatusConfig.archived.color;
			}
		})
	);

	const stats = $derived([
		{
			title: "Total Users",
			rawValue: data.stats.totalUsers,
			icon: UsersIcon,
			trend: data.trends.users,
		},
		{
			title: "Active Sessions",
			rawValue: data.stats.activeSessions,
			icon: ActivityIcon,
			trend: null,
		},
		{
			title: "Total Pages",
			rawValue: data.stats.totalPages,
			icon: FileTextIcon,
			trend: data.trends.pages,
		},
		{
			title: "Unread Notifications",
			rawValue: data.stats.unreadNotifications,
			icon: BellIcon,
			trend: null,
		},
	]);

	// --- Helpers ---

	function timeAgo(isoString: string) {
		const diff = Date.now() - new Date(isoString).getTime();
		const minutes = Math.floor(diff / 60000);
		if (minutes < 1) return "just now";
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	function getInitials(name: string) {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	}

	function notifIcon(type: string) {
		switch (type) {
			case "warning":
				return AlertTriangleIcon;
			case "error":
				return CircleAlertIcon;
			case "success":
				return CheckCircleIcon;
			default:
				return InfoIcon;
		}
	}

	function notifColor(type: string) {
		switch (type) {
			case "warning":
				return "text-yellow-600 dark:text-yellow-400";
			case "error":
				return "text-red-600 dark:text-red-400";
			case "success":
				return "text-green-600 dark:text-green-400";
			default:
				return "text-blue-600 dark:text-blue-400";
		}
	}
</script>

<svelte:head>
	<title>Dashboard - SvelteForge Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header with date -->
	<div class="flex items-end justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
			<p class="text-muted-foreground">Welcome back. Here's what's happening today.</p>
		</div>
		<p class="text-muted-foreground hidden text-sm sm:block">
			{new Date().toLocaleDateString("en-US", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			})}
		</p>
	</div>

	<!-- Row 1: KPI Cards with Trend Pill Badges -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		{#each stats as stat (stat.title)}
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">{stat.title}</Card.Title>
					<stat.icon class="text-muted-foreground size-4" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold"><AnimatedCounter value={stat.rawValue} /></div>
					{#if stat.trend !== null}
						<div class="mt-1.5 flex items-center gap-1.5">
							{#if stat.trend > 0}
								<span
									class="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400"
								>
									<TrendingUpIcon class="size-3" />
									+{stat.trend}%
								</span>
							{:else if stat.trend < 0}
								<span
									class="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-400"
								>
									<TrendingDownIcon class="size-3" />
									{stat.trend}%
								</span>
							{:else}
								<span
									class="bg-muted text-muted-foreground inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
								>
									No change
								</span>
							{/if}
							<span class="text-muted-foreground text-[10px]">vs last month</span>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<!-- Row 2: Signups Area Chart + Content Trend Bar Chart -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
		<Card.Root class="lg:col-span-4">
			<Card.Header>
				<Card.Title>User Signups</Card.Title>
				<Card.Description>New user registrations over time</Card.Description>
			</Card.Header>
			<Card.Content>
				{#key mode.current}
					{#if chartData.length > 0}
						<Chart.Container config={signupChartConfig} class="h-[300px] w-full">
							<AreaChart
								data={chartData}
								x="date"
								xScale={scaleUtc()}
								series={[
									{
										key: "signups",
										label: signupChartConfig.signups.label,
										color: signupChartConfig.signups.color,
									},
								]}
								props={{
									xAxis: {
										format: (d: Date) => d.toLocaleDateString("en-US", { month: "short" }),
									},
									area: { opacity: 0.15 },
									line: { class: "stroke-2" },
								}}
								points
							>
								{#snippet tooltip()}
									<Chart.Tooltip indicator="line" />
								{/snippet}
							</AreaChart>
						</Chart.Container>
					{:else}
						<div class="flex h-[300px] flex-col justify-end gap-2 px-4 pb-8">
							<div class="flex items-end gap-3">
								{#each [40, 55, 35, 70, 50, 80, 65, 90, 75, 60, 85, 95] as h}
									<Skeleton class="flex-1" style="height: {h}%" />
								{/each}
							</div>
							<Skeleton class="h-4 w-full" />
						</div>
					{/if}
				{/key}
			</Card.Content>
		</Card.Root>

		<Card.Root class="lg:col-span-3">
			<Card.Header>
				<Card.Title>Content Production</Card.Title>
				<Card.Description>Pages created by month and status</Card.Description>
			</Card.Header>
			<Card.Content>
				{#key mode.current}
					{#if contentTrendData().length > 0}
						<Chart.Container config={contentTrendConfig} class="h-[300px] w-full">
							<BarChart
								data={contentTrendData()}
								x="month"
								xScale={scaleBand().padding(0.3)}
								series={[
									{
										key: "published",
										label: contentTrendConfig.published.label,
										color: contentTrendConfig.published.color,
									},
									{
										key: "draft",
										label: contentTrendConfig.draft.label,
										color: contentTrendConfig.draft.color,
									},
								]}
								seriesLayout="stack"
								legend
								props={{
									xAxis: {
										format: (d: string) => {
											const date = new Date(d);
											return date.toLocaleDateString("en-US", { month: "short" });
										},
									},
									bars: { radius: 4 },
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip indicator="dot" />
								{/snippet}
							</BarChart>
						</Chart.Container>
					{:else}
						<div class="flex h-[300px] flex-col justify-end gap-2 px-4 pb-8">
							<div class="flex items-end gap-3">
								{#each [60, 80, 45, 70, 55, 90] as h}
									<Skeleton class="flex-1" style="height: {h}%" />
								{/each}
							</div>
							<Skeleton class="h-4 w-full" />
						</div>
					{/if}
				{/key}
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Row 3: Role Distribution + Page Status + System Overview -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
		<Card.Root class="lg:col-span-3">
			<Card.Header>
				<Card.Title>User Roles</Card.Title>
				<Card.Description>Distribution of user roles</Card.Description>
			</Card.Header>
			<Card.Content>
				{#key mode.current}
					{#if roleData.length > 0}
						<Chart.Container config={roleChartConfig} class="h-[220px] w-full">
							<PieChart
								data={roleData}
								value="value"
								c="key"
								cRange={roleColors}
								innerRadius={0.6}
								padAngle={0.03}
								cornerRadius={4}
								legend
							>
								{#snippet tooltip()}
									<Chart.Tooltip nameKey="label" />
								{/snippet}
							</PieChart>
						</Chart.Container>
					{:else}
						<div class="flex h-[220px] items-center justify-center">
							<Skeleton class="size-32 rounded-full" />
						</div>
					{/if}
				{/key}
			</Card.Content>
		</Card.Root>

		<Card.Root class="lg:col-span-2">
			<Card.Header>
				<Card.Title>Page Status</Card.Title>
				<Card.Description>Content by status</Card.Description>
			</Card.Header>
			<Card.Content>
				{#key mode.current}
					{#if pageStatusData.length > 0}
						<Chart.Container config={pageStatusConfig} class="h-[220px] w-full">
							<PieChart
								data={pageStatusData}
								value="value"
								c="key"
								cRange={pageStatusColors}
								innerRadius={0.65}
								padAngle={0.02}
								cornerRadius={3}
								legend
							>
								{#snippet tooltip()}
									<Chart.Tooltip nameKey="label" />
								{/snippet}
							</PieChart>
						</Chart.Container>
					{:else}
						<div class="flex h-[220px] items-center justify-center">
							<Skeleton class="size-28 rounded-full" />
						</div>
					{/if}
				{/key}
			</Card.Content>
		</Card.Root>

		<Card.Root class="lg:col-span-2">
			<Card.Header>
				<Card.Title class="text-sm">System Overview</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<BookOpenIcon class="text-muted-foreground size-4" />
						<span class="text-muted-foreground text-sm">Published</span>
					</div>
					<span class="text-sm font-bold">{data.quickStats.publishedPages}</span>
				</div>
				<Separator />
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<PenToolIcon class="text-muted-foreground size-4" />
						<span class="text-muted-foreground text-sm">Active Editors</span>
					</div>
					<span class="text-sm font-bold">{data.quickStats.activeEditors}</span>
				</div>
				<Separator />
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<ServerIcon class="text-muted-foreground size-4" />
						<span class="text-muted-foreground text-sm">System</span>
					</div>
					{#if data.systemStatus.maintenanceMode}
						<Badge variant="outline" class="border-yellow-500 text-yellow-600 dark:text-yellow-400"
							>Maintenance</Badge
						>
					{:else}
						<Badge variant="outline" class="border-green-500 text-green-600 dark:text-green-400"
							>Operational</Badge
						>
					{/if}
				</div>
				<Separator />
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<UsersIcon class="text-muted-foreground size-4" />
						<span class="text-muted-foreground text-sm">Total Users</span>
					</div>
					<span class="text-sm font-bold">{data.stats.totalUsers}</span>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Row 4: Activity + Notifications -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
		<Card.Root class="lg:col-span-4">
			<Card.Header>
				<Card.Title>Recent Activity</Card.Title>
				<Card.Description>Latest actions across the platform</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if data.recentActivity.length > 0}
					<div class="space-y-4">
						{#each data.recentActivity as activity (activity.time)}
							<div class="flex items-center gap-3">
								<div
									class="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium"
								>
									{getInitials(activity.label)}
								</div>
								<div class="flex-1 space-y-0.5">
									<p class="text-sm font-medium">{activity.label}</p>
									<p class="text-muted-foreground text-xs">{activity.description}</p>
								</div>
								<span class="text-muted-foreground shrink-0 text-xs">{timeAgo(activity.time)}</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-muted-foreground text-sm">No recent activity</p>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root class="lg:col-span-3">
			<Card.Header class="flex flex-row items-center justify-between">
				<div>
					<Card.Title>Notifications</Card.Title>
					<Card.Description>Recent alerts and updates</Card.Description>
				</div>
				<a href="/notifications" class="text-primary text-xs font-medium hover:underline"
					>View all</a
				>
			</Card.Header>
			<Card.Content>
				{#if data.recentNotifications.length > 0}
					<ScrollArea class="max-h-[250px]">
						<div class="space-y-3">
							{#each data.recentNotifications as notif (notif.id)}
								{@const Icon = notifIcon(notif.type)}
								<div class="flex items-start gap-3">
									<div class={`mt-0.5 shrink-0 ${notifColor(notif.type)}`}>
										<Icon class="size-4" />
									</div>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<p class="truncate text-sm font-medium">{notif.title}</p>
											{#if !notif.read}
												<Badge variant="default" class="shrink-0 text-[9px]">New</Badge>
											{/if}
										</div>
										<p class="text-muted-foreground truncate text-xs">{notif.message}</p>
									</div>
								</div>
							{/each}
						</div>
					</ScrollArea>
				{:else}
					<div class="flex h-[100px] items-center justify-center">
						<p class="text-muted-foreground text-sm">No notifications</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
