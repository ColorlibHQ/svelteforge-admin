import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, createTestUser, createMockLocals } from "$lib/server/db/test-utils.js";
import { pages } from "$lib/server/db/schema.js";
import { generateId } from "$lib/server/id.js";

let testDb: ReturnType<typeof createTestDb>;
let adminId: string;

vi.mock("$lib/server/db/index.js", () => ({
	get db() {
		return testDb;
	},
}));

const { load } = await import("./+page.server.js");

describe("Analytics page", () => {
	beforeEach(async () => {
		testDb = createTestDb();
		adminId = await createTestUser(testDb, {
			name: "Admin",
			email: "admin@test.com",
			username: "admin",
			role: "admin",
		});

		// Add a test page
		await testDb.insert(pages).values({
			id: generateId(10),
			title: "Test Page",
			slug: "test-page",
			content: "Test content",
			template: "default",
			status: "published",
			authorId: adminId,
			createdAt: new Date(),
			updatedAt: new Date(),
			publishedAt: new Date(),
		});
	});

	it("returns all expected data shapes", async () => {
		const result: any = await load({
			locals: createMockLocals(adminId),
		} as any);

		expect(result).toHaveProperty("signupsPerMonth");
		expect(result).toHaveProperty("pagesPerMonth");
		expect(result).toHaveProperty("pagesByStatus");
		expect(result).toHaveProperty("notificationsByType");
		expect(result).toHaveProperty("topAuthors");

		expect(result.signupsPerMonth).toBeInstanceOf(Array);
		expect(result.pagesPerMonth).toBeInstanceOf(Array);
		expect(result.pagesByStatus).toBeInstanceOf(Array);
		expect(result.topAuthors).toBeInstanceOf(Array);
	});

	it("returns pagesByStatus with correct counts", async () => {
		const result: any = await load({
			locals: createMockLocals(adminId),
		} as any);

		const published = result.pagesByStatus.find((s: any) => s.status === "published");
		expect(published).toBeDefined();
		expect(published!.count).toBe(1);
	});

	it("returns topAuthors with page counts", async () => {
		const result: any = await load({
			locals: createMockLocals(adminId),
		} as any);

		expect(result.topAuthors.length).toBeGreaterThan(0);
		expect(result.topAuthors[0]).toHaveProperty("name");
		expect(result.topAuthors[0]).toHaveProperty("pageCount");
		expect(result.topAuthors[0].pageCount).toBe(1);
	});
});
