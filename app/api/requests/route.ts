import { ObjectId } from "mongodb";
import { getSession } from "../../../lib/auth";
import { getMongoDb } from "../../../lib/mongodb";
import { recordProviderRequestReceipts } from "../../../lib/provider-request-receipts";

export const runtime = "nodejs";

function text(value: unknown, maximum: number) { return typeof value === "string" ? value.trim().slice(0, maximum) : ""; }
function requestLocation(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const point = value as { latitude?: unknown; longitude?: unknown; label?: unknown };
  const latitude = Number(point.latitude); const longitude = Number(point.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { type: "Point" as const, coordinates: [longitude, latitude] as [number, number], label: text(point.label, 120) };
}
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
  if (!session || !ObjectId.isValid(session.id)) return Response.json({ error: "Sign in to view your requests" }, { status: 401 });
  try {
    const db = await getMongoDb();
    const rows = await db.collection("serviceRequests").find({ customerId: new ObjectId(session.id) }).sort({ updatedAt: -1, createdAt: -1 }).limit(100).toArray();
    const providerIds = Array.from(new Set(rows.flatMap(row => Array.isArray(row.responses) ? row.responses.map((reply: { providerId?: unknown }) => String(reply.providerId ?? "")) : []).filter(ObjectId.isValid))).map(id => new ObjectId(id));
    const providerRows = providerIds.length ? await db.collection("providers").find({ _id: { $in: providerIds }, status: { $ne: "disabled" } }, { projection: { verified: 1, profilePhotoId: 1, locality: 1, completedJobs: 1 } }).toArray() : [];
    const providerById = new Map(providerRows.map(provider => [String(provider._id), provider]));
    const data = rows.map(row => {
      const repliesByProvider = new Map<string, Record<string, unknown>>();
      for (const reply of Array.isArray(row.responses) ? row.responses : []) {
        const providerId = String(reply.providerId ?? "");
        if (ObjectId.isValid(providerId)) repliesByProvider.set(providerId, reply);
      }
      const responses = Array.from(repliesByProvider.entries()).map(([providerId, reply]) => {
        const { providerWhatsApp: _privateNumber, ...safeReply } = reply;
        const provider = providerById.get(providerId);
        return { ...safeReply, providerId, providerVerified: Boolean(provider?.verified), providerPhotoUrl: provider?.profilePhotoId ? `/api/providers/photo/${providerId}` : "", providerLocality: String(provider?.locality ?? ""), providerCompletedJobs: Number(provider?.completedJobs ?? 0) };
      });
      return { ...row, whatsappNumber: undefined, _id: String(row._id), customerId: String(row.customerId), assignedProviderId: row.assignedProviderId ? String(row.assignedProviderId) : "", quoteCount: responses.length, responses };
    });
    return Response.json({ data });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load requests" }, { status: 500 }); }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.id)) return Response.json({ error: "Sign in before posting a request" }, { status: 401 });
  try {
    const body = await request.json();
    const service = text(body.service, 60);
    const description = text(body.description, 1200);
    const address = text(body.address, 240);
    const preferredDate = text(body.preferredDate, 20);
    const preferredTime = text(body.preferredTime, 30);
    const urgency = text(body.urgency, 30) || "Flexible";
    const whatsappDigits = text(body.whatsappNumber, 20).replace(/\D/g, "");
    const location = requestLocation(body.location);
    const preferredProviderId = typeof body.preferredProviderId === "string" && ObjectId.isValid(body.preferredProviderId) ? new ObjectId(body.preferredProviderId) : null;
    const allowWhatsApp = body.allowWhatsApp === true && whatsappDigits.length >= 10 && whatsappDigits.length <= 15;
    if (!service || description.length < 10 || !address || !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) return Response.json({ error: "Complete the service, description, address and preferred date" }, { status: 400 });
    const now = new Date();
    const record = { requestNumber: `REQ-${Date.now().toString(36).toUpperCase()}`, customerId: new ObjectId(session.id), customerName: session.fullName, service, description, address, preferredDate, preferredTime, urgency, allowWhatsApp, whatsappNumber: allowWhatsApp ? whatsappDigits : "", preferredProviderId, location, responses: [], status: "open", quoteCount: 0, statusHistory: [{ status: "open", changedAt: now, changedBy: new ObjectId(session.id) }], createdAt: now, updatedAt: now };
    const db = await getMongoDb();
    await db.collection("serviceRequests").createIndex({ customerId: 1, createdAt: -1 });
    await db.collection("serviceRequests").createIndex({ location: "2dsphere" });
    const result = await db.collection("serviceRequests").insertOne(record);
    const escapedService = service.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const candidateProviders = preferredProviderId
      ? await db.collection("providers").find({ _id: preferredProviderId, status: { $ne: "disabled" } }, { projection: { _id: 1 } }).toArray()
      : await db.collection("providers").find({ service: { $regex: `^${escapedService}$`, $options: "i" }, status: { $ne: "disabled" } }, { projection: { _id: 1, location: 1 } }).toArray();
    const recipients = candidateProviders.filter(provider => preferredProviderId || !location || distanceKm(provider.location, location) === null || Number(distanceKm(provider.location, location)) <= 35);
    await recordProviderRequestReceipts(db, recipients.map(provider => ({ providerId: provider._id, requestId: result.insertedId })));
    return Response.json({ data: { ...record, _id: String(result.insertedId), customerId: session.id } }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to post request" }, { status: 500 }); }
}
