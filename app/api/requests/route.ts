import { ObjectId } from "mongodb";
import { getSession } from "../../../lib/auth";
import { getMongoDb } from "../../../lib/mongodb";

export const runtime = "nodejs";

function text(value: unknown, maximum: number) { return typeof value === "string" ? value.trim().slice(0, maximum) : ""; }

export async function GET() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.id)) return Response.json({ error: "Sign in to view your requests" }, { status: 401 });
  try {
    const db = await getMongoDb();
    const rows = await db.collection("serviceRequests").find({ customerId: new ObjectId(session.id) }).sort({ createdAt: -1 }).limit(100).toArray();
    return Response.json({ data: rows.map(row => ({ ...row, _id: String(row._id), customerId: String(row.customerId) })) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load requests" }, { status: 500 }); }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.id)) return Response.json({ error: "Sign in before posting a request" }, { status: 401 });
  try {
    const body = await request.json();
    const service = text(body.service, 60);
    const description = text(body.description, 1200);
    const address = text(body.address, 240);
    const preferredDate = text(body.preferredDate, 20);
    const preferredTime = text(body.preferredTime, 30);
    const urgency = text(body.urgency, 30) || "Flexible";
    if (!service || description.length < 10 || address.length < 5 || !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) return Response.json({ error: "Complete the service, description, address and preferred date" }, { status: 400 });
    const now = new Date();
    const record = { requestNumber: `REQ-${Date.now().toString(36).toUpperCase()}`, customerId: new ObjectId(session.id), customerName: session.fullName, service, description, address, preferredDate, preferredTime, urgency, status: "open", quoteCount: 0, createdAt: now, updatedAt: now };
    const db = await getMongoDb();
    await db.collection("serviceRequests").createIndex({ customerId: 1, createdAt: -1 });
    const result = await db.collection("serviceRequests").insertOne(record);
    return Response.json({ data: { ...record, _id: String(result.insertedId), customerId: session.id } }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to post request" }, { status: 500 }); }
}
