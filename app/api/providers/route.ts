import { ObjectId } from "mongodb";
import { getSession } from "../../../lib/auth";
import { getMongoDb } from "../../../lib/mongodb";

export const runtime = "nodejs";

function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export async function GET(request: Request) {
  const session = await getSession();
  const revealContact = Boolean(session);
  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  const verified = url.searchParams.get("verified") === "true";
  const minRating = Math.min(5, Math.max(0, Number(url.searchParams.get("rating") ?? 0)));
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
  const latitudeText = url.searchParams.get("lat");
  const longitudeText = url.searchParams.get("lng");
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);
  const hasLocation = latitudeText !== null && longitudeText !== null && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
  const query: Record<string, unknown> = { status: { $ne: "disabled" }, service: { $exists: true, $ne: "" }, phone: { $exists: true, $ne: "" } };
  if (minRating > 0) query.averageRating = { $gte: minRating };
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: "i" };
    query.$or = [{ businessName: pattern }, { name: pattern }, { service: pattern }, { locality: pattern }];
  }
  if (verified) query.verified = true;
  try {
    const db = await getMongoDb();
    if (hasLocation) await db.collection("providers").createIndex({ location: "2dsphere" });
    let rows;
    if (hasLocation) {
      const nearbyRows = await db.collection("providers").aggregate([{ $geoNear: { near: { type: "Point", coordinates: [longitude, latitude] }, key: "location", distanceField: "distanceMeters", spherical: true, query } }, { $sort: { averageRating: -1, completedJobs: -1 } }, { $limit: limit }, { $project: { privateDocuments: 0, paymentDetails: 0 } }]).toArray();
      const remaining = limit - nearbyRows.length;
      const providersWithoutCoordinates = remaining > 0
        ? await db.collection("providers").find({ ...query, _id: { $nin: nearbyRows.map(row => row._id) } }, { projection: { privateDocuments: 0, paymentDetails: 0, location: 0 } }).sort({ averageRating: -1, completedJobs: -1 }).limit(remaining).toArray()
        : [];
      rows = [...nearbyRows, ...providersWithoutCoordinates];
    } else {
      rows = await db.collection("providers").find(query, { projection: { privateDocuments: 0, paymentDetails: 0, location: 0 } }).sort({ averageRating: -1, completedJobs: -1 }).limit(limit).toArray();
    }
    const userIds = revealContact ? rows.map(row => row.userId).filter((value): value is ObjectId => value instanceof ObjectId) : [];
    const users = userIds.length ? await db.collection("users").find({ _id: { $in: userIds } }, { projection: { email: 1 } }).toArray() : [];
    const emailByUserId = new Map(users.map(user => [String(user._id), String(user.email ?? "")]));
    const data = rows.map(row => ({
      id: String(row._id),
      name: String(row.name ?? "Local professional"),
      business: String(row.businessName ?? row.name ?? "Local professional"),
      service: String(row.service ?? "Local service"),
      rating: Number(row.averageRating ?? 0),
      reviews: Number(row.reviewCount ?? 0),
      distance: row.distanceMeters !== undefined ? Number((Number(row.distanceMeters) / 1000).toFixed(1)) : null,
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
      portfolio: Array.isArray(row.portfolioImageIds) ? row.portfolioImageIds.slice(0,4).map((_id: unknown,index: number) => `/api/providers/portfolio/${row._id}/${index}`) : [],
      phone: revealContact ? String(row.phone ?? "") : "",
      email: revealContact ? String(row.contactEmail ?? emailByUserId.get(String(row.userId)) ?? "") : "",
      instagramUrl: String(row.instagramUrl ?? ""),
      facebookUrl: String(row.facebookUrl ?? ""),
      youtubeUrl: String(row.youtubeUrl ?? ""),
    }));
    return Response.json({ data, meta: { limit, count: data.length } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load providers";
    return Response.json({ error: message }, { status: message.includes("MONGODB_URI") ? 503 : 500 });
  }
}
