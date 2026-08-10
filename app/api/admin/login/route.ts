import { ADMIN_ID } from "../../../../lib/admin-auth";
import { createSession, verifyPassword, type SessionUser } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const configuredHash = process.env.ADMIN_PASSWORD_HASH;
    if (!configuredEmail || !configuredHash) return Response.json({ error: "Admin access is not configured" }, { status: 503 });
    if (email !== configuredEmail || !(await verifyPassword(password, configuredHash))) return Response.json({ error: "Invalid admin credentials" }, { status: 401 });
    const user: SessionUser = { id: ADMIN_ID, fullName: "LumNearo Admin", email: configuredEmail, role: "admin" };
    await createSession(user);
    return Response.json({ user });
  } catch { return Response.json({ error: "Unable to sign in" }, { status: 500 }); }
}
