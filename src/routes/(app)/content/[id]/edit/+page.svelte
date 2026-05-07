<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { enhance } from "$app/forms";
	import { toast } from "svelte-sonner";
	import { untrack } from "svelte";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";

	let { data, form } = $props();

	let title = $state(untrack(() => data.page.title));
	let slug = $state(untrack(() => data.page.slug));

	$effect(() => {
		if (form?.message) toast.error(form.message);
	});

	function handleTitleInput(e: Event) {
		title = (e.target as HTMLInputElement).value;
	}

	function handleSlugInput(e: Event) {
		slug = (e.target as HTMLInputElement).value;
	}
</script>

<svelte:head>
	<title>Edit: {data.page.title} - SvelteForge Admin</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6">
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="icon" href="/content">
			<ArrowLeftIcon class="size-4" />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Edit Page</h1>
			<p class="text-muted-foreground">Editing: {data.page.title}</p>
		</div>
	</div>

	<Card.Root>
		<Card.Content class="pt-6">
			<form method="POST" use:enhance class="space-y-6">
				<div class="grid gap-2">
					<Label for="title">Title</Label>
					<Input
						id="title"
						name="title"
						placeholder="Page title"
						value={title}
						oninput={handleTitleInput}
						required
					/>
				</div>

				<div class="grid gap-2">
					<Label for="slug">Slug</Label>
					<div class="flex items-center gap-2">
						<span class="text-muted-foreground text-sm">/</span>
						<Input
							id="slug"
							name="slug"
							placeholder="page-slug"
							value={slug}
							oninput={handleSlugInput}
							class="font-mono"
						/>
					</div>
				</div>

				<div class="grid gap-2">
					<Label for="content">Content</Label>
					<Textarea
						id="content"
						name="content"
						placeholder="Write your page content here..."
						rows={12}
						value={data.page.content}
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="grid gap-2">
						<Label>Template</Label>
						<Select.Root name="template" type="single" value={data.page.template}>
							<Select.Trigger>
								<span class="capitalize">{data.page.template}</span>
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="default">Default</Select.Item>
								<Select.Item value="landing">Landing</Select.Item>
								<Select.Item value="blog">Blog</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div class="grid gap-2">
						<Label>Status</Label>
						<Select.Root name="status" type="single" value={data.page.status}>
							<Select.Trigger>
								<span class="capitalize">{data.page.status}</span>
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="draft">Draft</Select.Item>
								<Select.Item value="published">Published</Select.Item>
								<Select.Item value="archived">Archived</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<div class="flex justify-end gap-2">
					<Button variant="outline" href="/content">Cancel</Button>
					<Button type="submit">Save Changes</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
