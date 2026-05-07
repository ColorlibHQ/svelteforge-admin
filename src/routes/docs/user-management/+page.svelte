<script>
	const premiumUrl =
		"https://dashboardpack.com/?utm_source=svelteforge&utm_medium=docs&utm_campaign=premium";
</script>

<svelte:head>
	<title>User Management - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="Complete guide to user management in SvelteForge Admin — CRUD operations, RBAC, bulk actions, and export powered by Svelte 5 and SvelteKit."
	/>
</svelte:head>

<div class="prose dark:prose-invert max-w-none">
	<h1>User Management</h1>

	<p class="lead">
		SvelteForge Admin provides full CRUD operations for user management, powered by
		<strong>SvelteKit</strong> form actions and <strong>Svelte 5</strong> reactivity. Users are stored
		in SQLite via Drizzle ORM with Argon2id password hashing, role-based access control, and comprehensive
		server-side validation.
	</p>

	<hr />

	<h2>User Table</h2>

	<p>
		The user table loads all users server-side through the <code>load</code> function in
		<code>users/+page.server.ts</code>. Data is fetched from the Drizzle ORM
		<code>users</code> table, ordered by creation date (newest first).
	</p>

	<h3>Features</h3>

	<ul>
		<li>
			<strong>Sortable columns</strong> — Click column headers to sort by name, email, username, role,
			or creation date.
		</li>
		<li>
			<strong>Search filtering</strong> — Real-time filtering across name, email, and username using
			<code>$state</code> and <code>$derived</code> runes from Svelte 5.
		</li>
		<li>
			<strong>Pagination</strong> — The <code>data-table-pagination</code> component provides page navigation
			with configurable page sizes.
		</li>
		<li>
			<strong>Page size selector</strong> — Choose between 10, 25, or 50 rows per page. The selection
			persists across navigation.
		</li>
		<li>
			<strong>CSV and JSON export</strong> — Export visible or all user data using utility functions
			from
			<code>$lib/utils/export.ts</code>.
		</li>
	</ul>

	<h3>Server-Side Data Loading</h3>

	<pre><code
			>{`// users/+page.server.ts — load function
export const load: PageServerLoad = async () => {
  const allUsers = db.select().from(users).orderBy(desc(users.createdAt)).all();
  return { users: allUsers };
};`}</code
		></pre>

	<hr />

	<h2>Creating Users</h2>

	<p>
		New users are created through the <code>user-form-dialog.svelte</code> component, which renders a
		form inside a dialog. Only administrators can create users.
	</p>

	<h3>Form Fields</h3>

	<table>
		<thead>
			<tr>
				<th>Field</th>
				<th>Requirements</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td><strong>Name</strong></td>
				<td>Required, displayed in the UI and exports</td>
			</tr>
			<tr>
				<td><strong>Email</strong></td>
				<td>Required, must be unique across all users</td>
			</tr>
			<tr>
				<td><strong>Username</strong></td>
				<td>3-31 characters, lowercase alphanumeric only</td>
			</tr>
			<tr>
				<td><strong>Password</strong></td>
				<td>Required, hashed with Argon2id before storage</td>
			</tr>
			<tr>
				<td><strong>Role</strong></td>
				<td>Select from Admin, Editor, or Viewer</td>
			</tr>
		</tbody>
	</table>

	<h3>Server-Side Validation</h3>

	<p>
		The <code>create</code> form action in <code>users/+page.server.ts</code> performs the following checks
		before inserting a new user:
	</p>

	<ul>
		<li>Username format validation (3-31 lowercase alphanumeric characters)</li>
		<li>Email uniqueness check against existing users</li>
		<li>Password requirements enforcement</li>
		<li>Argon2id hashing of the password before database insertion</li>
	</ul>

	<p>
		The form uses SvelteKit's <code>use:enhance</code> for progressive enhancement, keeping the page interactive
		while the server processes the request.
	</p>

	<hr />

	<h2>Editing Users</h2>

	<p>
		The same <code>user-form-dialog.svelte</code> component handles editing when opened in edit mode.
		The dialog pre-populates all fields with the selected user's current data.
	</p>

	<ul>
		<li>All fields are editable, including role assignment.</li>
		<li>
			The <code>update</code> form action validates changes server-side with the same rules as creation.
		</li>
		<li>
			<strong>Last-admin protection</strong> — The server prevents demoting the last remaining admin to
			a lower role, ensuring at least one admin always exists.
		</li>
	</ul>

	<hr />

	<h2>Deleting Users</h2>

	<p>
		User deletion is handled by the <code>delete-confirm-dialog.svelte</code> component, which requires
		explicit confirmation before proceeding.
	</p>

	<h3>Safety Checks</h3>

	<ul>
		<li><strong>Self-deletion prevention</strong> — Users cannot delete their own account.</li>
		<li>
			<strong>Last-admin protection</strong> — The system blocks deletion if it would remove the last
			administrator.
		</li>
	</ul>

	<h3>Bulk Delete</h3>

	<p>
		Select multiple users via checkboxes and delete them in a single action. The bulk delete
		operation:
	</p>

	<ul>
		<li>Automatically filters out the current user from the selection.</li>
		<li>
			Blocks the operation if deleting the selected users would remove all remaining administrators.
		</li>
		<li>
			Uses the <code>bulkDelete</code> form action, which processes all deletions in a single database
			transaction.
		</li>
	</ul>

	<hr />

	<h2>Role-Based Access Control (RBAC)</h2>

	<p>
		SvelteForge Admin implements a three-tier role system. The first user to register is
		automatically assigned the <strong>Admin</strong> role.
	</p>

	<h3>Role Capabilities</h3>

	<table>
		<thead>
			<tr>
				<th>Capability</th>
				<th>Admin</th>
				<th>Editor</th>
				<th>Viewer</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>View dashboard</td>
				<td>Yes</td>
				<td>Yes</td>
				<td>Yes</td>
			</tr>
			<tr>
				<td>View users list</td>
				<td>Yes</td>
				<td>Yes</td>
				<td>Yes</td>
			</tr>
			<tr>
				<td>Create users</td>
				<td>Yes</td>
				<td>No</td>
				<td>No</td>
			</tr>
			<tr>
				<td>Edit users</td>
				<td>Yes</td>
				<td>No</td>
				<td>No</td>
			</tr>
			<tr>
				<td>Delete users</td>
				<td>Yes</td>
				<td>No</td>
				<td>No</td>
			</tr>
			<tr>
				<td>Manage roles</td>
				<td>Yes</td>
				<td>No</td>
				<td>No</td>
			</tr>
			<tr>
				<td>Manage content</td>
				<td>Yes</td>
				<td>Yes</td>
				<td>No</td>
			</tr>
			<tr>
				<td>View analytics</td>
				<td>Yes</td>
				<td>Yes</td>
				<td>No</td>
			</tr>
			<tr>
				<td>Manage settings</td>
				<td>Yes</td>
				<td>No</td>
				<td>No</td>
			</tr>
		</tbody>
	</table>

	<h3>Role Changes</h3>

	<p>
		Administrators can change a user's role via a dedicated role change dialog. A confirmation step
		is required, and the system enforces that at least one admin must remain at all times.
		Permission checks run inside the SvelteKit form actions to prevent unauthorized role
		modifications.
	</p>

	<hr />

	<h2>Export</h2>

	<p>
		User data can be exported in two formats using shared utility functions from
		<code>$lib/utils/export.ts</code>:
	</p>

	<ul>
		<li>
			<strong>CSV export</strong> — Properly escapes values containing commas, double quotes, and newlines.
			Fields are wrapped in quotes when necessary, following RFC 4180.
		</li>
		<li>
			<strong>JSON export</strong> — Pretty-printed with 2-space indentation for readability.
		</li>
	</ul>

	<p>Both formats trigger a browser download with an appropriately named file.</p>

	<hr />

	<h2>Svelte 5 Patterns Used</h2>

	<p>
		The user management module demonstrates several <strong>Svelte 5</strong> patterns throughout:
	</p>

	<ul>
		<li>
			<strong><code>$state</code></strong> — Reactive state for search query, current page number, and
			page size.
		</li>
		<li>
			<strong><code>$derived</code></strong> — Computed values for filtered user lists and paginated slices,
			automatically updating when dependencies change.
		</li>
		<li>
			<strong><code>use:enhance</code></strong> — SvelteKit's progressive enhancement directive on all
			forms, enabling non-blocking submissions without full page reloads.
		</li>
		<li>
			<strong><code>{"{@render}"}</code></strong> — Snippet-based rendering for table cell content, enabling
			reusable column templates.
		</li>
	</ul>

	<pre><code
			>{`// Svelte 5 reactive patterns in the users page
let search = $state('');
let currentPage = $state(1);
let pageSize = $state(10);

let filteredUsers = $derived(
  users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )
);

let paginatedUsers = $derived(
  filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize)
);`}</code
		></pre>

	<hr />

	<div
		class="not-prose rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950"
	>
		<h3 class="mb-2 text-lg font-semibold text-blue-900 dark:text-blue-100">
			Need More Than User Management?
		</h3>
		<p class="mb-4 text-blue-800 dark:text-blue-200">
			<strong>DashboardPack</strong> premium admin templates include full CRUD modules for
			<strong>Orders</strong>, <strong>Products</strong>, <strong>Customers</strong>,
			<strong>Invoices</strong>, and more — all built with Svelte 5 and SvelteKit, ready for
			production.
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
