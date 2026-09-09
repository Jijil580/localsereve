import webPush from "web-push";
import { createHash } from "node:crypto";
import { ObjectId } from "mongodb";
import { getMongoDb } from "./mongodb";

// Stable server-only keys survive deployments. Never return the private key.
export async function pushKeys() {
  const db = await getMongoDb();
  const settings = db.collection<{ _id: string; publicKey: string; privateKey: string }>("pushSettings");
  let keys = await settings.findOne({ _id: "vapid" });
  if (!keys) {
    try { await settings.updateOne({ _id: "vapid" }, { $setOnInsert: webPush.generateVAPIDKeys() }, { upsert: true }); }
    catch (error) { if ((error as { code?: number }).code !== 11000) throw error; }
    keys = await settings.findOne({ _id: "vapid" });
  }
  if (!keys) throw new Error("Notifications are temporarily unavailable");
  return keys;
}

export function validSubscription(value: unknown): value is webPush.PushSubscription {
  if (!value || typeof value !== "object") return false;
  const sub = value as webPush.PushSubscription;
  try {
    const url = new URL(sub.endpoint);
    const host = url.hostname;
    const allowed = host === "fcm.googleapis.com" || host === "updates.push.services.mozilla.com" || host.endsWith(".notify.windows.com") || host === "web.push.apple.com" || host.endsWith(".push.apple.com");
    return allowed && url.protocol === "https:" && !url.username && !url.password && !url.port && sub.endpoint.length < 2048 &&
      typeof sub.keys?.auth === "string" && /^[\w-]+$/.test(sub.keys.auth) && Buffer.from(sub.keys.auth, "base64url").length === 16 &&
      typeof sub.keys?.p256dh === "string" && /^[\w-]+$/.test(sub.keys.p256dh) && Buffer.from(sub.keys.p256dh, "base64url").length === 65;
  } catch { return false; }
}
export const subscriptionId = (endpoint: string) => createHash("sha256").update(endpoint).digest("hex");

export async function notifyPhones(userIds: string[], notification: { title: string; body: string; url: string; tag: string }, deviceId?: string) {
  try {
    const ids = [...new Set(userIds)].filter(ObjectId.isValid).map(id => new ObjectId(id));
    if (!ids.length) return;
    const db = await getMongoDb();
    const subscriptions = db.collection<{ _id: string; userId: ObjectId; subscription: webPush.PushSubscription }>("pushSubscriptions");
    const rows = await subscriptions.find({ userId: { $in: ids }, ...(deviceId ? { _id: deviceId } : {}) }).toArray();
    if (!rows.length) return;
    const keys = await pushKeys();
    for (let i = 0; i < rows.length; i += 10) await Promise.all(rows.slice(i, i + 10).map(async row => {
      if (!validSubscription(row.subscription)) return;
      try {
        await webPush.sendNotification(row.subscription, JSON.stringify(notification), {
          vapidDetails: { subject: "mailto:support@nearleo.com", publicKey: keys.publicKey, privateKey: keys.privateKey },
          TTL: 3600, urgency: "high", timeout: 5000,
        });
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await subscriptions.deleteOne({ _id: row._id, userId: row.userId });
        else console.warn("Phone notification delivery failed", status || "network");
      }
    }));
  } catch { console.warn("Phone notifications temporarily unavailable"); }
}
