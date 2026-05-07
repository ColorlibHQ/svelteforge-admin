<script lang="ts">
	import { enhance } from "$app/forms";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import KeyRoundIcon from "@lucide/svelte/icons/key-round";

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Reset Password - SvelteForge Admin</title>
</svelte:head>

<div class="bg-background flex min-h-screen items-center justify-center p-4">
	<Card.Root class="w-full max-w-md">
		<Card.Header class="space-y-1 text-center">
			<div class="flex justify-center">
				<div
					class="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl"
				>
					<KeyRoundIcon class="size-6" />
				</div>
			</div>
			<Card.Title class="text-2xl font-bold">Reset password</Card.Title>
			<Card.Description>Enter your new password below</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if form?.message}
				<div class="bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm">
					{form.message}
				</div>
			{/if}
			{#if !data.valid}
				<div class="text-center">
					<p class="text-muted-foreground mb-4 text-sm">
						This reset link is invalid or missing a token.
					</p>
					<Button href="/forgot-password" variant="outline">Request a new link</Button>
				</div>
			{:else}
				<form method="POST" use:enhance class="space-y-4">
					<input type="hidden" name="token" value={data.token} />
					<div class="space-y-2">
						<Label for="password">New Password</Label>
						<Input
							id="password"
							name="password"
							type="password"
							placeholder="6+ characters"
							required
							autocomplete="new-password"
						/>
					</div>
					<div class="space-y-2">
						<Label for="confirmPassword">Confirm Password</Label>
						<Input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							placeholder="Repeat your password"
							required
							autocomplete="new-password"
						/>
					</div>
					<Button type="submit" class="w-full">Reset password</Button>
				</form>
			{/if}
		</Card.Content>
		<Card.Footer class="justify-center">
			<p class="text-muted-foreground text-sm">
				Remember your password?
				<a href="/login" class="text-primary underline-offset-4 hover:underline">Sign in</a>
			</p>
		</Card.Footer>
	</Card.Root>
</div>
