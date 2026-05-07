<script lang="ts">
	import { enhance } from "$app/forms";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import MailIcon from "@lucide/svelte/icons/mail";

	let { form } = $props();
</script>

<svelte:head>
	<title>Forgot Password - SvelteForge Admin</title>
</svelte:head>

<div class="bg-background flex min-h-screen items-center justify-center p-4">
	<Card.Root class="w-full max-w-md">
		<Card.Header class="space-y-1 text-center">
			<div class="flex justify-center">
				<div
					class="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl"
				>
					<MailIcon class="size-6" />
				</div>
			</div>
			<Card.Title class="text-2xl font-bold">Forgot password?</Card.Title>
			<Card.Description>Enter your email and we'll send you a reset link</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if form?.message}
				<div class="bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm">
					{form.message}
				</div>
			{/if}
			{#if form?.success}
				<div class="mb-4 rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
					If an account exists with that email, a reset link has been sent. Check your console logs
					in development.
				</div>
			{:else}
				<form method="POST" use:enhance class="space-y-4">
					<div class="space-y-2">
						<Label for="email">Email</Label>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="you@example.com"
							required
							autocomplete="email"
						/>
					</div>
					<Button type="submit" class="w-full">Send reset link</Button>
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
