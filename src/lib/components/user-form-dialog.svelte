<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { enhance } from "$app/forms";

	type UserData = {
		id: string;
		name: string;
		email: string;
		username: string;
		role: string;
	};

	type Props = {
		open: boolean;
		mode: "create" | "edit";
		user?: UserData | null;
	};

	let { open = $bindable(false), mode, user = null }: Props = $props();

	const title = $derived(mode === "create" ? "Add User" : "Edit User");
	const action = $derived(mode === "create" ? "?/create" : "?/update");
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description>
				{mode === "create" ? "Create a new user account." : "Update user details."}
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			{action}
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === "success" || result.type === "redirect") {
						open = false;
					}
					await update();
				};
			}}
		>
			{#if mode === "edit" && user}
				<input type="hidden" name="id" value={user.id} />
			{/if}
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="name">Name</Label>
					<Input id="name" name="name" value={user?.name ?? ""} required />
				</div>
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input id="email" name="email" type="email" value={user?.email ?? ""} required />
				</div>
				{#if mode === "create"}
					<div class="grid gap-2">
						<Label for="username">Username</Label>
						<Input id="username" name="username" placeholder="lowercase, 3-31 chars" required />
					</div>
					<div class="grid gap-2">
						<Label for="password">Password</Label>
						<Input
							id="password"
							name="password"
							type="password"
							placeholder="6+ characters"
							required
						/>
					</div>
				{/if}
				<div class="grid gap-2">
					<Label for="role">Role</Label>
					<Select.Root name="role" type="single" value={user?.role ?? "viewer"}>
						<Select.Trigger>
							<span>{user?.role ?? "viewer"}</span>
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="admin">Admin</Select.Item>
							<Select.Item value="editor">Editor</Select.Item>
							<Select.Item value="viewer">Viewer</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
			</div>
			<Dialog.Footer>
				<Button type="submit">{mode === "create" ? "Create" : "Save Changes"}</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
