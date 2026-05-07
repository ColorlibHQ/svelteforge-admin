<script lang="ts">
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import UsersIcon from "@lucide/svelte/icons/users";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import BarChart3Icon from "@lucide/svelte/icons/bar-chart-3";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import ShieldIcon from "@lucide/svelte/icons/shield";
	import BellIcon from "@lucide/svelte/icons/bell";
	import DatabaseIcon from "@lucide/svelte/icons/database";
	import BookOpenIcon from "@lucide/svelte/icons/book-open";
	import CrownIcon from "@lucide/svelte/icons/crown";
	import ExternalLinkIcon from "@lucide/svelte/icons/external-link";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import LogOutIcon from "@lucide/svelte/icons/log-out";
	import UserIcon from "@lucide/svelte/icons/user";
	import BellRingIcon from "@lucide/svelte/icons/bell-ring";
	import LockIcon from "@lucide/svelte/icons/lock";
	import ZapIcon from "@lucide/svelte/icons/zap";
	import KeyboardIcon from "@lucide/svelte/icons/keyboard";
	import HelpCircleIcon from "@lucide/svelte/icons/help-circle";

	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";

	type Props = {
		user: {
			name: string;
			email: string;
			username: string;
			role: string;
		};
		notificationCount?: number;
	};

	let { user, notificationCount = 0 }: Props = $props();

	function getInitials(name: string) {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	}

	type NavItem = {
		title: string;
		url: string;
		icon: typeof LayoutDashboardIcon;
		badge?: string;
	};

	type NavGroup = {
		label: string;
		items: NavItem[];
	};

	const navigation: NavGroup[] = $derived([
		{
			label: "Overview",
			items: [
				{ title: "Dashboard", url: "/", icon: LayoutDashboardIcon },
				{ title: "Analytics", url: "/analytics", icon: BarChart3Icon },
			],
		},
		{
			label: "Management",
			items: [
				{ title: "Users", url: "/users", icon: UsersIcon },
				{ title: "Content", url: "/content", icon: FileTextIcon },
				{ title: "Roles", url: "/roles", icon: ShieldIcon },
			],
		},
		{
			label: "System",
			items: [
				{
					title: "Notifications",
					url: "/notifications",
					icon: BellIcon,
					badge: notificationCount > 0 ? String(notificationCount) : undefined,
				},
				{ title: "Database", url: "/database", icon: DatabaseIcon },
				{ title: "Settings", url: "/settings", icon: SettingsIcon },
				{ title: "Documentation", url: "/docs", icon: BookOpenIcon },
			],
		},
	]);
</script>

<Sidebar.Root>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href="/" {...props}>
							<div
								class="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
							>
								<ZapIcon class="size-4" />
							</div>
							<div class="flex flex-col gap-0.5 leading-none">
								<span class="font-semibold">SvelteForge</span>
								<span class="text-xs">Admin Dashboard</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content>
		{#each navigation as group (group.label)}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each group.items as item (item.title)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton>
									{#snippet child({ props })}
										<a href={item.url} {...props}>
											<item.icon class="size-4" />
											<span>{item.title}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
								{#if item.badge}
									<Sidebar.MenuBadge>{item.badge}</Sidebar.MenuBadge>
								{/if}
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/each}
	</Sidebar.Content>

	<!-- Go Pro CTA -->
	<div class="px-3 py-2">
		<a
			href="https://dashboardpack.com/?utm_source=svelteforge&utm_medium=sidebar&utm_campaign=go-pro"
			target="_blank"
			rel="noopener noreferrer"
			class="group flex items-center gap-2 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2.5 transition-all hover:border-amber-500 hover:bg-amber-500/10"
		>
			<CrownIcon class="size-4 text-amber-500" />
			<span class="flex-1 text-sm font-semibold">Go Pro</span>
			<Badge class="bg-amber-500 px-1.5 text-[10px] text-white hover:bg-amber-600">PRO</Badge>
			<ExternalLinkIcon
				class="text-muted-foreground size-3 transition-transform group-hover:translate-x-0.5"
			/>
		</a>
	</div>

	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton
								size="lg"
								class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								{...props}
							>
								<Avatar.Root class="size-8 rounded-lg">
									<Avatar.Fallback class="rounded-lg">{getInitials(user.name)}</Avatar.Fallback>
								</Avatar.Root>
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-semibold">{user.name}</span>
									<span class="text-muted-foreground truncate text-xs">{user.email}</span>
								</div>
								<ChevronDownIcon class="ml-auto size-4" />
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-56" align="end" side="top">
						<DropdownMenu.Label class="flex items-center gap-2">
							My Account
							<Badge variant="outline" class="text-xs capitalize">{user.role}</Badge>
						</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href="/settings" {...props}>
									<UserIcon class="mr-2 size-4" />
									Profile
								</a>
							{/snippet}
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href="/notifications" {...props}>
									<BellRingIcon class="mr-2 size-4" />
									Notifications
									{#if notificationCount > 0}
										<Badge variant="secondary" class="ml-auto h-5 px-1.5 text-[10px]"
											>{notificationCount}</Badge
										>
									{/if}
								</a>
							{/snippet}
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href="/settings" {...props}>
									<SettingsIcon class="mr-2 size-4" />
									Settings
								</a>
							{/snippet}
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href="/lock" {...props}>
									<LockIcon class="mr-2 size-4" />
									Lock Screen
								</a>
							{/snippet}
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href="/settings" {...props}>
									<KeyboardIcon class="mr-2 size-4" />
									Keyboard Shortcuts
								</a>
							{/snippet}
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href="/" {...props}>
									<HelpCircleIcon class="mr-2 size-4" />
									Help & Support
								</a>
							{/snippet}
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item
							variant="destructive"
							onclick={() => {
								const form = document.getElementById("logout-form");
								if (form instanceof HTMLFormElement) form.requestSubmit();
							}}
						>
							<LogOutIcon class="mr-2 size-4" />
							Log out
						</DropdownMenu.Item>
					</DropdownMenu.Content>
					<form id="logout-form" method="POST" action="/logout" class="hidden"></form>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>

	<Sidebar.Rail />
</Sidebar.Root>
