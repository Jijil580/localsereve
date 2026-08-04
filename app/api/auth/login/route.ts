import { ObjectId } from "mongodb";
import { createSession, verifyPassword, type SessionUser } from "../../../../lib/auth";
import { getMongoDb } from "../../../../lib/mongodb";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const identifier = typeof body.identifier === "string" ? body.identifier.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!identifier || !password) return Response.json({ error: "Email/mobile and password are required" }, { status: 400 });
  try {
    const db = await getMongoDb();
    const phone = identifier.replace(/\D/g, "");
    const record = await db.collection("users").findOne({ $or: [{ email: identifier }, { phone }], status: "active" });
    if (!record || typeof record.passwordHash !== "string" || !(await verifyPassword(password, record.passwordHash))) return Response.json({ error: "Incorrect email/mobile or password" }, { status: 401 });
    const user: SessionUser = { id: (record._id as ObjectId).toHexString(), fullName: String(record.fullName), email: String(record.email), role: record.role === "provider" || record.role === "admin" ? record.role : "customer" };
    await createSession(user);
    await db.collection("users").updateOne({ _id: record._id }, { $set: { lastLoginAt: new Date() } });
    return Response.json({ user });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("MONGODB_URI") ? "Account storage is not configured yet" : "Unable to sign in right now";
    return Response.json({ error: message }, { status: 500 });
  }
}
