import { MongoServerError } from "mongodb";
import { createSession, hashPassword, type SessionUser } from "../../../../lib/auth";
import { getMongoDb } from "../../../../lib/mongodb";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9]{10,15}$/;

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim().replace(/\s+/g, " ") : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role === "provider" ? "provider" : "customer";
  if (fullName.length < 2 || fullName.length > 80) return Response.json({ error: "Enter your full name" }, { status: 400 });
  if (!emailPattern.test(email)) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  if (!phonePattern.test(phone)) return Response.json({ error: "Enter a valid mobile number" }, { status: 400 });
  if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return Response.json({ error: "Password must be at least 8 characters with uppercase, lowercase and a number" }, { status: 400 });
  try {
    const db = await getMongoDb();
    const users = db.collection("users");
    await Promise.all([users.createIndex({ email: 1 }, { unique: true }), users.createIndex({ phone: 1 }, { unique: true })]);
    const passwordHash = await hashPassword(password);
    const now = new Date();
    const result = await users.insertOne({ fullName, email, phone, passwordHash, role, status: "active", emailVerified: false, phoneVerified: false, createdAt: now, updatedAt: now });
    const user: SessionUser = { id: result.insertedId.toHexString(), fullName, email, role };
    await createSession(user);
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) return Response.json({ error: "An account already exists with this email or mobile number" }, { status: 409 });
    const message = error instanceof Error && error.message.includes("MONGODB_URI") ? "Account storage is not configured yet" : "Unable to create your account right now";
    return Response.json({ error: message }, { status: 500 });
  }
}
