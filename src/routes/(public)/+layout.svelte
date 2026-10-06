<script lang="ts">
	import { Button } from "#lib/components/ui/button/index.js";
	import HammerIcon from "@lucide/svelte/icons/hammer";

	let { children } = $props();
</script>

<div class="bg-background min-h-screen">
	<header class="border-b">
		<div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
			<a href="/" class="flex items-center gap-2 font-semibold">
				<HammerIcon class="size-5" />
				SvelteForge Admin
			</a>
			<Button href="/login" variant="outline" size="sm">Sign In</Button>
		</div>
	</header>
	<main>
		{@render children()}
	</main>
</div>
