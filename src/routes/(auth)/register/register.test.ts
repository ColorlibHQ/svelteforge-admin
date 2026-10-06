import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createTestDb,
	createTestUser,
	createFormData,
	createMockRequest,
} from "#lib/server/db/test-utils.js";
import { users } from "#lib/server/db/schema.js";

let testDb: ReturnType<typeof createTestDb>;
vi.mock("#lib/server/db/index.js", () => ({
	get db() {
		return testDb;
	},
}));
vi.mock("#lib/server/auth.js", async () => ({
	generateId: (await import("#lib/server/id.js")).generateId,
	generateSessionToken: () => "test-token",
	createSession: vi.fn(async () => ({ expiresAt: Date.now() + 86400000 })),
	setSessionCookie: vi.fn(),
}));

const { actions } = await import("./+page.server.js");

describe("Registration permissions", () => {
	beforeEach(() => {
		testDb = createTestDb();
	});
	afterEach(() => {
		testDb.$client.close();
	});

	async function register(username: string) {
		const event = {
			request: createMockRequest(
				createFormData({
					name: "New User",
					email: `${username}@test.com`,
					username,
					password: "password123",
				})
			),
			cookies: {},
			getClientAddress: () => "127.0.0.1",
		} as Parameters<typeof actions.default>[0];
		await expect(actions.default(event)).rejects.toMatchObject({ status: 302, location: "/" });
	}

	it("gives admin access only to the first registered user", async () => {
		await register("firstuser");
		await register("seconduser");
		expect(testDb.select({ username: users.username, role: users.role }).from(users).all()).toEqual(
			[
				{ username: "firstuser", role: "admin" },
				{ username: "seconduser", role: "viewer" },
			]
		);
	});

	it("does not grant admin access when an existing account is a viewer", async () => {
		await createTestUser(testDb, { role: "viewer" });
		await register("newuser");
		expect(
			testDb
				.select({ role: users.role })
				.from(users)
				.all()
				.map((user) => user.role)
		).toEqual(["viewer", "viewer"]);
	});
});
