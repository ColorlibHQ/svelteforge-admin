<script>
	const premiumUrl =
		"https://dashboardpack.com/?utm_source=svelteforge&utm_medium=docs&utm_campaign=premium";
</script>

<svelte:head>
	<title>Content Management - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="Complete guide to the built-in CMS in SvelteForge Admin — page editor, templates, status workflow, and export powered by Svelte 5 and SvelteKit."
	/>
</svelte:head>

<div class="prose dark:prose-invert max-w-none">
	<h1>Content Management</h1>

	<p class="lead">
		SvelteForge Admin includes a built-in CMS for creating and managing pages, powered by
		<strong>SvelteKit</strong> form actions and <strong>Drizzle ORM</strong>. Content is stored in
		SQLite with full status workflow support, template selection, and automatic author tracking —
		all driven by <strong>Svelte 5</strong> reactivity.
	</p>

	<hr />

	<h2>Page Editor</h2>

	<p>
		The page editor provides a straightforward interface for creating and editing content pages.
		Each page consists of a title, slug, content body, template type, and publication status.
	</p>

	<h3>Creating a Page</h3>

	<ul>
		<li>
			<strong>Title</strong> — The page title, displayed in the content table and used for auto-generating
			the slug.
		</li>
		<li>
			<strong>Slug</strong> — Auto-generated from the title on creation. The slug is editable before saving
			and must be unique across all pages.
		</li>
		<li>
			<strong>Content</strong> — A textarea for the page body. Accepts plain text or HTML content.
		</li>
		<li>
			<strong>Template</strong> — Select from Default, Landing, or Blog. Stored as an enum in the Drizzle
			schema.
		</li>
		<li>
			<strong>Status</strong> — Set the initial status: Draft, Published, or Archived.
		</li>
	</ul>

	<h3>Auto-Generated Slugs</h3>

	<p>
		When you type a title, the slug field is automatically populated with a URL-friendly version
		(lowercase, hyphens replacing spaces, special characters stripped). You can manually edit the
		slug before saving. Slug uniqueness is validated server-side — the form action returns an error
		if a duplicate slug exists.
	</p>

	<h3>Templates</h3>

	<table>
		<thead>
			<tr>
				<th>Template</th>
				<th>Use Case</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td><strong>Default</strong></td>
				<td>Standard content pages with a sidebar layout</td>
			</tr>
			<tr>
				<td><strong>Landing</strong></td>
				<td>Full-width pages for marketing or promotional content</td>
			</tr>
			<tr>
				<td><strong>Blog</strong></td>
				<td>Article-style pages with author attribution and date display</td>
			</tr>
		</tbody>
	</table>

	<h3>Status Workflow</h3>

	<p>Pages follow a three-stage lifecycle:</p>

	<pre><code>Draft  -->  Published  -->  Archived</code></pre>

	<ul>
		<li>
			<strong>Draft</strong> — Work in progress. Not visible to the public. Default status for new pages.
		</li>
		<li>
			<strong>Published</strong> — Live and accessible. When a page transitions to "published", the
			<code>publishedAt</code> timestamp is automatically set to the current date and time.
		</li>
		<li>
			<strong>Archived</strong> — Removed from active listings but preserved in the database for reference.
		</li>
	</ul>

	<p>
		Status transitions are unrestricted — you can move a page directly from Draft to Archived or
		revert a Published page back to Draft.
	</p>

	<hr />

	<h2>Content Table</h2>

	<p>
		The content table lists all pages with relevant metadata. Data is loaded server-side via a
		Drizzle query that performs a <strong>left join</strong> with the users table to resolve the author
		name.
	</p>

	<h3>Displayed Columns</h3>

	<ul>
		<li><strong>Title</strong> — The page title, linked to the edit view</li>
		<li><strong>Slug</strong> — The URL-friendly identifier</li>
		<li><strong>Status</strong> — A color-coded badge (Draft, Published, Archived)</li>
		<li><strong>Template</strong> — The assigned template type</li>
		<li><strong>Author</strong> — Resolved from the users table via left join</li>
		<li><strong>Created / Updated</strong> — Timestamps for tracking content changes</li>
	</ul>

	<h3>Table Features</h3>

	<ul>
		<li>
			<strong>Sortable columns</strong> — Click headers to sort by title, status, author, or date
		</li>
		<li>
			<strong>Status filtering</strong> — Filter the table to show only Draft, Published, or Archived
			pages
		</li>
		<li>
			<strong>Pagination</strong> — Uses the <code>data-table-pagination</code> component with configurable
			page sizes
		</li>
		<li><strong>Checkbox selection</strong> — Select individual or all rows for bulk operations</li>
	</ul>

	<pre><code
			>{`// content/+page.server.ts — load function with author join
export const load: PageServerLoad = async () => {
  const allPages = db
    .select({
      id: pages.id,
      title: pages.title,
      slug: pages.slug,
      status: pages.status,
      template: pages.template,
      authorName: users.name,
      createdAt: pages.createdAt,
      updatedAt: pages.updatedAt,
      publishedAt: pages.publishedAt
    })
    .from(pages)
    .leftJoin(users, eq(pages.authorId, users.id))
    .orderBy(desc(pages.createdAt))
    .all();

  return { pages: allPages };
};`}</code
		></pre>

	<hr />

	<h2>Creating Content</h2>

	<p>
		New pages are created through a form that submits to the <code>create</code> form action in
		<code>content/+page.server.ts</code>. The form uses SvelteKit's <code>use:enhance</code> for progressive
		enhancement.
	</p>

	<h3>Server-Side Processing</h3>

	<ul>
		<li>All fields are validated on the server (title required, slug format and uniqueness)</li>
		<li>
			The <code>authorId</code> is set from the current user session — it cannot be spoofed from the client
		</li>
		<li>
			If the status is set to "published" on creation, <code>publishedAt</code> is populated automatically
		</li>
		<li>
			The page ID is generated using <code>generateId()</code> from <code>$lib/server/id.ts</code>
		</li>
	</ul>

	<hr />

	<h2>Editing Content</h2>

	<p>
		The same form component renders in edit mode when an existing page is selected. All fields are
		editable, including the slug (with uniqueness re-validated against other pages).
	</p>

	<ul>
		<li>
			The <code>update</code> form action processes changes and updates the <code>updatedAt</code>
			timestamp.
		</li>
		<li>
			Status transitions are tracked — changing from any status to "published" sets the
			<code>publishedAt</code> timestamp if it was not previously set.
		</li>
	</ul>

	<hr />

	<h2>Deleting Content</h2>

	<h3>Single Delete</h3>

	<p>
		Deleting a page requires confirmation through a dialog. The <code>delete</code> form action removes
		the page and its associated data from the database.
	</p>

	<h3>Bulk Delete</h3>

	<p>
		Select multiple pages via checkboxes and delete them in one operation. The
		<code>bulkDelete</code> form action processes all selected page IDs in a single database transaction.
	</p>

	<pre><code
			>{`// Form actions for content deletion
delete: async ({ request }) => {
  const formData = await request.formData();
  const id = formData.get('id') as string;
  db.delete(pages).where(eq(pages.id, id)).run();
},

bulkDelete: async ({ request }) => {
  const formData = await request.formData();
  const ids = JSON.parse(formData.get('ids') as string);
  for (const id of ids) {
    db.delete(pages).where(eq(pages.id, id)).run();
  }
}`}</code
		></pre>

	<hr />

	<h2>Export</h2>

	<p>
		Content data can be exported using the shared utility functions from
		<code>$lib/utils/export.ts</code>:
	</p>

	<ul>
		<li>
			<strong>CSV export</strong> — Generates a properly escaped CSV file with headers matching the table
			columns. Handles commas, quotes, and newlines within content fields.
		</li>
		<li>
			<strong>JSON export</strong> — Outputs a pretty-printed JSON array of all page objects with 2-space
			indentation.
		</li>
	</ul>

	<p>
		Both export functions trigger an automatic file download in the browser with a timestamped
		filename.
	</p>

	<hr />

	<h2>Database Schema Reference</h2>

	<p>
		The <code>pages</code> table in <code>src/lib/server/db/schema.ts</code> defines the following columns:
	</p>

	<table>
		<thead>
			<tr>
				<th>Column</th>
				<th>Type</th>
				<th>Notes</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td><code>id</code></td>
				<td>text (primary key)</td>
				<td>Generated via <code>generateId()</code></td>
			</tr>
			<tr>
				<td><code>title</code></td>
				<td>text (not null)</td>
				<td>Page title</td>
			</tr>
			<tr>
				<td><code>slug</code></td>
				<td>text (unique, not null)</td>
				<td>URL-friendly identifier</td>
			</tr>
			<tr>
				<td><code>content</code></td>
				<td>text</td>
				<td>Page body content</td>
			</tr>
			<tr>
				<td><code>template</code></td>
				<td>text</td>
				<td>Enum: <code>default</code>, <code>landing</code>, <code>blog</code></td>
			</tr>
			<tr>
				<td><code>status</code></td>
				<td>text</td>
				<td>Enum: <code>draft</code>, <code>published</code>, <code>archived</code></td>
			</tr>
			<tr>
				<td><code>authorId</code></td>
				<td>text</td>
				<td>Foreign key to <code>users.id</code></td>
			</tr>
			<tr>
				<td><code>createdAt</code></td>
				<td>integer (timestamp)</td>
				<td>Set on creation</td>
			</tr>
			<tr>
				<td><code>updatedAt</code></td>
				<td>integer (timestamp)</td>
				<td>Updated on every edit</td>
			</tr>
			<tr>
				<td><code>publishedAt</code></td>
				<td>integer (timestamp)</td>
				<td>Set when status becomes "published"</td>
			</tr>
		</tbody>
	</table>

	<hr />

	<h2>Svelte 5 Patterns Used</h2>

	<p>
		The content management module leverages <strong>Svelte 5</strong> runes throughout:
	</p>

	<ul>
		<li>
			<strong><code>$state</code></strong> — Reactive state for form data bindings, selected checkbox
			items, status filter, current page, and page size.
		</li>
		<li>
			<strong><code>$derived</code></strong> — Computed values for filtered content views (e.g., showing
			only published pages) that automatically re-evaluate when the filter state changes.
		</li>
		<li>
			<strong><code>use:enhance</code></strong> — SvelteKit's progressive enhancement directive on all
			forms, enabling non-blocking submissions. The page updates reactively without a full reload.
		</li>
	</ul>

	<pre><code
			>{`// Svelte 5 reactive patterns in the content page
let statusFilter = $state('all');
let selectedIds = $state<string[]>([]);
let currentPage = $state(1);

let filteredPages = $derived(
  statusFilter === 'all'
    ? allPages
    : allPages.filter((p) => p.status === statusFilter)
);

let allSelected = $derived(
  filteredPages.length > 0 &&
  selectedIds.length === filteredPages.length
);`}</code
		></pre>

	<hr />

	<div
		class="not-prose rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950"
	>
		<h3 class="mb-2 text-lg font-semibold text-blue-900 dark:text-blue-100">
			Need a Full-Featured CMS?
		</h3>
		<p class="mb-4 text-blue-800 dark:text-blue-200">
			<strong>DashboardPack</strong> premium admin templates include a complete CMS with
			<strong>rich text editor</strong>, <strong>file manager</strong>,
			<strong>media library</strong>, and <strong>SEO tools</strong> — all built with Svelte 5 and SvelteKit,
			production-ready out of the box.
		</p>
		<a
			href={premiumUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-blue-700"
		>
			Explore DashboardPack Premium
		</a>
	</div>
</div>
