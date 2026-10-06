import { version } from "../../../../package.json";

export function GET() {
	return Response.json(
		{ status: "ok", version, commit: __BUILD_COMMIT__ },
		{ headers: { "cache-control": "no-store" } }
	);
}
