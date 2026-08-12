import { ObjectId } from "mongodb";
import { getSession } from "../../../lib/auth";
import { getMongoDb } from "../../../lib/mongodb";

export const runtime = "nodejs";

function sessionDescription(value: unknown, type: "offer" | "answer") {
  if (!value || typeof value !== "object") return null;
  const description = value as Record<string, unknown>;
  const sdp = typeof description.sdp === "string" ? description.sdp.slice(0, 120_000) : "";
  return description.type === type && sdp ? { type, sdp } : null;
}

export async function GET() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.id)) return Response.json({ error: "Sign in to receive calls" }, { status: 401 });
  if (session.role !== "provider") return Response.json({ data: null });
  try {
    const db = await getMongoDb();
    const now = new Date();
    await db.collection("voiceCalls").updateMany({ providerUserId: new ObjectId(session.id), status: "ringing", expiresAt: { $lte: now } }, { $set: { status: "missed", updatedAt: now } });
    const call = await db.collection("voiceCalls").findOne(
      { providerUserId: new ObjectId(session.id), status: "ringing", expiresAt: { $gt: now } },
      { sort: { createdAt: -1 }, projection: { callerCandidates: 0, providerCandidates: 0, offer: 0, answer: 0 } },
    );
    return Response.json({ data: call ? { ...call, _id: String(call._id), callerUserId: undefined, providerUserId: undefined } : null });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to check incoming calls" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.id)) return Response.json({ error: "Sign in before calling a professional" }, { status: 401 });
  if (session.role !== "customer") return Response.json({ error: "Customer accounts can start professional calls" }, { status: 403 });
  try {
    const body = await request.json();
    const providerId = typeof body.providerId === "string" && ObjectId.isValid(body.providerId) ? new ObjectId(body.providerId) : null;
    const offer = sessionDescription(body.offer, "offer");
    if (!providerId || !offer) return Response.json({ error: "Unable to prepare this call" }, { status: 400 });
    const db = await getMongoDb();
    const callerUserId = new ObjectId(session.id);
    const provider = await db.collection("providers").findOne({ _id: providerId, status: { $ne: "disabled" }, published: true }, { projection: { userId: 1, businessName: 1, service: 1 } });
    if (!provider || !(provider.userId instanceof ObjectId)) return Response.json({ error: "This professional cannot receive calls yet" }, { status: 404 });
    if (provider.userId.equals(callerUserId)) return Response.json({ error: "You cannot call your own profile" }, { status: 400 });
    const now = new Date();
    const recentCount = await db.collection("voiceCalls").countDocuments({ callerUserId, createdAt: { $gte: new Date(now.getTime() - 60_000) } });
    if (recentCount >= 3) return Response.json({ error: "Please wait before starting another call" }, { status: 429 });
    const existing = await db.collection("voiceCalls").findOne({ callerUserId, providerUserId: provider.userId, status: { $in: ["ringing", "accepted"] }, expiresAt: { $gt: now } });
    if (existing) return Response.json({ error: "A call with this professional is already open" }, { status: 409 });
    await Promise.all([
      db.collection("voiceCalls").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection("voiceCalls").createIndex({ providerUserId: 1, status: 1, createdAt: -1 }),
      db.collection("voiceCalls").createIndex({ callerUserId: 1, createdAt: -1 }),
    ]);
    const record = {
      callerUserId,
      callerName: session.fullName.slice(0, 100),
      providerId,
      providerUserId: provider.userId,
      providerBusiness: String(provider.businessName ?? "Nearleo professional").slice(0, 100),
      service: String(provider.service ?? "Local service").slice(0, 60),
      offer,
      answer: null,
      callerCandidates: [],
      providerCandidates: [],
      status: "ringing",
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 10 * 60_000),
    };
    const result = await db.collection("voiceCalls").insertOne(record);
    return Response.json({ data: { id: String(result.insertedId), status: record.status, providerBusiness: record.providerBusiness, service: record.service } }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to start the call" }, { status: 500 });
  }
}
