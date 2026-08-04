import { getMongoDb } from "../../../lib/mongodb";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  const verified = url.searchParams.get("verified") === "true";
  const minRating = Math.min(5, Math.max(0, Number(url.searchParams.get("rating") ?? 0)));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
  const query: Record<string, unknown> = { averageRating: { $gte: minRating }, status: "active", published: true };
  if (search) query.$text = { $search: search };
  if (verified) query.verified = true;
  try {
    const db = await getMongoDb();
    const rows = await db.collection("providers").find(query, { projection: { privateDocuments: 0, paymentDetails: 0 } }).sort({ averageRating: -1, completedJobs: -1 }).limit(limit).toArray();
    const data = rows.map(row => ({
      id: String(row._id),
      name: String(row.name ?? "Local professional"),
      business: String(row.businessName ?? row.name ?? "Local professional"),
      service: String(row.service ?? "Local service"),
      rating: Number(row.averageRating ?? 0),
      reviews: Number(row.reviewCount ?? 0),
      distance: Number(row.distanceKm ?? 5),
      experience: Number(row.experienceYears ?? 0),
      price: Number(row.startingPrice ?? 0),
      available: Boolean(row.available),
      emergency: Boolean(row.emergency),
      verified: Boolean(row.verified),
      image: String(row.initials ?? "LS"),
      cover: row.profilePhotoId ? `/api/providers/photo/${row._id}` : "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80",
      description: String(row.description ?? "Local service professional."),
      jobs: Number(row.completedJobs ?? 0),
      locality: String(row.locality ?? "Kochi"),
    }));
    return Response.json({ data, meta: { limit, count: data.length } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load providers";
    return Response.json({ error: message }, { status: message.includes("MONGODB_URI") ? 503 : 500 });
  }
}
