import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	createTestDb,
	createTestUser,
	createMockLocals,
	createFormData,
	createMockRequest,
} from "#lib/server/db/test-utils.js";

let testDb: ReturnType<typeof createTestDb>;
let adminId: string;

vi.mock("#lib/server/db/index.js", () => ({
	get db() {
		return testDb;
	},
}));

const { load, actions } = await import("./+page.server.js");

describe("Roles page", () => {
	beforeEach(async () => {
		testDb = createTestDb();
		adminId = await createTestUser(testDb, {
			name: "Admin",
			email: "admin@test.com",
			username: "admin",
			role: "admin",
		});
	});

	describe("load", () => {
		it("returns roles with user counts", async () => {
			await createTestUser(testDb, {
				email: "editor@test.com",
				username: "editor",
				role: "editor",
			});

			const result: any = await load({
				locals: createMockLocals(adminId),
			} as any);

			expect(result.roles).toBeInstanceOf(Array);
			expect(result.roles.length).toBe(3);

			const adminRole = result.roles.find((r: any) => r.name === "admin");
			expect(adminRole).toBeDefined();
			expect(adminRole!.count).toBe(1);
			expect(adminRole!.permissions).toBeInstanceOf(Array);
		});
	});

	describe("actions.changeRole", () => {
		it.each(["viewer", "editor", null])("rejects role escalation by %s", async (role) => {
			const result = await actions.changeRole({
				request: createMockRequest(createFormData({ userId: adminId, newRole: "viewer" })),
				locals: role ? createMockLocals(adminId, role) : { user: null, session: null },
			} as any);
			expect(result).toHaveProperty("status", 403);
			const { users } = await import("#lib/server/db/schema.js");
			expect(testDb.select({ role: users.role }).from(users).get()?.role).toBe("admin");
		});

		it("prevents demotion of last admin", async () => {
			const formData = createFormData({
				userId: adminId,
				newRole: "viewer",
			});

			const result = await actions.changeRole({
				request: createMockRequest(formData),
				locals: createMockLocals(adminId),
			} as any);

			expect(result).toHaveProperty("status", 400);
		});

		it("allows role change for non-last-admin", async () => {
			const editorId = await createTestUser(testDb, {
				email: "editor@test.com",
				username: "editor",
				role: "editor",
			});

			const formData = createFormData({
				userId: editorId,
				newRole: "viewer",
			});

			const result = await actions.changeRole({
				request: createMockRequest(formData),
				locals: createMockLocals(adminId),
			} as any);

			expect(result).toEqual({ success: true });
		});
	});
});
