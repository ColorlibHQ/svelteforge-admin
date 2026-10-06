<script lang="ts">
	import * as Card from "#lib/components/ui/card/index.js";
	import * as Table from "#lib/components/ui/table/index.js";
	import { Badge } from "#lib/components/ui/badge/index.js";
	import DatabaseIcon from "@lucide/svelte/icons/database";
	import HardDriveIcon from "@lucide/svelte/icons/hard-drive";
	import TableIcon from "@lucide/svelte/icons/table-2";
	import RowsIcon from "@lucide/svelte/icons/rows-3";

	let { data } = $props();

	function formatBytes(bytes: number) {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
	}
</script>

<svelte:head>
	<title>Database - SvelteForge Admin</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Database</h1>
		<p class="text-muted-foreground">Monitor your database status and table statistics.</p>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Database Size</Card.Title>
				<HardDriveIcon class="text-muted-foreground size-4" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{formatBytes(data.dbSize)}</div>
				<p class="text-muted-foreground text-xs">SQLite file size</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Journal Mode</Card.Title>
				<DatabaseIcon class="text-muted-foreground size-4" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold uppercase">{data.journalMode}</div>
				<p class="text-muted-foreground text-xs">Write-ahead logging</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Tables</Card.Title>
				<TableIcon class="text-muted-foreground size-4" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.tables.length}</div>
				<p class="text-muted-foreground text-xs">Active tables</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Total Rows</Card.Title>
				<RowsIcon class="text-muted-foreground size-4" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.totalRows.toLocaleString()}</div>
				<p class="text-muted-foreground text-xs">Across all tables</p>
			</Card.Content>
		</Card.Root>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>Tables</Card.Title>
			<Card.Description>Row counts for each table in the database.</Card.Description>
		</Card.Header>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Table Name</Table.Head>
						<Table.Head class="text-right">Rows</Table.Head>
						<Table.Head class="text-right">% of Total</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.tables as table (table.name)}
						<Table.Row>
							<Table.Cell class="font-mono text-sm">{table.name}</Table.Cell>
							<Table.Cell class="text-right">{table.rows.toLocaleString()}</Table.Cell>
							<Table.Cell class="text-right">
								<Badge variant="outline">
									{data.totalRows > 0 ? Math.round((table.rows / data.totalRows) * 100) : 0}%
								</Badge>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>
