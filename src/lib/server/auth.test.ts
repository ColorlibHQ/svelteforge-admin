import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import {
	createAuthHeaders,
	createTestDb,
	createTestUser,
	type TestDb,
} from "#lib/server/db/test-utils.js";
import { pages, users } from "#lib/server/db/schema.js";
import { hashPassword, verifyPassword } from "#lib/server/password.js";

let testDb: TestDb;
vi.mock("#lib/server/db/index.js", async () =>
	(await import("#lib/server/db/test-utils.js")).mockDbModule(() => testDb)
);

const { auth } = await import("./auth.js");

describe("Better Auth configuration", () => {
	let adminId: string;
	let adminHeaders: Headers;

	beforeEach(async () => {
		testDb = createTestDb();
		adminId = await createTestUser(testDb, { username: "admin", role: "admin" });
		adminHeaders = await createAuthHeaders(adminId);
	});

	it("signs in with a pre-2.0 Argon2id hash", async () => {
		const result = await auth.api.signInUsername({
			body: { username: "admin", password: "password123" },
		});
		expect(result?.user.id).toBe(adminId);
	});

	it("exposes username and role on the session", async () => {
		const session = await auth.api.getSession({ headers: adminHeaders });
		expect(session?.user).toMatchObject({ username: "admin", role: "admin" });
	});

	it("blocks admin endpoints for non-admin roles", async () => {
		const editorId = await createTestUser(testDb, { role: "editor" });
		await expect(
			auth.api.listUsers({ query: {}, headers: await createAuthHeaders(editorId) })
		).rejects.toMatchObject({ statusCode: 403 });
	});

	it("does not grant impersonation to admins in the free edition", async () => {
		const viewerId = await createTestUser(testDb, { role: "viewer" });
		await expect(
			auth.api.impersonateUser({ body: { userId: viewerId }, headers: adminHeaders })
		).rejects.toMatchObject({ statusCode: 403 });
	});

	it("refuses to demote the last admin through the raw endpoint", async () => {
		await expect(
			auth.api.setRole({ body: { userId: adminId, role: "viewer" }, headers: adminHeaders })
		).rejects.toMatchObject({ statusCode: 400 });
		expect(testDb.select().from(users).where(eq(users.id, adminId)).get()?.role).toBe("admin");
	});

	it("refuses to delete a user who authored content, before touching their sessions", async () => {
		const authorId = await createTestUser(testDb, { role: "editor" });
		await createAuthHeaders(authorId);
		testDb.insert(pages).values({ id: "p1", title: "Hello", slug: "hello", authorId }).run();

		await expect(
			auth.api.removeUser({ body: { userId: authorId }, headers: adminHeaders })
		).rejects.toMatchObject({ statusCode: 400 });
		const sessions = await auth.api.listUserSessions({
			body: { userId: authorId },
			headers: adminHeaders,
		});
		expect(sessions.sessions).toHaveLength(1);
	});

	it("derives a unique username when none is supplied (OAuth sign-ups)", async () => {
		await createTestUser(testDb, { username: "jane" });
		const { user } = await auth.api.createUser({
			body: { name: "Jane", email: "Jane@example.com", password: "password123" },
			headers: adminHeaders,
		});
		const row = testDb.select().from(users).where(eq(users.id, user.id)).get();
		expect(row?.username).toMatch(/^jane-[a-z0-9]{4}$/);
		expect(row?.role).toBe("viewer");
	});
});

describe("password hashing", () => {
	it("round-trips and rejects malformed hashes", async () => {
		const hash = await hashPassword("correct horse");
		expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
		await expect(verifyPassword({ hash, password: "correct horse" })).resolves.toBe(true);
		await expect(verifyPassword({ hash, password: "wrong" })).resolves.toBe(false);
		await expect(verifyPassword({ hash: "scrypt:abc", password: "x" })).resolves.toBe(false);
	});
});
