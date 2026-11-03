import { appendFile } from "node:fs/promises";

// Outgoing auth email (password resets, email-change confirmations, verification).
//
// SvelteForge ships without an email provider, so this logs the message to the
// server console. Replace the body with your provider of choice (Resend, Postmark,
// SES, Nodemailer…): every auth email in the app goes through this one function.
//
// Set AUTH_EMAIL_OUTBOX=/path/to/outbox.jsonl to also append each message as a JSON
// line, which is handy in development and is how the E2E tests read reset links.
export type AuthEmail = {
	to: string;
	subject: string;
	text: string;
	url: string;
};

export async function sendAuthEmail(email: AuthEmail): Promise<void> {
	console.log(
		`\n[Auth email] To: ${email.to}\n[Auth email] Subject: ${email.subject}\n[Auth email] Link: ${email.url}\n`
	);
	const outbox = process.env.AUTH_EMAIL_OUTBOX;
	if (outbox) {
		await appendFile(outbox, JSON.stringify({ ...email, sentAt: new Date().toISOString() }) + "\n");
	}
}
