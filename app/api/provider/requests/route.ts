import { ObjectId } from "mongodb";
import { getSession } from "../../../../lib/auth";
import { getMongoDb } from "../../../../lib/mongodb";

export const runtime = "nodejs";

const MAX_MATCH_DISTANCE_KM = 35;
function distanceKm(left: unknown, right: unknown) {
  const a = (left as { coordinates?: unknown })?.coordinates; const b = (right as { coordinates?: unknown })?.coordinates;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length < 2 || b.length < 2 || !a.every(Number.isFinite) || !b.every(Number.isFinite)) return null;
  const [leftLng,leftLat]=a as number[]; const [rightLng,rightLat]=b as number[]; const radians=(value:number)=>value*Math.PI/180;
  const latitudeDelta=radians(rightLat-leftLat),longitudeDelta=radians(rightLng-leftLng);
  const h=Math.sin(latitudeDelta/2)**2+Math.cos(radians(leftLat))*Math.cos(radians(rightLat))*Math.sin(longitudeDelta/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}

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
    }, { projection: { service: 1, location: 1 } });

    if (!profile || typeof profile.service !== "string" || !profile.service.trim()) {
      return Response.json({ data: [], profileReady: false });
    }

    const escapedService = profile.service.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rows = await db.collection("serviceRequests").find({ $or: [
      { service: { $regex: `^${escapedService}$`, $options: "i" }, status: { $in: ["open", "quoted"] }, $or: [{ preferredProviderId: profile._id }, { preferredProviderId: null }, { preferredProviderId: { $exists: false } }] },
      { assignedProviderId: profile._id, status: { $in: ["accepted", "in_progress"] } },
    ] }).sort({ createdAt: -1 }).limit(100).toArray();
    const nearbyRows = rows.filter(row => {
      if (String(row.assignedProviderId ?? "") === String(profile._id)) return true;
      if (row.preferredProviderId && String(row.preferredProviderId) === String(profile._id)) return true;
      const distance = distanceKm(profile.location, row.location);
      return distance === null || distance <= MAX_MATCH_DISTANCE_KM;
    });

    return Response.json({
      profileReady: true,
      service: profile.service,
      data: nearbyRows.map(row => ({
        _id: String(row._id),
        requestNumber: row.requestNumber,
        customerName: row.customerName,
        service: row.service,
        description: row.description,
        address: row.address,
        preferredDate: row.preferredDate,
        preferredTime: row.preferredTime,
        urgency: row.urgency,
        customerDistanceKm: (() => { const distance=distanceKm(profile.location,row.location); return distance === null ? null : Number(distance.toFixed(1)); })(),
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
