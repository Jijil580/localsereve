import { ObjectId } from "mongodb";
import { getSession } from "../../../../../lib/auth";
import { getMongoDb } from "../../../../../lib/mongodb";

export const runtime = "nodejs";

const trackableStatuses = new Set(["confirmed", "in_progress"]);

function coordinates(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const point = value as { coordinates?: unknown };
  if (!Array.isArray(point.coordinates) || point.coordinates.length < 2) return null;
  const longitude = Number(point.coordinates[0]); const latitude = Number(point.coordinates[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

function liveLocation(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const point = value as { latitude?: unknown; longitude?: unknown; accuracy?: unknown; updatedAt?: unknown };
  const latitude = Number(point.latitude); const longitude = Number(point.longitude); const accuracy = Number(point.accuracy);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude, accuracy: Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : null, updatedAt: point.updatedAt ?? null };
}

async function access(id: string) {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.id)) return { error: Response.json({ error: "Sign in required" }, { status: 401 }) };
  if (!ObjectId.isValid(id)) return { error: Response.json({ error: "Invalid request" }, { status: 400 }) };
  const db = await getMongoDb(); const record = await db.collection("serviceRequests").findOne({ _id: new ObjectId(id) });
  if (!record) return { error: Response.json({ error: "Request not found" }, { status: 404 }) };
  const isCustomer = String(record.customerId ?? "") === session.id;
  let providerId: ObjectId | null = null;
  if (session.role === "provider") {
    const profile = await db.collection("providers").findOne({ userId: new ObjectId(session.id), status: { $ne: "disabled" } }, { projection: { _id: 1 } });
    if (profile?._id instanceof ObjectId && String(profile._id) === String(record.assignedProviderId ?? "")) providerId = profile._id;
  }
  if (!isCustomer && !providerId) return { error: Response.json({ error: "Only this job's customer and selected provider can view tracking" }, { status: 403 }) };
  return { db, record, session, isCustomer, providerId, requestId: new ObjectId(id) };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params; const result = await access(id); if (result.error) return result.error;
    const { record, isCustomer } = result; const providerLocation = liveLocation(record.providerLiveLocation); const updatedAt = providerLocation?.updatedAt ? new Date(String(providerLocation.updatedAt)).getTime() : 0; const fresh = updatedAt > 0 && Date.now() - updatedAt < 60_000; const sharing = Boolean(record.providerLocationSharing) && trackableStatuses.has(String(record.status ?? "")) && fresh;
    return Response.json({ data: { status: String(record.status ?? ""), address: String(record.address ?? ""), targetLocation: coordinates(record.location), sharing, providerLocation: sharing || !isCustomer ? providerLocation : null } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load job tracking" }, { status: 500 }); }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params; const result = await access(id); if (result.error) return result.error;
    const { db, record, providerId, requestId } = result;
    if (!providerId) return Response.json({ error: "Only the selected provider can share live location" }, { status: 403 });
    if (!trackableStatuses.has(String(record.status ?? ""))) return Response.json({ error: "Confirm the job before sharing travel location" }, { status: 409 });
    const body = await request.json() as { latitude?: unknown; longitude?: unknown; accuracy?: unknown };
    const latitude = Number(body.latitude); const longitude = Number(body.longitude); const accuracy = Number(body.accuracy);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return Response.json({ error: "A valid device location is required" }, { status: 400 });
    const now = new Date(); const providerLiveLocation = { latitude, longitude, accuracy: Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : null, updatedAt: now };
    await db.collection("serviceRequests").updateOne({ _id: requestId, assignedProviderId: providerId, status: { $in: [...trackableStatuses] } }, { $set: { providerLiveLocation, providerLocationSharing: true, providerTrackingUpdatedAt: now } });
    return Response.json({ data: { sharing: true, providerLocation: providerLiveLocation } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to share live location" }, { status: 500 }); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params; const result = await access(id); if (result.error) return result.error;
    const { db, providerId, requestId } = result;
    if (!providerId) return Response.json({ error: "Only the selected provider can stop location sharing" }, { status: 403 });
    await db.collection("serviceRequests").updateOne({ _id: requestId, assignedProviderId: providerId }, { $set: { providerLocationSharing: false, providerTrackingStoppedAt: new Date() } });
    return Response.json({ data: { sharing: false } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to stop location sharing" }, { status: 500 }); }
}
