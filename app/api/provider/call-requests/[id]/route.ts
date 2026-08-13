import { ObjectId } from "mongodb";
import { getSession } from "../../../../../lib/auth";
import { getMongoDb } from "../../../../../lib/mongodb";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await context.params;
  if (!session || session.role !== "provider" || !ObjectId.isValid(session.id)) return Response.json({ error: "Provider sign-in required" }, { status: 401 });
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid audio-call request" }, { status: 400 });
  const body = await request.json();
  const status = body.action === "approve" ? "approved" : body.action === "decline" ? "declined" : "";
  if (!status) return Response.json({ error: "Choose approve or decline" }, { status: 400 });
  try {
    const db = await getMongoDb();
    const profile = await db.collection("providers").findOne({ userId: new ObjectId(session.id), status: { $ne: "disabled" } }, { projection: { _id: 1 } });
    if (!profile) return Response.json({ error: "Provider profile not found" }, { status: 404 });
    const now = new Date();
    const result = await db.collection("callContactRequests").findOneAndUpdate(
      { _id: new ObjectId(id), providerId: profile._id, status: "pending" },
      { $set: { status, respondedAt: now, updatedAt: now } },
      { returnDocument: "after" },
    );
    if (!result) return Response.json({ error: "This request is no longer pending" }, { status: 409 });
    return Response.json({ ok: true, status });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update audio-call request" }, { status: 500 });
  }
}
