import { describe, it, expect, vi } from "vitest";
import {
	createTestDb,
	createTestUser,
	createMockLocals,
	createFormData,
	createMockRequest,
} from "#lib/server/db/test-utils.js";
import { pages } from "#lib/server/db/schema.js";
import { generateId } from "#lib/server/id.js";

vi.mock("#lib/server/db/index.js", () => ({
	get db() {
		return (globalThis as any).__testDb;
	},
}));

async function seedPage(db: any, authorId: string, overrides: Partial<any> = {}) {
	const id = overrides.id ?? generateId(10);
	await db.insert(pages).values({
		id,
		title: overrides.title ?? "Test Page",
		slug: overrides.slug ?? `test-${id.slice(0, 8)}`,
		content: overrides.content ?? "Test content",
		template: "default",
		status: overrides.status ?? "draft",
		authorId,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
	return id;
}

describe("Content page server", () => {
	it("prevents viewers from creating, editing, or deleting content", async () => {
		const db = createTestDb();
		(globalThis as any).__testDb = db;
		const userId = await createTestUser(db, { role: "viewer" });
		const pageId = await seedPage(db, userId);
		const event = {
			locals: createMockLocals(userId, "viewer"),
			params: { id: pageId },
			request: createMockRequest(createFormData({ id: pageId, ids: pageId })),
		} as any;
		const { actions } = await import("./+page.server.js");
		const create = (await import("./new/+page.server.js")).actions.default;
		const edit = (await import("./[id]/edit/+page.server.js")).actions.default;
		for (const action of [actions.delete, actions.bulkDelete, create, edit]) {
			expect(await action(event)).toHaveProperty("status", 403);
		}
		expect(db.select().from(pages).all()).toHaveLength(1);
	});

	it("allows editors to delete only their own pages, including bulk requests", async () => {
		const db = createTestDb();
		(globalThis as any).__testDb = db;
		const editorId = await createTestUser(db, { role: "editor" });
		const otherId = await createTestUser(db);
		const ownPage = await seedPage(db, editorId);
		const otherPage = await seedPage(db, otherId);
		const { actions } = await import("./+page.server.js");
		const locals = createMockLocals(editorId, "editor");
		expect(
			await actions.delete({
				locals,
				request: createMockRequest(createFormData({ id: otherPage })),
			} as any)
		).toHaveProperty("status", 403);
		expect(
			await actions.bulkDelete({
				locals,
				request: createMockRequest(createFormData({ ids: `${ownPage},${otherPage}` })),
			} as any)
		).toHaveProperty("status", 403);
		expect(db.select().from(pages).all()).toHaveLength(2);
		expect(
			await actions.delete({
				locals,
				request: createMockRequest(createFormData({ id: ownPage })),
			} as any)
		).toEqual({ success: true });
		expect(db.select().from(pages).all()).toHaveLength(1);
	});

	it("loads pages for authenticated user", async () => {
		const db = createTestDb();
		(globalThis as any).__testDb = db;
		const userId = await createTestUser(db, { role: "admin" });
		await seedPage(db, userId, { title: "My Page" });
		const locals = createMockLocals(userId);

		const { load } = await import("./+page.server.js");
		const result: any = await load({ locals } as any);

		expect(result.pages).toHaveLength(1);
		expect(result.pages[0].title).toBe("My Page");
	});

	it("loads multiple pages", async () => {
		const db = createTestDb();
		(globalThis as any).__testDb = db;
		const userId = await createTestUser(db, { role: "admin" });
		await seedPage(db, userId, { title: "Page 1", slug: "page-1" });
		await seedPage(db, userId, { title: "Page 2", slug: "page-2" });
		const locals = createMockLocals(userId);

		const { load } = await import("./+page.server.js");
		const result: any = await load({ locals } as any);

		expect(result.pages).toHaveLength(2);
	});

	it("delete with nonexistent id returns success", async () => {
		const db = createTestDb();
		(globalThis as any).__testDb = db;
		const userId = await createTestUser(db, { role: "admin" });
		const locals = createMockLocals(userId);
		const formData = createFormData({ id: "nonexistent-id" });
		const request = createMockRequest(formData);

		const { actions } = await import("./+page.server.js");
		const result: any = await actions.delete({ request, locals } as any);

		expect(result.success).toBe(true);
	});

	it("deletes a page", async () => {
		const db = createTestDb();
		(globalThis as any).__testDb = db;
		const userId = await createTestUser(db, { role: "admin" });
		const pageId = await seedPage(db, userId);
		const locals = createMockLocals(userId);
		const formData = createFormData({ id: pageId });
		const request = createMockRequest(formData);

		const { actions } = await import("./+page.server.js");
		const result: any = await actions.delete({ request, locals } as any);

		expect(result.success).toBe(true);
	});

	it("bulk deletes pages", async () => {
		const db = createTestDb();
		(globalThis as any).__testDb = db;
		const userId = await createTestUser(db, { role: "admin" });
		const p1 = await seedPage(db, userId, { slug: "page-1" });
		const p2 = await seedPage(db, userId, { slug: "page-2" });
		const locals = createMockLocals(userId);
		const formData = createFormData({ ids: `${p1},${p2}` });
		const request = createMockRequest(formData);

		const { actions } = await import("./+page.server.js");
		const result: any = await actions.bulkDelete({ request, locals } as any);

		expect(result.success).toBe(true);
	});
});
