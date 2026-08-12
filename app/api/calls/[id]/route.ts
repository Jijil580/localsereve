import { ObjectId } from "mongodb";
import { getSession } from "../../../../lib/auth";
import { getMongoDb } from "../../../../lib/mongodb";

export const runtime = "nodejs";

function description(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const sdp = typeof item.sdp === "string" ? item.sdp.slice(0, 120_000) : "";
  return item.type === "answer" && sdp ? { type: "answer", sdp } : null;
}

function candidate(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const candidateText = typeof item.candidate === "string" ? item.candidate.slice(0, 4000) : "";
  if (!candidateText) return null;
  return {
    candidate: candidateText,
    sdpMid: typeof item.sdpMid === "string" ? item.sdpMid.slice(0, 100) : null,
    sdpMLineIndex: typeof item.sdpMLineIndex === "number" ? item.sdpMLineIndex : null,
    usernameFragment: typeof item.usernameFragment === "string" ? item.usernameFragment.slice(0, 200) : null,
  };
}

async function participantCall(id: string, sessionId: string) {
  if (!ObjectId.isValid(id) || !ObjectId.isValid(sessionId)) return null;
  const db = await getMongoDb();
  const userId = new ObjectId(sessionId);
  return db.collection("voiceCalls").findOne({ _id: new ObjectId(id), $or: [{ callerUserId: userId }, { providerUserId: userId }] });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in to access this call" }, { status: 401 });
  try {
    const { id } = await context.params;
    const call = await participantCall(id, session.id);
    if (!call) return Response.json({ error: "Call not found" }, { status: 404 });
    const isCaller = call.callerUserId instanceof ObjectId && call.callerUserId.equals(new ObjectId(session.id));
    return Response.json({ data: { ...call, _id: String(call._id), callerUserId: undefined, providerUserId: undefined, side: isCaller ? "caller" : "provider" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load call" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.id)) return Response.json({ error: "Sign in to manage this call" }, { status: 401 });
  try {
    const { id } = await context.params;
    const call = await participantCall(id, session.id);
    if (!call) return Response.json({ error: "Call not found" }, { status: 404 });
    const db = await getMongoDb();
    const body = await request.json();
    const action = typeof body.action === "string" ? body.action : "";
    const userId = new ObjectId(session.id);
    const isCaller = call.callerUserId instanceof ObjectId && call.callerUserId.equals(userId);
    const isProvider = call.providerUserId instanceof ObjectId && call.providerUserId.equals(userId);
    const now = new Date();
    if (call.expiresAt instanceof Date && call.expiresAt <= now && action !== "end") return Response.json({ error: "This call has expired" }, { status: 410 });
    if (action === "accept") {
      const answer = description(body.answer);
      if (!isProvider || !answer || call.status !== "ringing") return Response.json({ error: "This call cannot be accepted" }, { status: 409 });
      const result = await db.collection("voiceCalls").updateOne({ _id: call._id, status: "ringing" }, { $set: { answer, status: "accepted", acceptedAt: now, updatedAt: now } });
      if (!result.modifiedCount) return Response.json({ error: "The call is no longer available" }, { status: 409 });
      return Response.json({ data: { status: "accepted" } });
    }
    if (action === "decline") {
      if (!isProvider || call.status !== "ringing") return Response.json({ error: "This call cannot be declined" }, { status: 409 });
      await db.collection("voiceCalls").updateOne({ _id: call._id }, { $set: { status: "declined", endedAt: now, updatedAt: now, expiresAt: new Date(now.getTime() + 60_000) } });
      return Response.json({ data: { status: "declined" } });
    }
    if (action === "end") {
      if (!isCaller && !isProvider) return Response.json({ error: "Not allowed" }, { status: 403 });
      await db.collection("voiceCalls").updateOne({ _id: call._id }, { $set: { status: "ended", endedAt: now, updatedAt: now, expiresAt: new Date(now.getTime() + 60_000) } });
      return Response.json({ data: { status: "ended" } });
    }
    if (action === "candidate") {
      const iceCandidate = candidate(body.candidate);
      if (!iceCandidate || !["ringing", "accepted"].includes(String(call.status))) return Response.json({ error: "Invalid call candidate" }, { status: 400 });
      const field = isCaller ? "callerCandidates" : isProvider ? "providerCandidates" : "";
      if (!field) return Response.json({ error: "Not allowed" }, { status: 403 });
      const candidateCount = isCaller ? (Array.isArray(call.callerCandidates) ? call.callerCandidates.length : 0) : (Array.isArray(call.providerCandidates) ? call.providerCandidates.length : 0);
      if (candidateCount >= 128) return Response.json({ error: "Call candidate limit reached" }, { status: 429 });
      await db.collection("voiceCalls").updateOne({ _id: call._id }, { $addToSet: { [field]: iceCandidate }, $set: { updatedAt: now } });
      return Response.json({ data: { status: call.status } });
    }
    return Response.json({ error: "Unknown call action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update call" }, { status: 500 });
  }
}
