import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { admin, username } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { and, eq, ne, sql } from "drizzle-orm";
import { getRequestEvent } from "$app/server";
import { building, dev } from "$app/env";
import {
	ORIGIN,
	BETTER_AUTH_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
} from "$app/env/private";

import { db } from "./db/index.js";
import * as schema from "./db/schema.js";
import type { Role } from "./db/schema.js";
import { sendAuthEmail } from "./email.js";
import { hashPassword, verifyPassword } from "./password.js";
import { ac, roles } from "../permissions.js";

const DAY_SECONDS = 60 * 60 * 24;

export const USERNAME_PATTERN = /^[a-z0-9_-]+$/;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 31;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 255;

if (!dev && !building && !BETTER_AUTH_SECRET && process.env.NODE_ENV !== "test") {
	throw new Error(
		"BETTER_AUTH_SECRET is not set. Generate one with `openssl rand -base64 32` and add it to the server environment."
	);
}

// OAuth providers are enabled only when both credentials are present.
// Redirect URI to register with each provider: {ORIGIN}/api/auth/callback/{provider}
const socialProviders = {
	...(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
		? { google: { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET } }
		: {}),
	...(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET
		? { github: { clientId: GITHUB_CLIENT_ID, clientSecret: GITHUB_CLIENT_SECRET } }
		: {}),
};

export type OAuthProvider = "google" | "github";

export function getEnabledProviders(): OAuthProvider[] {
	return Object.keys(socialProviders) as OAuthProvider[];
}

// Demo mode: the public `demo` account is shared by every visitor, so it must not be
// able to rename itself, change its email or rotate its password (see CLAUDE.md).
const DEMO_PROTECTED_PATHS = new Set([
	"/update-user",
	"/change-email",
	"/change-password",
	"/delete-user",
]);

function isDemoMode() {
	return process.env.DEMO_MODE === "true";
}

function countAdmins(excludingUserId?: string) {
	const [row] = db
		.select({ count: sql<number>`count(*)` })
		.from(schema.users)
		.where(
			excludingUserId
				? and(eq(schema.users.role, "admin"), ne(schema.users.id, excludingUserId))
				: eq(schema.users.role, "admin")
		)
		.all();
	return row?.count ?? 0;
}

function getRole(userId: string) {
	return db
		.select({ role: schema.users.role })
		.from(schema.users)
		.where(eq(schema.users.id, userId))
		.get()?.role;
}

/** Turn an email/name into a free username matching USERNAME_PATTERN. */
function deriveUsername(seed: string): string {
	let base = seed
		.toLowerCase()
		.replace(/[^a-z0-9_-]/g, "")
		.slice(0, USERNAME_MAX - 5);
	if (base.length < USERNAME_MIN) base = "user";
	let candidate = base;
	for (let attempt = 0; attempt < 20; attempt++) {
		const taken = db
			.select({ id: schema.users.id })
			.from(schema.users)
			.where(eq(schema.users.username, candidate))
			.get();
		if (!taken) return candidate;
		candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
	}
	return `${base}-${crypto.randomUUID().slice(0, 4)}`;
}

export const auth = betterAuth({
	appName: "SvelteForge Admin",
	baseURL: ORIGIN || "http://localhost:5173",
	// `vite build` imports this module to prerender the docs, where no secret is needed
	// (and CI/Docker builds have none). It never serves requests, so a placeholder is safe;
	// the runtime check above refuses to start production without the real secret.
	secret:
		BETTER_AUTH_SECRET || (building ? "build-time-placeholder-never-used-at-runtime" : undefined),

	database: drizzleAdapter(db, { provider: "sqlite", schema, usePlural: true }),

	user: {
		// Better Auth's `image` field is stored in the existing `avatar_url` column.
		fields: { image: "avatarUrl" },
		changeEmail: {
			enabled: true,
			// No email provider ships with the template, so unverified accounts change
			// email immediately. Verified accounts (e.g. OAuth) confirm via sendAuthEmail.
			updateEmailWithoutVerification: true,
			sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
				await sendAuthEmail({
					to: user.email,
					subject: "Confirm your email change",
					text: `Approve changing your SvelteForge email to ${newEmail}.`,
					url,
				});
			},
		},
	},

	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			await sendAuthEmail({
				to: user.email,
				subject: "Verify your email address",
				text: "Confirm this email address for your SvelteForge account.",
				url,
			});
		},
	},

	verification: {
		// Store reset/confirmation tokens as SHA-256 hashes, so a leaked database can't be
		// used to reset someone's password (Better Auth's default is plain text).
		storeIdentifier: "hashed",
	},

	session: {
		// 30-day sessions that slide forward once less than 15 days remain.
		expiresIn: 30 * DAY_SECONDS,
		updateAge: 15 * DAY_SECONDS,
	},

	emailAndPassword: {
		enabled: true,
		minPasswordLength: PASSWORD_MIN,
		maxPasswordLength: PASSWORD_MAX,
		password: { hash: hashPassword, verify: verifyPassword },
		resetPasswordTokenExpiresIn: 60 * 60,
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, url }) => {
			await sendAuthEmail({
				to: user.email,
				subject: "Reset your password",
				text: "Use this link to choose a new password. It expires in one hour.",
				url,
			});
		},
	},

	socialProviders,

	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					if (typeof user.name !== "string" || user.name.length < 1 || user.name.length > 100) {
						throw new APIError("BAD_REQUEST", { message: "Name is required (1-100 characters)" });
					}
					// OAuth sign-ups arrive without a username; derive one from the email.
					if (!user.username) {
						const username = deriveUsername(user.email.split("@")[0]);
						return { data: { ...user, username, displayUsername: username } };
					}
				},
				after: async (user) => {
					// The first account on a fresh install becomes the admin. A single UPDATE
					// keeps this atomic even if two people register at the same moment.
					db.run(sql`
						UPDATE users SET role = 'admin'
						WHERE id = ${user.id}
							AND id = (SELECT id FROM users ORDER BY rowid LIMIT 1)
							AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin')
					`);
				},
			},
		},
	},

	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			if (isDemoMode() && DEMO_PROTECTED_PATHS.has(ctx.path)) {
				const session = await getSessionFromCtx(ctx);
				if (session?.user.username === "demo") {
					throw new APIError("FORBIDDEN", {
						message: "The shared demo account cannot be modified",
					});
				}
			}

			// Keep at least one admin, whichever way a role change or deletion arrives.
			const body = (ctx.body ?? {}) as { userId?: string; role?: string; data?: { role?: string } };
			const newRole = ctx.path === "/admin/set-role" ? body.role : body.data?.role;
			if (
				(ctx.path === "/admin/set-role" || ctx.path === "/admin/update-user") &&
				body.userId &&
				newRole !== undefined &&
				newRole !== "admin" &&
				getRole(body.userId) === "admin" &&
				countAdmins(body.userId) === 0
			) {
				throw new APIError("BAD_REQUEST", { message: "Cannot demote the last admin" });
			}

			if (ctx.path === "/admin/remove-user" && body.userId) {
				if (getRole(body.userId) === "admin" && countAdmins(body.userId) === 0) {
					throw new APIError("BAD_REQUEST", { message: "Cannot delete the last admin" });
				}
				// Content keeps its author; refuse before Better Auth deletes the user's sessions.
				const authored = db
					.select({ id: schema.pages.id })
					.from(schema.pages)
					.where(eq(schema.pages.authorId, body.userId))
					.get();
				if (authored) {
					throw new APIError("BAD_REQUEST", {
						message: "Cannot delete user — reassign or delete their content first",
					});
				}
			}
		}),
	},

	plugins: [
		username({
			minUsernameLength: USERNAME_MIN,
			maxUsernameLength: USERNAME_MAX,
			usernameValidator: (value) => USERNAME_PATTERN.test(value),
			validationOrder: { username: "post-normalization" },
		}),
		admin({
			ac,
			roles,
			defaultRole: "viewer",
			adminRoles: ["admin"],
		}),
		// Must stay last: forwards Set-Cookie from auth.api calls in actions/load to SvelteKit.
		sveltekitCookies(getRequestEvent),
	],
});

// The username plugin types `username` as optional and the admin plugin types `role` as
// string; the users table guarantees both (NOT NULL, role enum), so narrow them here.
export type SessionUser = Omit<typeof auth.$Infer.Session.user, "username" | "role"> & {
	username: string;
	role: Role;
};
export type Session = typeof auth.$Infer.Session.session;
