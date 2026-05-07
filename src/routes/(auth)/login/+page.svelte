<script lang="ts">
	import { enhance } from "$app/forms";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import ZapIcon from "@lucide/svelte/icons/zap";

	let { form, data } = $props();

	const providers = $derived(data.enabledProviders ?? []);
</script>

<svelte:head>
	<title>Login - SvelteForge Admin</title>
</svelte:head>

<div class="bg-background flex min-h-screen items-center justify-center p-4">
	<Card.Root class="w-full max-w-md">
		<Card.Header class="space-y-1 text-center">
			<div class="flex justify-center">
				<div
					class="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl"
				>
					<ZapIcon class="size-6" />
				</div>
			</div>
			<Card.Title class="text-2xl font-bold">Welcome back</Card.Title>
			<Card.Description>Enter your credentials to access the dashboard</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="bg-muted mb-4 rounded-md p-3 text-sm">
				<p class="font-medium">Demo Access</p>
				<p class="text-muted-foreground mt-1">
					Credentials are pre-filled: <span class="font-mono font-semibold">demo</span> /
					<span class="font-mono font-semibold">SvelteDemo2026!</span> — just click
					<strong>Sign in</strong> to explore (read-only).
				</p>
			</div>
			{#if form?.message}
				<div class="bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm">
					{form.message}
				</div>
			{/if}
			<form method="POST" use:enhance class="space-y-4">
				<div class="space-y-2">
					<Label for="username">Username</Label>
					<Input
						id="username"
						name="username"
						type="text"
						placeholder="Enter your username"
						required
						autocomplete="username"
						value="demo"
					/>
				</div>
				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						name="password"
						type="password"
						placeholder="Enter your password"
						required
						autocomplete="current-password"
						value="SvelteDemo2026!"
					/>
				</div>
				<Button type="submit" class="w-full">Sign in</Button>
			</form>
			{#if providers.length > 0}
				<div class="relative my-4">
					<div class="absolute inset-0 flex items-center">
						<Separator class="w-full" />
					</div>
					<div class="relative flex justify-center text-xs uppercase">
						<span class="bg-card text-muted-foreground px-2">Or continue with</span>
					</div>
				</div>
				<div class="flex flex-col gap-2">
					{#if providers.includes("google")}
						<Button variant="outline" class="w-full" href="/login/google">
							<svg class="mr-2 size-4" viewBox="0 0 24 24">
								<path
									fill="currentColor"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
								/>
								<path
									fill="currentColor"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="currentColor"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="currentColor"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							Continue with Google
						</Button>
					{/if}
					{#if providers.includes("github")}
						<Button variant="outline" class="w-full" href="/login/github">
							<svg class="mr-2 size-4" viewBox="0 0 24 24">
								<path
									fill="currentColor"
									d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
								/>
							</svg>
							Continue with GitHub
						</Button>
					{/if}
				</div>
			{/if}
			<div class="mt-2 text-center">
				<a
					href="/forgot-password"
					class="text-muted-foreground text-sm underline-offset-4 hover:underline"
					>Forgot your password?</a
				>
			</div>
		</Card.Content>
		<Card.Footer class="justify-center">
			<p class="text-muted-foreground text-sm">
				Don't have an account?
				<a href="/register" class="text-primary underline-offset-4 hover:underline">Register</a>
			</p>
		</Card.Footer>
	</Card.Root>
</div>
