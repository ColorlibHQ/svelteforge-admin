import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestDb, createTestUser, createMockLocals } from "$lib/server/db/test-utils.js";

let testDb: ReturnType<typeof createTestDb>;
let adminId: string;

vi.mock("$lib/server/db/index.js", () => ({
	get db() {
		return testDb;
	},
}));

const { load } = await import("./+page.server.js");

describe("Dashboard page", () => {
	beforeEach(async () => {
		testDb = createTestDb();
		adminId = await createTestUser(testDb, {
			name: "Admin",
			email: "admin@test.com",
			username: "admin",
			role: "admin",
		});
	});

	it("returns stats with correct shape", async () => {
		const result: any = await load({
			locals: createMockLocals(adminId),
		} as any);

		expect(result.stats).toHaveProperty("totalUsers");
		expect(result.stats).toHaveProperty("activeSessions");
		expect(result.stats).toHaveProperty("totalPages");
		expect(result.stats).toHaveProperty("unreadNotifications");
		expect(typeof result.stats.totalUsers).toBe("number");
		expect(result.stats.totalUsers).toBe(1);
	});

	it("returns monthlySignups array", async () => {
		const result: any = await load({
			locals: createMockLocals(adminId),
		} as any);

		expect(result.monthlySignups).toBeInstanceOf(Array);
		expect(result.monthlySignups.length).toBeGreaterThan(0);
		expect(result.monthlySignups[0]).toHaveProperty("month");
		expect(result.monthlySignups[0]).toHaveProperty("count");
	});

	it("returns recentActivity array", async () => {
		const result: any = await load({
			locals: createMockLocals(adminId),
		} as any);

		expect(result.recentActivity).toBeInstanceOf(Array);
	});
});
