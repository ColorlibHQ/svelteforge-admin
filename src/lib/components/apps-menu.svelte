<script lang="ts">
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import BarChart3Icon from "@lucide/svelte/icons/bar-chart-3";
	import UsersIcon from "@lucide/svelte/icons/users";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import ShieldIcon from "@lucide/svelte/icons/shield";
	import BellIcon from "@lucide/svelte/icons/bell";
	import DatabaseIcon from "@lucide/svelte/icons/database";
	import SettingsIcon from "@lucide/svelte/icons/settings";

	const apps = [
		{ label: "Dashboard", href: "/", icon: LayoutDashboardIcon },
		{ label: "Analytics", href: "/analytics", icon: BarChart3Icon },
		{ label: "Users", href: "/users", icon: UsersIcon },
		{ label: "Content", href: "/content", icon: FileTextIcon },
		{ label: "Roles", href: "/roles", icon: ShieldIcon },
		{ label: "Notifications", href: "/notifications", icon: BellIcon },
		{ label: "Database", href: "/database", icon: DatabaseIcon },
		{ label: "Settings", href: "/settings", icon: SettingsIcon },
	];

	let open = $state(false);
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button variant="ghost" size="icon" {...props}>
				<LayoutGridIcon class="size-4" />
				<span class="sr-only">Apps menu</span>
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-64 p-2" align="end">
		<div class="grid grid-cols-3 gap-1">
			{#each apps as app (app.href)}
				{@const Icon = app.icon}
				<a
					href={app.href}
					class="hover:bg-muted flex flex-col items-center gap-1.5 rounded-md px-2 py-3 text-center transition-colors"
					onclick={() => {
						open = false;
					}}
				>
					<div class="bg-muted flex size-9 items-center justify-center rounded-lg">
						<Icon class="text-foreground size-4" />
					</div>
					<span class="text-[11px] font-medium">{app.label}</span>
				</a>
			{/each}
		</div>
	</Popover.Content>
</Popover.Root>
