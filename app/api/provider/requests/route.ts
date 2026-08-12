import { ObjectId } from "mongodb";
import { getSession } from "../../../../lib/auth";
import { getMongoDb } from "../../../../lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "provider" || !ObjectId.isValid(session.id)) {
    return Response.json({ error: "Provider sign-in required" }, { status: 401 });
  }

  try {
    const db = await getMongoDb();
    const profile = await db.collection("providers").findOne({
      userId: new ObjectId(session.id),
      status: { $ne: "disabled" },
    }, { projection: { service: 1 } });

    if (!profile || typeof profile.service !== "string" || !profile.service.trim()) {
      return Response.json({ data: [], profileReady: false });
    }

    const escapedService = profile.service.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rows = await db.collection("serviceRequests").find({ $or: [
      { service: { $regex: `^${escapedService}$`, $options: "i" }, status: { $in: ["open", "quoted"] }, $or: [{ preferredProviderId: profile._id }, { preferredProviderId: null }, { preferredProviderId: { $exists: false } }] },
      { assignedProviderId: profile._id, status: { $in: ["accepted", "in_progress"] } },
    ] }).sort({ createdAt: -1 }).limit(100).toArray();

    return Response.json({
      profileReady: true,
      service: profile.service,
      data: rows.map(row => ({
        _id: String(row._id),
        requestNumber: row.requestNumber,
        customerName: row.customerName,
        service: row.service,
        description: row.description,
        address: row.address,
        preferredDate: row.preferredDate,
        preferredTime: row.preferredTime,
        urgency: row.urgency,
        status: row.status,
        assignedProviderId: row.assignedProviderId ? String(row.assignedProviderId) : "",
        assignedProviderName: row.assignedProviderName,
        quoteCount: Number(row.quoteCount ?? 0),
        responses: Array.isArray(row.responses) ? row.responses.filter((reply: { providerId?: ObjectId }) => String(reply.providerId ?? "") === String(profile._id)).map((reply: Record<string, unknown>) => ({ ...reply, providerId: String(reply.providerId ?? "") })) : [],
        createdAt: row.createdAt,
      })),
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load enquiries" }, { status: 500 });
  }
}
