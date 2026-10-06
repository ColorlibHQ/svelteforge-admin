<script lang="ts">
	import { Button } from "#lib/components/ui/button/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import { Textarea } from "#lib/components/ui/textarea/index.js";
	import * as Select from "#lib/components/ui/select/index.js";
	import * as Card from "#lib/components/ui/card/index.js";
	import { enhance } from "$app/forms";
	import { toast } from "svelte-sonner";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";

	let { form } = $props();

	let title = $state("");
	let slug = $state("");
	let autoSlug = $state(true);

	$effect(() => {
		if (form?.message) toast.error(form.message);
	});

	function slugify(text: string) {
		return text
			.toLowerCase()
			.replace(/[^\w\s-]/g, "")
			.replace(/[\s_]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 200);
	}

	function handleTitleInput(e: Event) {
		title = (e.target as HTMLInputElement).value;
		if (autoSlug) {
			slug = slugify(title);
		}
	}

	function handleSlugInput(e: Event) {
		slug = (e.target as HTMLInputElement).value;
		autoSlug = false;
	}
</script>

<svelte:head>
	<title>New Page - SvelteForge Admin</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6">
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="icon" href="/content">
			<ArrowLeftIcon class="size-4" />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight">New Page</h1>
			<p class="text-muted-foreground">Create a new content page.</p>
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
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="grid gap-2">
						<Label>Template</Label>
						<Select.Root name="template" type="single" value="default">
							<Select.Trigger>
								<span>Default</span>
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
						<Select.Root name="status" type="single" value="draft">
							<Select.Trigger>
								<span>Draft</span>
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
					<Button type="submit">Create Page</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
