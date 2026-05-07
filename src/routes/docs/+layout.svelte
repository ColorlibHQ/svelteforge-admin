<script lang="ts">
	import { page } from "$app/state";
	import BookOpenIcon from "@lucide/svelte/icons/book-open";
	import RocketIcon from "@lucide/svelte/icons/rocket";
	import FolderTreeIcon from "@lucide/svelte/icons/folder-tree";
	import ShieldIcon from "@lucide/svelte/icons/shield";
	import DatabaseIcon from "@lucide/svelte/icons/database";
	import RouteIcon from "@lucide/svelte/icons/signpost";
	import ComponentIcon from "@lucide/svelte/icons/blocks";
	import PaletteIcon from "@lucide/svelte/icons/palette";
	import UsersIcon from "@lucide/svelte/icons/users";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import BarChart3Icon from "@lucide/svelte/icons/bar-chart-3";
	import BellIcon from "@lucide/svelte/icons/bell";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import TestTubeIcon from "@lucide/svelte/icons/test-tube";
	import CloudIcon from "@lucide/svelte/icons/cloud";
	import CodeIcon from "@lucide/svelte/icons/code";
	import ZapIcon from "@lucide/svelte/icons/zap";
	import ExternalLinkIcon from "@lucide/svelte/icons/external-link";
	import MenuIcon from "@lucide/svelte/icons/menu";
	import XIcon from "@lucide/svelte/icons/x";

	let { children } = $props();

	let mobileMenuOpen = $state(false);

	const sections = [
		{
			label: "Getting Started",
			items: [
				{ title: "Introduction", href: "/docs", icon: BookOpenIcon },
				{ title: "Installation", href: "/docs/getting-started", icon: RocketIcon },
				{ title: "Project Structure", href: "/docs/project-structure", icon: FolderTreeIcon },
			],
		},
		{
			label: "Core Concepts",
			items: [
				{ title: "Authentication", href: "/docs/authentication", icon: ShieldIcon },
				{ title: "Database", href: "/docs/database", icon: DatabaseIcon },
				{ title: "Routing", href: "/docs/routing", icon: RouteIcon },
				{ title: "Components", href: "/docs/components", icon: ComponentIcon },
				{ title: "Theming & Styling", href: "/docs/theming", icon: PaletteIcon },
			],
		},
		{
			label: "Features",
			items: [
				{ title: "User Management", href: "/docs/user-management", icon: UsersIcon },
				{ title: "Content Management", href: "/docs/content-management", icon: FileTextIcon },
				{ title: "Analytics & Charts", href: "/docs/analytics", icon: BarChart3Icon },
				{ title: "Notifications", href: "/docs/notifications", icon: BellIcon },
				{ title: "Settings", href: "/docs/settings", icon: SettingsIcon },
			],
		},
		{
			label: "Advanced",
			items: [
				{ title: "Testing", href: "/docs/testing", icon: TestTubeIcon },
				{ title: "Deployment", href: "/docs/deployment", icon: CloudIcon },
				{ title: "API Reference", href: "/docs/api-reference", icon: CodeIcon },
			],
		},
	];

	function isActive(href: string) {
		if (href === "/docs") return page.url.pathname === "/docs";
		return page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<title>Documentation - SvelteForge Admin</title>
</svelte:head>

<div class="bg-background min-h-screen">
	<!-- Top Navigation Bar -->
	<header
		class="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur"
	>
		<div class="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
			<a href="/" class="flex items-center gap-2">
				<div
					class="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md"
				>
					<ZapIcon class="size-4" />
				</div>
				<span class="text-sm font-bold">SvelteForge</span>
			</a>
			<span class="text-muted-foreground text-sm">/</span>
			<a href="/docs" class="text-sm font-medium">Docs</a>

			<div class="ml-auto flex items-center gap-3">
				<a
					href="https://dashboardpack.com/?utm_source=svelteforge&utm_medium=docs-header&utm_campaign=premium"
					target="_blank"
					rel="noopener noreferrer"
					class="bg-primary text-primary-foreground hover:bg-primary/90 hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:flex"
				>
					<ZapIcon class="size-3" />
					Go Premium
					<ExternalLinkIcon class="size-3" />
				</a>
				<a href="/" class="text-muted-foreground hover:text-foreground text-sm transition-colors">
					Back to App
				</a>
				<button
					class="text-muted-foreground hover:text-foreground lg:hidden"
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				>
					{#if mobileMenuOpen}
						<XIcon class="size-5" />
					{:else}
						<MenuIcon class="size-5" />
					{/if}
				</button>
			</div>
		</div>
	</header>

	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
			<!-- Sidebar Navigation -->
			<aside
				class="bg-background fixed inset-0 top-14 z-40 w-64 overflow-y-auto border-r p-4 transition-transform lg:sticky lg:block lg:h-[calc(100vh-3.5rem)] lg:w-auto lg:translate-x-0 lg:border-r-0 lg:p-0 lg:pt-8 {mobileMenuOpen
					? 'translate-x-0'
					: '-translate-x-full'}"
			>
				<nav class="space-y-6">
					{#each sections as section}
						<div>
							<h4 class="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
								{section.label}
							</h4>
							<ul class="space-y-0.5">
								{#each section.items as item}
									<li>
										<a
											href={item.href}
											onclick={() => (mobileMenuOpen = false)}
											class="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors {isActive(
												item.href
											)
												? 'bg-primary/10 text-primary font-medium'
												: 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
										>
											<item.icon class="size-4 shrink-0" />
											{item.title}
										</a>
									</li>
								{/each}
							</ul>
						</div>
					{/each}

					<!-- DashboardPack Promo in Sidebar -->
					<div class="border-t pt-4">
						<a
							href="https://dashboardpack.com/?utm_source=svelteforge&utm_medium=docs-sidebar&utm_campaign=premium"
							target="_blank"
							rel="noopener noreferrer"
							class="group hover:border-primary hover:bg-primary/5 block rounded-lg border border-dashed p-3 transition-colors"
						>
							<div class="flex items-center gap-2">
								<ZapIcon class="text-primary size-4" />
								<span class="text-sm font-semibold">Go Premium</span>
								<ExternalLinkIcon
									class="text-muted-foreground size-3 transition-transform group-hover:translate-x-0.5"
								/>
							</div>
							<p class="text-muted-foreground mt-1 text-xs leading-relaxed">
								50+ pages, 5 dashboards, CRUD, theme customizer &amp; more on DashboardPack.
							</p>
						</a>
					</div>
				</nav>
			</aside>

			<!-- Mobile overlay -->
			{#if mobileMenuOpen}
				<button
					class="fixed inset-0 top-14 z-30 bg-black/50 lg:hidden"
					onclick={() => (mobileMenuOpen = false)}
					aria-label="Close menu"
				></button>
			{/if}

			<!-- Main Content -->
			<main class="min-w-0 py-8">
				<article class="prose prose-zinc dark:prose-invert max-w-none">
					{@render children()}
				</article>
			</main>
		</div>
	</div>
</div>
