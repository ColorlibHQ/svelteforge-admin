import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

/**
 * Random ID for application rows (pages, notifications, seed data): `length` bytes of
 * CSPRNG output encoded as lowercase base32 without padding. Auth tables use Better
 * Auth's own ID generator.
 */
export function generateId(length: number = 15): string {
	const bytes = randomBytes(length);
	let bits = 0;
	let value = 0;
	let out = "";
	for (const byte of bytes) {
		value = (value << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			out += ALPHABET[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}
	if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
	return out;
}
