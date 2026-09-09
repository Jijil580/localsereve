import { ObjectId } from "mongodb";
import { waitUntil } from "@vercel/functions";
import { getSession } from "../../../lib/auth";
import { getMongoDb } from "../../../lib/mongodb";
import { pushKeys, subscriptionId, validSubscription, notifyPhones } from "../../../lib/web-push";

export const runtime = "nodejs";
export async function GET() {
  if (!await getSession()) return Response.json({ error: "Sign in required" }, { status: 401 });
  try { return Response.json({ publicKey: (await pushKeys()).publicKey }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "Unable to enable notifications. Please try again." }, { status: 503 }); }
}
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.id)) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (request.headers.get("sec-fetch-site") === "cross-site") return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const subscription = await request.json();
    if (!validSubscription(subscription)) return Response.json({ error: "Invalid notification subscription" }, { status: 400 });
    const db = await getMongoDb();
    const deviceId = subscriptionId(subscription.endpoint);
    const previous = await db.collection<{ _id: string; userId: ObjectId }>("pushSubscriptions").findOne({ _id: deviceId });
    await db.collection("pushSubscriptions").createIndex({ userId: 1 });
    await db.collection<{ _id: string }>("pushSubscriptions").updateOne({ _id: subscriptionId(subscription.endpoint) }, { $set: { userId: new ObjectId(session.id), subscription: { endpoint: subscription.endpoint, keys: subscription.keys }, updatedAt: new Date() } }, { upsert: true });
    if (String(previous?.userId || "") !== session.id) waitUntil(notifyPhones([session.id], { title: "Nearleo notifications enabled", body: "You’ll receive alerts for new requests, replies and messages.", url: "/?notification=dashboard", tag: "notifications-enabled" }, deviceId));
    return Response.json({ ok: true });
  } catch { return Response.json({ error: "Unable to save notifications. Please try again." }, { status: 503 }); }
}
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.id)) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (request.headers.get("sec-fetch-site") === "cross-site") return Response.json({ error: "Forbidden" }, { status: 403 });
  const { endpoint } = await request.json();
  if (typeof endpoint !== "string") return Response.json({ error: "Invalid device" }, { status: 400 });
  const db = await getMongoDb();
  await db.collection<{ _id: string }>("pushSubscriptions").deleteOne({ _id: subscriptionId(endpoint), userId: new ObjectId(session.id) });
  return Response.json({ ok: true });
}
