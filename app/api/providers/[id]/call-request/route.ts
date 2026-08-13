import { ObjectId } from "mongodb";
import { getSession } from "../../../../../lib/auth";
import { getMongoDb } from "../../../../../lib/mongodb";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await context.params;
  if (!session || session.role !== "customer" || !ObjectId.isValid(session.id)) return Response.json({ error: "Customer sign-in required" }, { status: 401 });
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid provider" }, { status: 400 });
  try {
    const db = await getMongoDb();
    const access = await db.collection("callContactRequests").findOne({ customerId: new ObjectId(session.id), providerId: new ObjectId(id) });
    return Response.json({ status: access?.status ?? "none" });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load audio-call access" }, { status: 500 });
  }
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await context.params;
  if (!session || session.role !== "customer" || !ObjectId.isValid(session.id)) return Response.json({ error: "Sign in as a customer to request an audio call" }, { status: 401 });
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid provider" }, { status: 400 });
  try {
    const db = await getMongoDb();
    const customerId = new ObjectId(session.id);
    const providerId = new ObjectId(id);
    const provider = await db.collection("providers").findOne({ _id: providerId, status: { $ne: "disabled" }, published: true }, { projection: { service: 1, businessName: 1 } });
    if (!provider) return Response.json({ error: "Provider not found" }, { status: 404 });
    const collection = db.collection("callContactRequests");
    const existing = await collection.findOne({ customerId, providerId });
    if (existing?.status === "pending" || existing?.status === "approved") return Response.json({ status: existing.status, duplicate: true });
    const related = await db.collection("serviceRequests").findOne({ customerId, $or: [{ preferredProviderId: providerId }, { "responses.providerId": providerId }] }, { sort: { createdAt: -1 }, projection: { requestNumber: 1, service: 1 } });
    const now = new Date();
    const record = {
      customerId,
      customerName: session.fullName.slice(0, 100),
      providerId,
      providerBusiness: String(provider.businessName ?? "Service provider").slice(0, 100),
      service: String(related?.service ?? provider.service ?? "Local service").slice(0, 60),
      requestNumber: String(related?.requestNumber ?? "").slice(0, 40),
      status: "pending",
      requestedAt: now,
      updatedAt: now,
    };
    await collection.createIndex({ customerId: 1, providerId: 1 }, { unique: true });
    if (existing) {
      await collection.updateOne({ _id: existing._id }, { $set: record, $unset: { respondedAt: "" } });
      return Response.json({ status: "pending", message: "A new audio-call request has been sent to the provider." });
    }
    await collection.insertOne(record);
    return Response.json({ status: "pending", message: "An audio-call request has been sent to the provider." }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("E11000")) return Response.json({ status: "pending", duplicate: true });
    return Response.json({ error: error instanceof Error ? error.message : "Unable to request an audio call" }, { status: 500 });
  }
}
