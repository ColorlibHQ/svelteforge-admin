import { hash, verify } from "@node-rs/argon2";

// Argon2id with the OWASP-recommended minimum (19 MiB, 2 iterations, 1 lane).
// Better Auth defaults to scrypt; SvelteForge keeps Argon2id so password hashes
// created before v2.0 keep working and seeds/migrations can hash without the
// auth instance. Plain module, no SvelteKit imports — safe for scripts.
const ARGON2_OPTIONS = {
	memoryCost: 19456,
	timeCost: 2,
	outputLen: 32,
	parallelism: 1,
} as const;

export function hashPassword(password: string): Promise<string> {
	return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword({
	hash: passwordHash,
	password,
}: {
	hash: string;
	password: string;
}): Promise<boolean> {
	try {
		return await verify(passwordHash, password, ARGON2_OPTIONS);
	} catch {
		// Malformed hash (e.g. a row written by another algorithm) — treat as a mismatch.
		return false;
	}
}
