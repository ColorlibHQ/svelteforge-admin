import { vi } from "vitest";

// Outside a real request there is no SvelteKit RequestEvent. Better Auth's
// sveltekitCookies plugin treats `undefined` as "nothing to forward".
vi.mock("$app/server", () => ({ getRequestEvent: () => undefined }));
