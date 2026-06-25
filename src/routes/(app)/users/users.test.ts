import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	createTestDb,
	createTestUser,
	createMockLocals,
	createFormData,
	createMockRequest,
} from "$lib/server/db/test-utils.js";

let testDb: ReturnType<typeof createTestDb>;
let adminId: string;

vi.mock("$lib/server/db/index.js", () => ({
	get db() {
		return testDb;
	},
}));

const { load, actions } = await import("./+page.server.js");

describe("Users page", () => {
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
		it("returns users array and currentUserId", async () => {
			const result: any = await load({
				locals: createMockLocals(adminId),
			} as any);

			expect(result.users).toBeInstanceOf(Array);
			expect(result.users.length).toBe(1);
			expect(result.users[0]).toHaveProperty("id");
			expect(result.users[0]).toHaveProperty("name");
			expect(result.users[0]).toHaveProperty("email");
			expect(result.users[0]).toHaveProperty("role");
			expect(result.currentUserId).toBe(adminId);
		});
	});

	describe("actions.create", () => {
		it("creates a new user", async () => {
			const formData = createFormData({
				name: "New User",
				email: "new@test.com",
				username: "newuser",
				password: "password123",
				role: "viewer",
			});

			const result = await actions.create({
				request: createMockRequest(formData),
				locals: createMockLocals(adminId),
			} as any);

			expect(result).toEqual({ success: true });

			const data: any = await load({
				locals: createMockLocals(adminId),
			} as any);
			expect(data.users.length).toBe(2);
		});

		it("rejects invalid username", async () => {
			const formData = createFormData({
				name: "Bad User",
				email: "bad@test.com",
				username: "AB", // too short
				password: "password123",
				role: "viewer",
			});

			const result = await actions.create({
				request: createMockRequest(formData),
				locals: createMockLocals(adminId),
			} as any);

			expect(result).toHaveProperty("status", 400);
		});

		it("rejects duplicate username", async () => {
			await createTestUser(testDb, {
				email: "existing@test.com",
				username: "taken",
				role: "viewer",
			});

			const formData = createFormData({
				name: "Duplicate",
				email: "dup@test.com",
				username: "taken",
				password: "password123",
				role: "viewer",
			});

			const result = await actions.create({
				request: createMockRequest(formData),
				locals: createMockLocals(adminId),
			} as any);

			expect(result).toHaveProperty("status", 400);
		});
	});

	describe("actions.delete", () => {
		it("prevents self-deletion", async () => {
			const formData = createFormData({ id: adminId });

			const result = await actions.delete({
				request: createMockRequest(formData),
				locals: createMockLocals(adminId),
			} as any);

			expect(result).toHaveProperty("status", 400);
			expect(result).toHaveProperty("data");
		});

		it("denies non-admins from deleting users", async () => {
			const viewerId = await createTestUser(testDb, {
				email: "viewer@test.com",
				username: "viewer",
				role: "viewer",
			});

			// /users mutations are gated on the admin role (requireAdmin), so a
			// viewer is rejected with 403 before reaching any deletion guard.
			const formData = createFormData({ id: adminId });

			const result = await actions.delete({
				request: createMockRequest(formData),
				locals: createMockLocals(viewerId, "viewer"),
			} as any);

			expect(result).toHaveProperty("status", 403);
		});

		it("allows deletion of non-admin users", async () => {
			const viewerId = await createTestUser(testDb, {
				email: "viewer@test.com",
				username: "viewer",
				role: "viewer",
			});

			const formData = createFormData({ id: viewerId });

			const result = await actions.delete({
				request: createMockRequest(formData),
				locals: createMockLocals(adminId),
			} as any);

			expect(result).toEqual({ success: true });
		});
	});

	describe("actions.update", () => {
		it("prevents demotion of last admin", async () => {
			const formData = createFormData({
				id: adminId,
				name: "Admin",
				email: "admin@test.com",
				role: "viewer",
			});

			const result = await actions.update({
				request: createMockRequest(formData),
				locals: createMockLocals(adminId),
			} as any);

			expect(result).toHaveProperty("status", 400);
		});

		it("allows demotion when multiple admins exist", async () => {
			const admin2Id = await createTestUser(testDb, {
				email: "admin2@test.com",
				username: "admin2",
				role: "admin",
			});

			const formData = createFormData({
				id: adminId,
				name: "Admin",
				email: "admin@test.com",
				role: "editor",
			});

			const result = await actions.update({
				request: createMockRequest(formData),
				locals: createMockLocals(admin2Id),
			} as any);

			expect(result).toEqual({ success: true });
		});
	});
});
