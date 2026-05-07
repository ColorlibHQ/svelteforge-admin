<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import RoleChangeDialog from "$lib/components/role-change-dialog.svelte";
	import ShieldIcon from "@lucide/svelte/icons/shield";
	import PencilIcon from "@lucide/svelte/icons/pencil";
	import UsersIcon from "@lucide/svelte/icons/users";
	import CheckIcon from "@lucide/svelte/icons/check";
	import { toast } from "svelte-sonner";

	let { data, form } = $props();

	let roleChangeOpen = $state(false);
	let roleChangeUser = $state({ id: "", name: "", role: "" });

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (form?.success) toast.success("Role updated");
	});

	function getInitials(name: string) {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	}

	function openRoleChange(user: { id: string; name: string; role: string }) {
		roleChangeUser = user;
		roleChangeOpen = true;
	}

	function roleColor(role: string) {
		switch (role) {
			case "admin":
				return "border-primary/20 bg-primary/5";
			case "editor":
				return "border-blue-500/20 bg-blue-500/5";
			default:
				return "border-muted";
		}
	}
</script>

<svelte:head>
	<title>Roles - SvelteForge Admin</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Roles</h1>
		<p class="text-muted-foreground">Configure roles and access control policies.</p>
	</div>

	<div class="grid gap-6">
		{#each data.roles as role (role.name)}
			<Card.Root class={roleColor(role.name)}>
				<Card.Header>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div
								class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg"
							>
								<ShieldIcon class="size-5" />
							</div>
							<div>
								<Card.Title class="capitalize">{role.name}</Card.Title>
								<Card.Description>{role.description}</Card.Description>
							</div>
						</div>
						<Badge variant="secondary" class="gap-1">
							<UsersIcon class="size-3" />
							{role.count} user{role.count !== 1 ? "s" : ""}
						</Badge>
					</div>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div>
						<p class="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
							Permissions
						</p>
						<div class="flex flex-wrap gap-2">
							{#each role.permissions as perm}
								<Badge variant="outline" class="gap-1">
									<CheckIcon class="size-3" />
									{perm}
								</Badge>
							{/each}
						</div>
					</div>

					{#if role.users.length > 0}
						<div>
							<p class="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
								Users
							</p>
							<div class="space-y-2">
								{#each role.users as user (user.id)}
									<div class="flex items-center justify-between rounded-lg border p-3">
										<div class="flex items-center gap-3">
											<Avatar.Root class="size-8">
												<Avatar.Fallback class="text-xs">{getInitials(user.name)}</Avatar.Fallback>
											</Avatar.Root>
											<div>
												<p class="text-sm font-medium">{user.name}</p>
												<p class="text-muted-foreground text-xs">{user.email}</p>
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onclick={() =>
												openRoleChange({ id: user.id, name: user.name, role: role.name })}
										>
											<PencilIcon class="mr-1 size-3" />
											Change
										</Button>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</div>

<RoleChangeDialog
	bind:open={roleChangeOpen}
	userId={roleChangeUser.id}
	userName={roleChangeUser.name}
	currentRole={roleChangeUser.role}
/>
