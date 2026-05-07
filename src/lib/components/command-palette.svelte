<script lang="ts">
	import { Command } from "bits-ui";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { goto } from "$app/navigation";
	import { toggleMode } from "mode-watcher";
	import SearchIcon from "@lucide/svelte/icons/search";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import BarChart3Icon from "@lucide/svelte/icons/bar-chart-3";
	import UsersIcon from "@lucide/svelte/icons/users";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import ShieldIcon from "@lucide/svelte/icons/shield";
	import BellIcon from "@lucide/svelte/icons/bell";
	import DatabaseIcon from "@lucide/svelte/icons/database";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import SunMoonIcon from "@lucide/svelte/icons/sun-moon";
	import UserIcon from "@lucide/svelte/icons/user";
	import LoaderIcon from "@lucide/svelte/icons/loader";
	import type { Component } from "svelte";

	type SearchResult = {
		type: "user" | "page" | "notification";
		id: string;
		title: string;
		subtitle: string;
		href: string;
	};

	type NavItem = {
		label: string;
		href: string;
		icon: Component;
		keywords: string[];
	};

	let open = $state(false);
	let query = $state("");
	let searchResults = $state<SearchResult[]>([]);
	let loading = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout>;

	const navItems: NavItem[] = [
		{
			label: "Dashboard",
			href: "/",
			icon: LayoutDashboardIcon,
			keywords: ["home", "overview", "kpi"],
		},
		{
			label: "Analytics",
			href: "/analytics",
			icon: BarChart3Icon,
			keywords: ["charts", "stats", "reports"],
		},
		{
			label: "Users",
			href: "/users",
			icon: UsersIcon,
			keywords: ["accounts", "members", "people"],
		},
		{
			label: "Content",
			href: "/content",
			icon: FileTextIcon,
			keywords: ["pages", "blog", "articles"],
		},
		{
			label: "Roles",
			href: "/roles",
			icon: ShieldIcon,
			keywords: ["permissions", "access", "admin"],
		},
		{
			label: "Notifications",
			href: "/notifications",
			icon: BellIcon,
			keywords: ["alerts", "messages"],
		},
		{
			label: "Database",
			href: "/database",
			icon: DatabaseIcon,
			keywords: ["tables", "sql", "storage"],
		},
		{
			label: "Settings",
			href: "/settings",
			icon: SettingsIcon,
			keywords: ["preferences", "profile", "config"],
		},
	];

	function resultIcon(type: string) {
		switch (type) {
			case "user":
				return UserIcon;
			case "page":
				return FileTextIcon;
			default:
				return BellIcon;
		}
	}

	async function fetchSearch(q: string) {
		if (q.length < 2) {
			searchResults = [];
			return;
		}
		loading = true;
		try {
			const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
			if (res.ok) {
				searchResults = await res.json();
			}
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const q = query;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => fetchSearch(q), 250);
	});

	function navigate(href: string) {
		open = false;
		goto(href);
	}

	function handleAction(action: () => void) {
		open = false;
		action();
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open = !open;
		}
	}}
/>

<button
	type="button"
	class="border-input bg-muted/40 text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm transition-colors"
	onclick={() => (open = true)}
>
	<SearchIcon class="size-3.5" />
	<span class="hidden sm:inline">Search...</span>
	<kbd
		class="bg-background pointer-events-none hidden h-5 items-center gap-0.5 rounded border px-1.5 font-mono text-[10px] font-medium sm:inline-flex"
	>
		<span class="text-xs">&#8984;</span>K
	</kbd>
</button>

<Dialog.Root
	bind:open
	onOpenChange={() => {
		query = "";
		searchResults = [];
	}}
>
	<Dialog.Content
		showCloseButton={false}
		class="top-[20%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
	>
		<Command.Root shouldFilter={true} loop label="Command palette">
			<div class="flex items-center border-b px-3">
				<SearchIcon class="text-muted-foreground mr-2 size-4 shrink-0" />
				<Command.Input
					class="placeholder:text-muted-foreground flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
					placeholder="Type a command or search..."
					bind:value={query}
				/>
				{#if loading}
					<LoaderIcon class="text-muted-foreground ml-2 size-4 shrink-0 animate-spin" />
				{/if}
			</div>
			<Command.List class="max-h-[300px] overflow-x-hidden overflow-y-auto px-1 py-1.5">
				<Command.Empty class="text-muted-foreground py-6 text-center text-sm">
					No results found.
				</Command.Empty>

				<Command.Group value="navigation">
					<Command.GroupHeading class="text-muted-foreground px-2 py-1.5 text-xs font-medium">
						Navigation
					</Command.GroupHeading>
					<Command.GroupItems>
						{#each navItems as item (item.href)}
							<Command.Item
								value={item.label}
								keywords={item.keywords}
								onSelect={() => navigate(item.href)}
								class="data-[selected]:bg-accent data-[selected]:text-accent-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
							>
								<item.icon class="text-muted-foreground size-4" />
								{item.label}
							</Command.Item>
						{/each}
					</Command.GroupItems>
				</Command.Group>

				{#if searchResults.length > 0}
					<Command.Separator class="bg-border -mx-1 my-1 h-px" />
					<Command.Group value="search-results" forceMount>
						<Command.GroupHeading class="text-muted-foreground px-2 py-1.5 text-xs font-medium">
							Search Results
						</Command.GroupHeading>
						<Command.GroupItems>
							{#each searchResults as result (result.id)}
								{@const Icon = resultIcon(result.type)}
								<Command.Item
									value={`search-${result.id}`}
									forceMount
									onSelect={() => navigate(result.href)}
									class="data-[selected]:bg-accent data-[selected]:text-accent-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
								>
									<Icon class="text-muted-foreground size-4 shrink-0" />
									<div class="min-w-0 flex-1">
										<span class="block truncate">{result.title}</span>
										<span class="text-muted-foreground block truncate text-xs"
											>{result.subtitle}</span
										>
									</div>
								</Command.Item>
							{/each}
						</Command.GroupItems>
					</Command.Group>
				{/if}

				<Command.Separator class="bg-border -mx-1 my-1 h-px" />
				<Command.Group value="actions">
					<Command.GroupHeading class="text-muted-foreground px-2 py-1.5 text-xs font-medium">
						Quick Actions
					</Command.GroupHeading>
					<Command.GroupItems>
						<Command.Item
							value="New Page"
							keywords={["create", "add", "content"]}
							onSelect={() => navigate("/content/new")}
							class="data-[selected]:bg-accent data-[selected]:text-accent-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
						>
							<PlusIcon class="text-muted-foreground size-4" />
							New Page
						</Command.Item>
						<Command.Item
							value="Toggle Theme"
							keywords={["dark", "light", "mode", "switch"]}
							onSelect={() => handleAction(toggleMode)}
							class="data-[selected]:bg-accent data-[selected]:text-accent-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
						>
							<SunMoonIcon class="text-muted-foreground size-4" />
							Toggle Theme
						</Command.Item>
					</Command.GroupItems>
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Dialog.Content>
</Dialog.Root>
