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
    const customerId = new ObjectId(session.id);
    const providerId = new ObjectId(id);
    const access = await db.collection("whatsappContactRequests").findOne({ customerId, providerId });
    if (!access) return Response.json({ status: "none" });
    if (access.status !== "approved") return Response.json({ status: access.status });
    const provider = await db.collection("providers").findOne({ _id: providerId, status: { $ne: "disabled" } }, { projection: { phone: 1, name: 1, businessName: 1 } });
    const digits = String(provider?.phone ?? "").replace(/\D/g, "");
    if (!provider || digits.length < 10) return Response.json({ error: "Provider WhatsApp contact is unavailable" }, { status: 404 });
    const international = digits.length === 10 ? `91${digits}` : digits;
    const message = encodeURIComponent(`Hello ${String(provider.name ?? provider.businessName ?? "there")}, I found your profile on Nearleo.`);
    return Response.json({ status: "approved", whatsappUrl: `https://wa.me/${international}?text=${message}` });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load WhatsApp access" }, { status: 500 }); }
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await context.params;
  if (!session || session.role !== "customer" || !ObjectId.isValid(session.id)) return Response.json({ error: "Sign in as a customer to request WhatsApp contact" }, { status: 401 });
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid provider" }, { status: 400 });
  try {
    const db = await getMongoDb();
    const customerId = new ObjectId(session.id);
    const providerId = new ObjectId(id);
    const provider = await db.collection("providers").findOne({ _id: providerId, status: { $ne: "disabled" } }, { projection: { service: 1, businessName: 1 } });
    if (!provider) return Response.json({ error: "Provider not found" }, { status: 404 });
    const existing = await db.collection("whatsappContactRequests").findOne({ customerId, providerId });
    if (existing) return Response.json({ status: existing.status, duplicate: true });
    const related = await db.collection("serviceRequests").findOne({ customerId, $or: [{ preferredProviderId: providerId }, { "responses.providerId": providerId }] }, { sort: { createdAt: -1 }, projection: { requestNumber: 1, service: 1 } });
    const now = new Date();
    const record = { customerId, customerName: session.fullName, providerId, providerBusiness: String(provider.businessName ?? "Service provider"), service: String(related?.service ?? provider.service ?? "Local service"), requestNumber: String(related?.requestNumber ?? ""), status: "pending", requestedAt: now, updatedAt: now };
    await db.collection("whatsappContactRequests").createIndex({ customerId: 1, providerId: 1 }, { unique: true });
    await db.collection("whatsappContactRequests").insertOne(record);
    return Response.json({ status: "pending", message: "A WhatsApp contact request has been sent to the service provider." }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("E11000")) return Response.json({ status: "pending", duplicate: true });
    return Response.json({ error: error instanceof Error ? error.message : "Unable to request WhatsApp contact" }, { status: 500 });
  }
}
