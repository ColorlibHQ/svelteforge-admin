import { describe, it, expect, vi } from "vitest";
import {
	createTestDb,
	createTestUser,
	createMockLocals,
	createFormData,
	createMockRequest,
} from "#lib/server/db/test-utils.js";

vi.mock("#lib/server/db/index.js", () => ({
	get db() {
		return (globalThis as any).__testDb;
	},
}));

vi.mock("#lib/server/auth.js", () => ({
	lucia: {
		invalidateSession: vi.fn(),
	},
}));

describe("Settings page server", () => {
	it("loads profile data and settings", async () => {
		const db = createTestDb();
		(globalThis as any).__testDb = db;
		const userId = await createTestUser(db, { role: "admin", name: "Admin User" });
		const locals = createMockLocals(userId, "admin");

		const { load } = await import("./+page.server.js");
		const result: any = await load({ locals } as any);

		expect(result.profile.name).toBe("Admin User");
		expect(result.isAdmin).toBe(true);
		expect(result.settings).toBeDefined();
		expect(result.sessions).toBeDefined();
		expect(result.notificationPrefs).toBeDefined();
	});

	it("updates profile successfully", async () => {
		const db = createTestDb();
		(globalThis as any).__testDb = db;
		const userId = await createTestUser(db, { name: "Old Name" });
		const locals = createMockLocals(userId);
		const formData = createFormData({ name: "New Name", email: "new@test.com" });
		const request = createMockRequest(formData);

		const { actions } = await import("./+page.server.js");
		const result: any = await actions.updateProfile({ request, locals } as any);

		expect(result.success).toBe(true);
		expect(result.action).toBe("profile");
	});

	it("rejects empty name on profile update", async () => {
		const db = createTestDb();
		(globalThis as any).__testDb = db;
		const userId = await createTestUser(db);
		const locals = createMockLocals(userId);
		const formData = createFormData({ name: "", email: "test@test.com" });
		const request = createMockRequest(formData);

		const { actions } = await import("./+page.server.js");
		const result: any = await actions.updateProfile({ request, locals } as any);

		expect(result.status).toBe(400);
	});

	it("changes password with valid credentials", async () => {
		const db = createTestDb();
		(globalThis as any).__testDb = db;
		const userId = await createTestUser(db);
		const locals = createMockLocals(userId);
		const formData = createFormData({
			currentPassword: "password123",
			newPassword: "newpassword123",
			confirmPassword: "newpassword123",
		});
		const request = createMockRequest(formData);

		const { actions } = await import("./+page.server.js");
		const result: any = await actions.changePassword({ request, locals } as any);

		expect(result.success).toBe(true);
		expect(result.action).toBe("password");
	});

	it("rejects mismatched passwords", async () => {
		const db = createTestDb();
		(globalThis as any).__testDb = db;
		const userId = await createTestUser(db);
		const locals = createMockLocals(userId);
		const formData = createFormData({
			currentPassword: "password123",
			newPassword: "newpassword123",
			confirmPassword: "different",
		});
		const request = createMockRequest(formData);

		const { actions } = await import("./+page.server.js");
		const result: any = await actions.changePassword({ request, locals } as any);

		expect(result.status).toBe(400);
	});

	it("saves notification preferences", async () => {
		const db = createTestDb();
		(globalThis as any).__testDb = db;
		const userId = await createTestUser(db);
		const locals = createMockLocals(userId);
		const formData = createFormData({
			notif_new_user: "on",
			notif_security_alert: "on",
		});
		const request = createMockRequest(formData);

		const { actions } = await import("./+page.server.js");
		const result: any = await actions.updateNotificationPrefs({ request, locals } as any);

		expect(result.success).toBe(true);
		expect(result.action).toBe("notifications");
	});
});
