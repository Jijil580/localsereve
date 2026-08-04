import { getMongoDb } from "../../../lib/mongodb";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const bookingToken = process.env.BOOKING_API_TOKEN;
  if (!bookingToken) return Response.json({ error: "Booking API is not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${bookingToken}`) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  const body = await request.json() as Record<string, unknown>;
  const providerId = typeof body.providerId === "string" ? body.providerId.trim() : "";
  const customerId = typeof body.customerId === "string" ? body.customerId.trim() : "";
  const addressId = typeof body.addressId === "string" ? body.addressId.trim() : "";
  const scheduledAt = typeof body.scheduledAt === "string" ? new Date(body.scheduledAt) : null;
  if (!providerId || !customerId || !addressId || !scheduledAt || Number.isNaN(scheduledAt.getTime())) {
    return Response.json({ error: "providerId, customerId, addressId and a valid scheduledAt are required" }, { status: 400 });
  }
  const booking = {
    bookingNumber: `LS-${Date.now().toString(36).toUpperCase()}`,
    providerId, customerId, addressId, scheduledAt, status: "new_request",
    statusHistory: [{ status: "new_request", changedAt: new Date(), changedBy: customerId }],
    createdAt: new Date(), updatedAt: new Date(),
  };
  try {
    const db = await getMongoDb();
    const result = await db.collection("bookings").insertOne(booking);
    return Response.json({ data: { ...booking, _id: result.insertedId } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create booking";
    return Response.json({ error: message }, { status: message.includes("MONGODB_URI") ? 503 : 500 });
  }
}
