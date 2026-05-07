<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { enhance } from "$app/forms";
	import InfoIcon from "@lucide/svelte/icons/info";
	import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
	import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
	import CheckCircleIcon from "@lucide/svelte/icons/check-circle";
	import CheckIcon from "@lucide/svelte/icons/check";
	import TrashIcon from "@lucide/svelte/icons/trash-2";
	import BellIcon from "@lucide/svelte/icons/bell";
	import { toast } from "svelte-sonner";

	let { data, form } = $props();

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (form?.success) toast.success("Done");
	});

	const unreadCount = $derived(data.notifications.filter((n) => !n.read).length);

	function typeIcon(type: string) {
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

	function typeColor(type: string) {
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

	function formatDate(date: Date | null) {
		if (!date) return "";
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		}).format(new Date(date));
	}
</script>

<svelte:head>
	<title>Notifications - SvelteForge Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Notifications</h1>
			<p class="text-muted-foreground">
				{#if unreadCount > 0}
					You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}.
				{:else}
					All caught up. No unread notifications.
				{/if}
			</p>
		</div>
		{#if unreadCount > 0}
			<form method="POST" action="?/markAllRead" use:enhance>
				<Button variant="outline" type="submit">
					<CheckIcon class="mr-2 size-4" />
					Mark All Read
				</Button>
			</form>
		{/if}
	</div>

	{#if data.notifications.length === 0}
		<div
			class="bg-muted/50 flex h-[300px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed"
		>
			<BellIcon class="text-muted-foreground size-10" />
			<p class="text-muted-foreground text-sm">No notifications yet</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each data.notifications as notification (notification.id)}
				{@const Icon = typeIcon(notification.type)}
				<Card.Root class={!notification.read ? "border-primary/30 bg-primary/5" : ""}>
					<Card.Content class="flex items-start gap-4 pt-6">
						<div class={`mt-0.5 ${typeColor(notification.type)}`}>
							<Icon class="size-5" />
						</div>
						<div class="flex-1 space-y-1">
							<div class="flex items-start justify-between gap-2">
								<div>
									<p class="text-sm leading-none font-medium">
										{notification.title}
										{#if !notification.read}
											<Badge variant="default" class="ml-2 text-[10px]">New</Badge>
										{/if}
									</p>
									<p class="text-muted-foreground mt-1 text-sm">{notification.message}</p>
								</div>
								<span class="text-muted-foreground shrink-0 text-xs"
									>{formatDate(notification.createdAt)}</span
								>
							</div>
						</div>
						<div class="flex shrink-0 gap-1">
							{#if !notification.read}
								<form method="POST" action="?/markRead" use:enhance>
									<input type="hidden" name="id" value={notification.id} />
									<Button
										variant="ghost"
										size="icon"
										class="size-8"
										type="submit"
										title="Mark as read"
									>
										<CheckIcon class="size-4" />
									</Button>
								</form>
							{/if}
							<form method="POST" action="?/delete" use:enhance>
								<input type="hidden" name="id" value={notification.id} />
								<Button
									variant="ghost"
									size="icon"
									class="text-destructive size-8"
									type="submit"
									title="Delete"
								>
									<TrashIcon class="size-4" />
								</Button>
							</form>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
