import { getSession } from "../../../../lib/auth";

export async function GET() { return Response.json({ user: await getSession() }); }
