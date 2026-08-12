import { ObjectId } from "mongodb";
import { getSession } from "../../../../../../lib/auth";
import { getMongoDb } from "../../../../../../lib/mongodb";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "provider" || !ObjectId.isValid(session.id)) return Response.json({ error: "Provider sign-in required" }, { status: 401 });
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid request" }, { status: 400 });
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 1000) : "";
    const quoteAmount = Number(body.quoteAmount);
    const availability = typeof body.availability === "string" ? body.availability.trim().slice(0, 80) : "";
    if (message.length < 3) return Response.json({ error: "Write a reply of at least 3 characters" }, { status: 400 });
    if (!Number.isFinite(quoteAmount) || quoteAmount < 0 || quoteAmount > 10_000_000) return Response.json({ error: "Enter a valid estimated price" }, { status: 400 });
    if (availability.length < 3) return Response.json({ error: "Add your availability" }, { status: 400 });
    const db = await getMongoDb();
    const profile = await db.collection("providers").findOne({ userId: new ObjectId(session.id), status: { $ne: "disabled" } }, { projection: { service: 1, businessName: 1 } });
    if (!profile || typeof profile.service !== "string") return Response.json({ error: "Complete your provider profile before replying" }, { status: 403 });
    const servicePattern = new RegExp(`^${profile.service.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const now = new Date();
    const result = await db.collection("serviceRequests").findOneAndUpdate(
      { _id: new ObjectId(id), service: servicePattern, status: { $in: ["open", "quoted"] } },
      { $push: { responses: { providerId: profile._id, providerName: session.fullName, providerBusiness: String(profile.businessName ?? session.fullName), message, quoteAmount, availability, createdAt: now } } as never, $set: { status: "quoted", updatedAt: now }, $inc: { quoteCount: 1 } },
      { returnDocument: "after", projection: { responses: 1, quoteCount: 1, status: 1 } },
    );
    if (!result) return Response.json({ error: "Request not found or does not match your service" }, { status: 404 });
    return Response.json({ ok: true, quoteCount: result.quoteCount, status: result.status });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to send reply" }, { status: 500 }); }
}
