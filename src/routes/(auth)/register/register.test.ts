import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createTestDb,
	createTestUser,
	createFormData,
	createMockRequest,
	type TestDb,
} from "#lib/server/db/test-utils.js";
import { accounts, users } from "#lib/server/db/schema.js";

let testDb: TestDb;
vi.mock("#lib/server/db/index.js", async () =>
	(await import("#lib/server/db/test-utils.js")).mockDbModule(() => testDb)
);

const { actions } = await import("./+page.server.js");

function registerEvent(username: string, overrides: Record<string, string> = {}) {
	return {
		request: createMockRequest(
			createFormData({
				name: "New User",
				email: `${username}@test.com`,
				username,
				password: "password123",
				...overrides,
			})
		),
	} as Parameters<typeof actions.default>[0];
}

async function register(username: string) {
	await expect(actions.default(registerEvent(username))).rejects.toMatchObject({
		status: 302,
		location: "/",
	});
}

describe("Registration", () => {
	beforeEach(() => {
		testDb = createTestDb();
	});

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

	it("stores an Argon2id hash on a credential account", async () => {
		await register("hashcheck");
		const account = testDb.select().from(accounts).get();
		expect(account?.providerId).toBe("credential");
		expect(account?.password).toMatch(/^\$argon2id\$/);
	});

	it("rejects a taken username", async () => {
		await register("taken");
		const result: any = await actions.default(registerEvent("taken", { email: "other@test.com" }));
		expect(result.status).toBeGreaterThanOrEqual(400);
		expect(testDb.select().from(users).all()).toHaveLength(1);
	});

	it("rejects passwords shorter than 8 characters", async () => {
		const result: any = await actions.default(registerEvent("shortpw", { password: "1234567" }));
		expect(result.status).toBe(400);
	});
});
