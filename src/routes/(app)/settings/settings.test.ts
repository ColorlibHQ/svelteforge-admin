import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import {
	createTestDb,
	createTestUser,
	createMockLocals,
	createFormData,
	createMockRequest,
	createAuthHeaders,
	type TestDb,
} from "#lib/server/db/test-utils.js";
import { sessions, users } from "#lib/server/db/schema.js";

let testDb: TestDb;
vi.mock("#lib/server/db/index.js", async () =>
	(await import("#lib/server/db/test-utils.js")).mockDbModule(() => testDb)
);

const { load, actions } = await import("./+page.server.js");
const { auth } = await import("#lib/server/auth.js");

async function call<K extends keyof typeof actions>(
	action: K,
	userId: string,
	entries: Record<string, string>,
	headers?: Headers
) {
	const request = createMockRequest(
		createFormData(entries),
		headers ?? (await createAuthHeaders(userId))
	);
	return (await actions[action]({ request, locals: createMockLocals(userId) } as any)) as any;
}

describe("Settings page server", () => {
	beforeEach(() => {
		testDb = createTestDb();
	});
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("loads profile data, settings and active sessions", async () => {
		const userId = await createTestUser(testDb, { role: "admin", name: "Admin User" });
		await createAuthHeaders(userId);

		const result: any = await load({ locals: createMockLocals(userId, "admin") } as any);

		expect(result.profile.name).toBe("Admin User");
		expect(result.isAdmin).toBe(true);
		expect(result.settings).toBeDefined();
		expect(result.sessions).toHaveLength(1);
		expect(result.sessions[0]).not.toHaveProperty("token");
		expect(result.notificationPrefs).toBeDefined();
	});

	it("updates name and email", async () => {
		const userId = await createTestUser(testDb, { name: "Old Name" });

		const result = await call("updateProfile", userId, {
			name: "New Name",
			email: "New@Test.com",
		});

		expect(result).toMatchObject({ success: true, action: "profile", emailPending: false });
		const row = testDb.select().from(users).where(eq(users.id, userId)).get();
		expect(row).toMatchObject({ name: "New Name", email: "new@test.com" });
	});

	it("rejects empty name on profile update", async () => {
		const userId = await createTestUser(testDb);
		const result = await call("updateProfile", userId, { name: "", email: "test@test.com" });
		expect(result.status).toBe(400);
	});

	it("changes password and the new password signs in", async () => {
		const userId = await createTestUser(testDb, { username: "pwuser" });

		const result = await call("changePassword", userId, {
			currentPassword: "password123",
			newPassword: "newpassword123",
			confirmPassword: "newpassword123",
		});
		expect(result).toEqual({ success: true, action: "password" });

		await expect(
			auth.api.signInUsername({ body: { username: "pwuser", password: "newpassword123" } })
		).resolves.toHaveProperty("token");
	});

	it("rejects a wrong current password", async () => {
		const userId = await createTestUser(testDb);
		const result = await call("changePassword", userId, {
			currentPassword: "wrong-password",
			newPassword: "newpassword123",
			confirmPassword: "newpassword123",
		});
		expect(result.status).toBe(400);
		expect(result.data.message).toBe("Current password is incorrect");
	});

	it("rejects mismatched passwords", async () => {
		const userId = await createTestUser(testDb);
		const result = await call("changePassword", userId, {
			currentPassword: "password123",
			newPassword: "newpassword123",
			confirmPassword: "different",
		});
		expect(result.status).toBe(400);
	});

	it("revokes another session of the same user only", async () => {
		const userId = await createTestUser(testDb);
		const otherUserId = await createTestUser(testDb);
		const current = await createAuthHeaders(userId);
		await createAuthHeaders(userId);
		await createAuthHeaders(otherUserId);

		const mine = testDb.select().from(sessions).where(eq(sessions.userId, userId)).all();
		const theirs = testDb.select().from(sessions).where(eq(sessions.userId, otherUserId)).get()!;
		const currentRow = (await auth.api.getSession({ headers: current }))!.session;
		const other = mine.find((s) => s.id !== currentRow.id)!;

		const locals = { ...createMockLocals(userId), session: { id: currentRow.id } };
		const revokeTheirs: any = await actions.revokeSession({
			request: createMockRequest(createFormData({ sessionId: theirs.id }), current),
			locals,
		} as any);
		expect(revokeTheirs.status).toBe(404);

		const revokeMine: any = await actions.revokeSession({
			request: createMockRequest(createFormData({ sessionId: other.id }), current),
			locals,
		} as any);
		expect(revokeMine).toEqual({ success: true, action: "session" });
		expect(
			testDb
				.select()
				.from(sessions)
				.all()
				.map((s) => s.id)
		).toEqual(expect.not.arrayContaining([other.id]));
	});

	it("blocks the shared demo account from changing itself in demo mode", async () => {
		vi.stubEnv("DEMO_MODE", "true");
		const userId = await createTestUser(testDb, { username: "demo" });

		const result = await call("changePassword", userId, {
			currentPassword: "password123",
			newPassword: "newpassword123",
			confirmPassword: "newpassword123",
		});
		expect(result.status).toBe(403);

		// The same guard covers the raw Better Auth endpoint.
		await expect(
			auth.api.updateUser({ body: { name: "Hacked" }, headers: await createAuthHeaders(userId) })
		).rejects.toMatchObject({ statusCode: 403 });
	});

	it("saves notification preferences", async () => {
		const userId = await createTestUser(testDb);
		const result = await call("updateNotificationPrefs", userId, {
			notif_new_user: "on",
			notif_security_alert: "on",
		});
		expect(result).toEqual({ success: true, action: "notifications" });
	});
});
