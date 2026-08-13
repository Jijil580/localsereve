import { ObjectId } from "mongodb";
import { getSession } from "../../../../lib/auth";
import { getMongoDb } from "../../../../lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "provider" || !ObjectId.isValid(session.id)) return Response.json({ error: "Provider sign-in required" }, { status: 401 });
  try {
    const db = await getMongoDb();
    const profile = await db.collection("providers").findOne({ userId: new ObjectId(session.id), status: { $ne: "disabled" } }, { projection: { _id: 1 } });
    if (!profile) return Response.json({ data: [] });
    const rows = await db.collection("callContactRequests").find({ providerId: profile._id }).sort({ requestedAt: -1 }).limit(100).toArray();
    return Response.json({ data: rows.map(row => ({ _id: String(row._id), customerName: row.customerName, service: row.service, requestNumber: row.requestNumber, status: row.status, requestedAt: row.requestedAt, respondedAt: row.respondedAt })) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load audio-call requests" }, { status: 500 });
  }
}
