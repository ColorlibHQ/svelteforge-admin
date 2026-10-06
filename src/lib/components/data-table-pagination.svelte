<script lang="ts">
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Select from "#lib/components/ui/select/index.js";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import ChevronsLeftIcon from "@lucide/svelte/icons/chevrons-left";
	import ChevronsRightIcon from "@lucide/svelte/icons/chevrons-right";

	let {
		totalItems = 0,
		pageSize = $bindable(10),
		currentPage = $bindable(1),
	}: {
		totalItems: number;
		pageSize: number;
		currentPage: number;
	} = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(totalItems / pageSize)));
	const startItem = $derived((currentPage - 1) * pageSize + 1);
	const endItem = $derived(Math.min(currentPage * pageSize, totalItems));

	function goToPage(page: number) {
		currentPage = Math.max(1, Math.min(page, totalPages));
	}

	const pageSizes = ["10", "25", "50"];
</script>

<div class="flex items-center justify-between px-2 py-4">
	<div class="text-muted-foreground text-sm">
		{#if totalItems > 0}
			Showing {startItem}–{endItem} of {totalItems}
		{:else}
			No results
		{/if}
	</div>
	<div class="flex items-center gap-4">
		<div class="flex items-center gap-2">
			<span class="text-muted-foreground text-sm">Rows</span>
			<Select.Root
				type="single"
				value={String(pageSize)}
				onValueChange={(v) => {
					if (v) {
						pageSize = Number(v);
						currentPage = 1;
					}
				}}
			>
				<Select.Trigger class="h-8 w-16">
					<span>{pageSize}</span>
				</Select.Trigger>
				<Select.Content>
					{#each pageSizes as size (size)}
						<Select.Item value={size}>{size}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
		<div class="flex items-center gap-1">
			<Button
				variant="outline"
				size="icon"
				class="size-8"
				disabled={currentPage <= 1}
				onclick={() => goToPage(1)}
			>
				<ChevronsLeftIcon class="size-4" />
				<span class="sr-only">First page</span>
			</Button>
			<Button
				variant="outline"
				size="icon"
				class="size-8"
				disabled={currentPage <= 1}
				onclick={() => goToPage(currentPage - 1)}
			>
				<ChevronLeftIcon class="size-4" />
				<span class="sr-only">Previous page</span>
			</Button>
			<span class="text-muted-foreground px-2 text-sm">
				{currentPage} / {totalPages}
			</span>
			<Button
				variant="outline"
				size="icon"
				class="size-8"
				disabled={currentPage >= totalPages}
				onclick={() => goToPage(currentPage + 1)}
			>
				<ChevronRightIcon class="size-4" />
				<span class="sr-only">Next page</span>
			</Button>
			<Button
				variant="outline"
				size="icon"
				class="size-8"
				disabled={currentPage >= totalPages}
				onclick={() => goToPage(totalPages)}
			>
				<ChevronsRightIcon class="size-4" />
				<span class="sr-only">Last page</span>
			</Button>
		</div>
	</div>
</div>
