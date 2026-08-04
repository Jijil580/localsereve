import { getMongoDb } from "../../../lib/mongodb";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  const verified = url.searchParams.get("verified") === "true";
  const minRating = Math.min(5, Math.max(0, Number(url.searchParams.get("rating") ?? 0)));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
  const query: Record<string, unknown> = { averageRating: { $gte: minRating }, status: { $ne: "suspended" } };
  if (search) query.$text = { $search: search };
  if (verified) query.verified = true;
  try {
    const db = await getMongoDb();
    const rows = await db.collection("providers").find(query, { projection: { privateDocuments: 0, paymentDetails: 0 } }).sort({ averageRating: -1, completedJobs: -1 }).limit(limit).toArray();
    return Response.json({ data: rows, meta: { limit, count: rows.length } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load providers";
    return Response.json({ error: message }, { status: message.includes("MONGODB_URI") ? 503 : 500 });
  }
}
