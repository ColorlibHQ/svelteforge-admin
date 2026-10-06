<script lang="ts">
	import AppSidebar from "#lib/components/app-sidebar.svelte";
	import * as Sidebar from "#lib/components/ui/sidebar/index.js";
	import * as Breadcrumb from "#lib/components/ui/breadcrumb/index.js";
	import { Separator } from "#lib/components/ui/separator/index.js";
	import { page } from "$app/state";
	import { Toaster } from "#lib/components/ui/sonner/index.js";
	import ThemeToggle from "#lib/components/theme-toggle.svelte";
	import CommandPalette from "#lib/components/command-palette.svelte";
	import NotificationBell from "#lib/components/notification-bell.svelte";
	import AppsMenu from "#lib/components/apps-menu.svelte";

	let { children, data } = $props();

	function getBreadcrumbs() {
		const path = page.url.pathname;
		if (path === "/") return [{ label: "Dashboard", href: "/" }];

		const segments = path.split("/").filter(Boolean);
		return segments.map((segment, i) => ({
			label: segment.charAt(0).toUpperCase() + segment.slice(1),
			href: "/" + segments.slice(0, i + 1).join("/"),
		}));
	}
</script>

<Sidebar.Provider>
	<AppSidebar user={data.user} notificationCount={data.unreadNotificationCount} />
	<Sidebar.Inset>
		<header
			class="bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4"
		>
			<Sidebar.Trigger class="-ml-1" />
			<Separator orientation="vertical" class="mr-2 !h-4" />
			<Breadcrumb.Root>
				<Breadcrumb.List>
					{#each getBreadcrumbs() as crumb, i (crumb.href)}
						{#if i > 0}
							<Breadcrumb.Separator />
						{/if}
						<Breadcrumb.Item>
							{#if i === getBreadcrumbs().length - 1}
								<Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>
							{:else}
								<Breadcrumb.Link href={crumb.href}>{crumb.label}</Breadcrumb.Link>
							{/if}
						</Breadcrumb.Item>
					{/each}
				</Breadcrumb.List>
			</Breadcrumb.Root>

			<div class="ml-auto flex items-center gap-1">
				<CommandPalette />
				<NotificationBell
					count={data.unreadNotificationCount}
					notifications={data.recentNotifications}
				/>
				<AppsMenu />
				<ThemeToggle />
			</div>
		</header>

		<main class="flex-1 p-4 md:p-6">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>

<Toaster />
