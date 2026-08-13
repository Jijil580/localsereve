import { ObjectId } from "mongodb";
import { getSession } from "../../../../../lib/auth";
import { getMongoDb } from "../../../../../lib/mongodb";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid provider" }, { status: 400 });
  try {
    const db = await getMongoDb();
    const providerId = new ObjectId(id);
    const provider = await db.collection("providers").findOne({ _id: providerId, status: { $ne: "disabled" }, published: { $ne: false } }, { projection: { likeCount: 1 } });
    if (!provider) return Response.json({ error: "Provider not found" }, { status: 404 });
    const session = await getSession();
    const liked = Boolean(session && ObjectId.isValid(session.id) && await db.collection("providerLikes").findOne({ providerId, userId: new ObjectId(session.id) }, { projection: { _id: 1 } }));
    return Response.json({ count: Math.max(0, Number(provider.likeCount ?? 0)), liked });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load likes" }, { status: 500 });
  }
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await context.params;
  if (!session || !ObjectId.isValid(session.id)) return Response.json({ error: "Log in to like this provider" }, { status: 401 });
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid provider" }, { status: 400 });
  try {
    const db = await getMongoDb();
    const providerId = new ObjectId(id);
    const userId = new ObjectId(session.id);
    const provider = await db.collection("providers").findOne({ _id: providerId, status: { $ne: "disabled" }, published: { $ne: false } }, { projection: { userId: 1 } });
    if (!provider) return Response.json({ error: "Provider not found" }, { status: 404 });
    if (provider.userId instanceof ObjectId && provider.userId.equals(userId)) return Response.json({ error: "You cannot like your own provider profile" }, { status: 403 });
    const likes = db.collection("providerLikes");
    await likes.createIndex({ userId: 1, providerId: 1 }, { unique: true });
    const existing = await likes.findOne({ userId, providerId }, { projection: { _id: 1 } });
    if (existing) await likes.deleteOne({ _id: existing._id });
    else await likes.insertOne({ userId, providerId, createdAt: new Date() });
    const count = await likes.countDocuments({ providerId });
    await db.collection("providers").updateOne({ _id: providerId }, { $set: { likeCount: count, updatedAt: new Date() } });
    return Response.json({ ok: true, liked: !existing, count });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update like" }, { status: 500 });
  }
}
