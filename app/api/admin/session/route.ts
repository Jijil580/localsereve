import { requireAdmin } from "../../../../lib/admin-auth";

export async function GET() { return Response.json({ user: await requireAdmin() }); }
