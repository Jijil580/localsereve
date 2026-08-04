import { ObjectId } from "mongodb";
import { createSession, getSession, type SessionUser } from "../../../../lib/auth";
import { getMongoDb } from "../../../../lib/mongodb";
import { deleteProviderFile, saveProviderFile } from "../../../../lib/provider-files";

export const runtime = "nodejs";

function text(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in to manage your professional profile" }, { status: 401 });
  try {
    const db = await getMongoDb();
    const profile = await db.collection("providers").findOne({ userId: new ObjectId(session.id) }, { projection: { privateDocuments: 0, paymentDetails: 0 } });
    return Response.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load your profile";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in to create a professional profile" }, { status: 401 });
  try {
    const body = await request.formData();
    const businessName = text(body.get("businessName"), 100);
    const service = text(body.get("service"), 60);
    const locality = text(body.get("locality"), 100);
    const description = text(body.get("description"), 800);
    const phone = text(body.get("phone"), 24);
    const experienceYears = Math.min(60, Math.max(0, Number(body.get("experienceYears"))));
    const startingPrice = Math.min(1_000_000, Math.max(0, Number(body.get("startingPrice"))));
    const latitude = Number(body.get("latitude"));
    const longitude = Number(body.get("longitude"));
    const validLocation = Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
    if (businessName.length < 2 || !service || locality.length < 2 || description.length < 30 || phone.length < 10 || !Number.isFinite(experienceYears) || !Number.isFinite(startingPrice) || !validLocation) {
      return Response.json({ error: "Complete all required profile fields with valid information" }, { status: 400 });
    }
    const db = await getMongoDb();
    await db.collection("providers").createIndex({ location: "2dsphere" });
    const userId = new ObjectId(session.id);
    const existing = await db.collection("providers").findOne({ userId });
    const profilePhoto = body.get("profilePhoto");
    const idCardFront = body.get("idCardFront");
    const idCardBack = body.get("idCardBack");
    const hasProfilePhoto = profilePhoto instanceof File && profilePhoto.size > 0;
    const hasIdFront = idCardFront instanceof File && idCardFront.size > 0;
    const hasIdBack = idCardBack instanceof File && idCardBack.size > 0;
    if (!hasProfilePhoto && !existing?.profilePhotoId) return Response.json({ error: "Upload a clear profile photo" }, { status: 400 });
    if (!hasIdFront && !existing?.idCardFrontId) return Response.json({ error: "Upload the front of a government-issued ID card" }, { status: 400 });

    const now = new Date();
    const initials = session.fullName.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join("").toUpperCase() || "LS";
    const uploaded: ObjectId[] = [];
    const fileUpdates: Record<string, ObjectId> = {};
    try {
      if (hasProfilePhoto) { fileUpdates.profilePhotoId = await saveProviderFile(db, profilePhoto, "profile-photo", userId); uploaded.push(fileUpdates.profilePhotoId); }
      if (hasIdFront) { fileUpdates.idCardFrontId = await saveProviderFile(db, idCardFront, "id-front", userId); uploaded.push(fileUpdates.idCardFrontId); }
      if (hasIdBack) { fileUpdates.idCardBackId = await saveProviderFile(db, idCardBack, "id-back", userId); uploaded.push(fileUpdates.idCardBackId); }
    } catch (error) {
      await Promise.all(uploaded.map(id => deleteProviderFile(db, id)));
      throw error;
    }
    await db.collection("providers").updateOne(
      { userId },
      {
        $set: { name: session.fullName, businessName, service, locality, location: { type: "Point", coordinates: [longitude, latitude] }, description, phone, experienceYears, startingPrice, available: body.get("available") === "on", emergency: body.get("emergency") === "on", ...fileUpdates, published: false, verified: false, status: "pending", verificationStatus: "pending", rejectionReason: "", submittedAt: now, initials, updatedAt: now },
        $setOnInsert: { userId, averageRating: 0, reviewCount: 0, completedJobs: 0, distanceKm: 5, createdAt: now },
      },
      { upsert: true },
    );
    if (hasProfilePhoto) await deleteProviderFile(db, existing?.profilePhotoId);
    if (hasIdFront) await deleteProviderFile(db, existing?.idCardFrontId);
    if (hasIdBack) await deleteProviderFile(db, existing?.idCardBackId);
    await db.collection("users").updateOne({ _id: userId }, { $set: { role: "provider", updatedAt: now } });
    const user: SessionUser = { ...session, role: "provider" };
    await createSession(user);
    return Response.json({ ok: true, user, verificationStatus: "pending" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save your profile";
    return Response.json({ error: message.includes("MONGODB_URI") ? "Profile storage is not configured" : message }, { status: 500 });
  }
}
