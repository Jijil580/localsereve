import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { bookings } from "../../../db/schema";

export async function POST(request: Request) {
  const viewer = await getChatGPTUser();
  if (!viewer) return Response.json({ error: "Sign in is required" }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const providerId = typeof body.providerId === "string" ? body.providerId : "";
  const addressId = typeof body.addressId === "string" ? body.addressId : "";
  const scheduledAt = typeof body.scheduledAt === "string" ? new Date(body.scheduledAt) : null;
  if (!providerId || !addressId || !scheduledAt || Number.isNaN(scheduledAt.getTime())) return Response.json({ error: "providerId, addressId and a valid scheduledAt are required" }, { status: 400 });
  const id = crypto.randomUUID();
  try {
    const [booking] = await getDb().insert(bookings).values({ id, customerId: viewer.userId, providerId, addressId, scheduledAt, status: "new_request" }).returning();
    return Response.json({ data: booking }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create booking" }, { status: 500 });
  }
}
