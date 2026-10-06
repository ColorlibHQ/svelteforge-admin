<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Card from "#lib/components/ui/card/index.js";
	import FileQuestionIcon from "@lucide/svelte/icons/file-question";
	import ShieldAlertIcon from "@lucide/svelte/icons/shield-alert";
	import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
	import LockIcon from "@lucide/svelte/icons/lock";
	import WrenchIcon from "@lucide/svelte/icons/wrench";

	function getErrorInfo(status: number) {
		switch (status) {
			case 401:
				return {
					title: "Authentication Required",
					description: "You need to sign in to access this page.",
					icon: LockIcon,
				};
			case 403:
				return {
					title: "Access Denied",
					description: "You don't have permission to access this page.",
					icon: ShieldAlertIcon,
				};
			case 404:
				return {
					title: "Page Not Found",
					description: "The page you're looking for doesn't exist or has been moved.",
					icon: FileQuestionIcon,
				};
			case 503:
				return {
					title: "Under Maintenance",
					description: "The application is currently under maintenance. Please check back later.",
					icon: WrenchIcon,
				};
			default:
				return {
					title: "Something Went Wrong",
					description: "An unexpected error occurred. Please try again.",
					icon: AlertTriangleIcon,
				};
		}
	}

	const info = $derived(getErrorInfo(page.status));
</script>

<svelte:head>
	<title>{page.status} - {info.title}</title>
</svelte:head>

<div class="bg-background flex min-h-screen items-center justify-center p-4">
	<Card.Root class="w-full max-w-md text-center">
		<Card.Header class="space-y-4 pb-2">
			<div class="text-muted-foreground mx-auto">
				<info.icon class="size-16 stroke-1" />
			</div>
			<div class="text-muted-foreground text-6xl font-bold">{page.status}</div>
			<Card.Title class="text-xl">{info.title}</Card.Title>
			<Card.Description>
				{page.error?.message || info.description}
			</Card.Description>
		</Card.Header>
		<Card.Content class="flex justify-center gap-3 pt-2">
			{#if page.status === 401}
				<Button href="/login">Sign In</Button>
			{:else if page.status === 503}
				<Button onclick={() => location.reload()}>Refresh</Button>
			{:else}
				<Button variant="outline" onclick={() => history.back()}>Go Back</Button>
				<Button href="/">Go Home</Button>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
