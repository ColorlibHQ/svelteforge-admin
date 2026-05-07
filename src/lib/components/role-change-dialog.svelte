<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { enhance } from "$app/forms";

	type Props = {
		open: boolean;
		userId: string;
		userName: string;
		currentRole: string;
	};

	let { open = $bindable(false), userId, userName, currentRole }: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[350px]">
		<Dialog.Header>
			<Dialog.Title>Change Role</Dialog.Title>
			<Dialog.Description>
				Change role for {userName}. Current role: {currentRole}.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/changeRole"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === "success" || result.type === "redirect") {
						open = false;
					}
					await update();
				};
			}}
		>
			<input type="hidden" name="userId" value={userId} />
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="newRole">New Role</Label>
					<Select.Root name="newRole" type="single" value={currentRole}>
						<Select.Trigger>
							<span>{currentRole}</span>
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
				<Button type="submit">Update Role</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
