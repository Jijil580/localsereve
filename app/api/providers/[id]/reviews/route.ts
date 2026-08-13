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
    const provider = await db.collection("providers").findOne({ _id: providerId, status: { $ne: "disabled" }, published: { $ne: false } }, { projection: { averageRating: 1, reviewCount: 1 } });
    if (!provider) return Response.json({ error: "Provider not found" }, { status: 404 });
    const session = await getSession();
    const rows = await db.collection("providerReviews").find({ providerId, status: "published" }).sort({ updatedAt: -1 }).limit(50).toArray();
    const ownReview = session?.role === "customer" && ObjectId.isValid(session.id)
      ? await db.collection("providerReviews").findOne({ providerId, customerId: new ObjectId(session.id), status: "published" })
      : null;
    return Response.json({
      rating: Math.max(0, Number(provider.averageRating ?? 0)),
      count: Math.max(0, Number(provider.reviewCount ?? rows.length)),
      ownReview: ownReview ? { rating: Number(ownReview.rating), comment: String(ownReview.comment ?? "") } : null,
      data: rows.map(row => ({ id: String(row._id), customerName: String(row.customerName ?? "Nearleo customer"), rating: Number(row.rating), comment: String(row.comment ?? ""), createdAt: row.createdAt, updatedAt: row.updatedAt })),
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load reviews" }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await context.params;
  if (!session || session.role !== "customer" || !ObjectId.isValid(session.id)) return Response.json({ error: "Sign in with a customer account to add a review" }, { status: 401 });
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid provider" }, { status: 400 });
  try {
    const body = await request.json();
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 600) : "";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return Response.json({ error: "Choose a rating from 1 to 5 stars" }, { status: 400 });
    const db = await getMongoDb();
    const providerId = new ObjectId(id);
    const customerId = new ObjectId(session.id);
    const provider = await db.collection("providers").findOne({ _id: providerId, status: { $ne: "disabled" }, published: { $ne: false } }, { projection: { _id: 1, userId: 1 } });
    if (!provider) return Response.json({ error: "Provider not found" }, { status: 404 });
    if (provider.userId instanceof ObjectId && provider.userId.equals(customerId)) return Response.json({ error: "You cannot review your own provider profile" }, { status: 403 });
    const reviews = db.collection("providerReviews");
    await reviews.createIndex({ customerId: 1, providerId: 1 }, { unique: true });
    const now = new Date();
    await reviews.updateOne(
      { customerId, providerId },
      { $set: { customerName: session.fullName.slice(0, 100), rating, comment, status: "published", updatedAt: now }, $setOnInsert: { customerId, providerId, createdAt: now } },
      { upsert: true },
    );
    const summary = await reviews.aggregate<{ _id: null; averageRating: number; reviewCount: number }>([
      { $match: { providerId, status: "published" } },
      { $group: { _id: null, averageRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
    ]).next();
    const averageRating = Number((summary?.averageRating ?? rating).toFixed(2));
    const reviewCount = Number(summary?.reviewCount ?? 1);
    await db.collection("providers").updateOne({ _id: providerId }, { $set: { averageRating, reviewCount, updatedAt: now } });
    return Response.json({ ok: true, rating: averageRating, count: reviewCount });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save review" }, { status: 500 });
  }
}
