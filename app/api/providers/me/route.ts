import { ObjectId } from "mongodb";
import { createSession, getSession, type SessionUser } from "../../../../lib/auth";
import { getMongoDb } from "../../../../lib/mongodb";

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
    const body = await request.json();
    const businessName = text(body.businessName, 100);
    const service = text(body.service, 60);
    const locality = text(body.locality, 100);
    const description = text(body.description, 800);
    const phone = text(body.phone, 24);
    const coverUrl = text(body.coverUrl, 500);
    const experienceYears = Math.min(60, Math.max(0, Number(body.experienceYears)));
    const startingPrice = Math.min(1_000_000, Math.max(0, Number(body.startingPrice)));
    if (businessName.length < 2 || !service || locality.length < 2 || description.length < 30 || phone.length < 10 || !Number.isFinite(experienceYears) || !Number.isFinite(startingPrice)) {
      return Response.json({ error: "Complete all required profile fields with valid information" }, { status: 400 });
    }
    if (coverUrl && !/^https:\/\//i.test(coverUrl)) return Response.json({ error: "Portfolio image must use a secure https URL" }, { status: 400 });

    const db = await getMongoDb();
    const userId = new ObjectId(session.id);
    const now = new Date();
    const initials = session.fullName.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join("").toUpperCase() || "LS";
    await db.collection("providers").updateOne(
      { userId },
      {
        $set: { name: session.fullName, businessName, service, locality, description, phone, coverUrl, experienceYears, startingPrice, available: Boolean(body.available), emergency: Boolean(body.emergency), published: true, status: "active", initials, updatedAt: now },
        $setOnInsert: { userId, verified: false, averageRating: 0, reviewCount: 0, completedJobs: 0, distanceKm: 5, createdAt: now },
      },
      { upsert: true },
    );
    await db.collection("users").updateOne({ _id: userId }, { $set: { role: "provider", updatedAt: now } });
    const user: SessionUser = { ...session, role: "provider" };
    await createSession(user);
    return Response.json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save your profile";
    return Response.json({ error: message.includes("MONGODB_URI") ? "Profile storage is not configured" : message }, { status: 500 });
  }
}
