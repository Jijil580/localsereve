import { ObjectId } from "mongodb";
import { getSession } from "../../../../lib/auth";
import { getMongoDb } from "../../../../lib/mongodb";

export const runtime = "nodejs";

function coordinates(body: Record<string, unknown>) {
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 ? { latitude, longitude } : null;
}

export async function GET() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.id)) return Response.json({ location: null });
  const db = await getMongoDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(session.id) }, { projection: { location: 1, locationLabel: 1, locationAddress: 1 } });
  const point = user?.location?.coordinates;
  return Response.json({ location: Array.isArray(point) ? { longitude: Number(point[0]), latitude: Number(point[1]), label: String(user?.locationLabel ?? "Saved location"), address: String(user?.locationAddress ?? "") } : null });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.id)) return Response.json({ error: "Customer sign-in required" }, { status: 401 });
  const body = await request.json();
  const point = coordinates(body);
  if (!point) return Response.json({ error: "Choose a valid location" }, { status: 400 });
  const label = typeof body.label === "string" ? body.label.trim().slice(0, 120) : "Saved location";
  const address = typeof body.address === "string" ? body.address.trim().slice(0, 300) : "";
  const db = await getMongoDb();
  const updates:Record<string,unknown> = { location: { type: "Point", coordinates: [point.longitude, point.latitude] }, locationLabel: label, locationUpdatedAt: new Date() };
  if(address)updates.locationAddress=address;
  await db.collection("users").updateOne({ _id: new ObjectId(session.id) }, { $set: updates });
  return Response.json({ ok: true, location: { ...point, label, address } });
}
