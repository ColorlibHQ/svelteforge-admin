import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { db } from "./db/index.js";
import { sessions, users } from "./db/schema.js";
import { eq } from "drizzle-orm";
import { dev } from "$app/environment";
import type { Cookies } from "@sveltejs/kit";
import type { User, Session } from "./db/schema.js";

export { generateId } from "./id.js";

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_REFRESH_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000; // 15 days

export const SESSION_COOKIE_NAME = "auth_session";

export type SessionUser = Pick<User, "id" | "email" | "username" | "name" | "role" | "avatarUrl">;

export type SessionValidationResult =
	{ session: Session; user: SessionUser } | { session: null; user: null };

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

function hashToken(token: string): string {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createSession(
	token: string,
	userId: string,
	metadata?: { userAgent?: string | null; ipAddress?: string | null }
): Promise<Session> {
	const sessionId = hashToken(token);
	const expiresAt = Date.now() + SESSION_LIFETIME_MS;

	const session: Session = {
		id: sessionId,
		userId,
		expiresAt,
		userAgent: metadata?.userAgent ?? null,
		ipAddress: metadata?.ipAddress ?? null,
		createdAt: new Date(),
	};

	await db.insert(sessions).values(session);

	return session;
}

export async function validateSession(token: string): Promise<SessionValidationResult> {
	const sessionId = hashToken(token);

	const result = await db
		.select({
			session: sessions,
			user: {
				id: users.id,
				email: users.email,
				username: users.username,
				name: users.name,
				role: users.role,
				avatarUrl: users.avatarUrl,
			},
		})
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId));

	if (result.length === 0) {
		return { session: null, user: null };
	}

	const { session, user } = result[0];

	// Expired — clean up and reject
	if (session.expiresAt <= Date.now()) {
		await db.delete(sessions).where(eq(sessions.id, sessionId));
		return { session: null, user: null };
	}

	// Auto-extend if within refresh threshold
	if (session.expiresAt - Date.now() < SESSION_REFRESH_THRESHOLD_MS) {
		session.expiresAt = Date.now() + SESSION_LIFETIME_MS;
		await db
			.update(sessions)
			.set({ expiresAt: session.expiresAt })
			.where(eq(sessions.id, sessionId));
	}

	return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export function setSessionCookie(cookies: Cookies, token: string, expiresAt: number): void {
	cookies.set(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: "lax",
		secure: !dev,
		path: "/",
		expires: new Date(expiresAt),
	});
}

export function deleteSessionCookie(cookies: Cookies): void {
	cookies.set(SESSION_COOKIE_NAME, "", {
		httpOnly: true,
		sameSite: "lax",
		secure: !dev,
		path: "/",
		maxAge: 0,
	});
}
