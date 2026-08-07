import { ObjectId } from "mongodb";
import { getSession } from "../../../../lib/auth";
import { getMongoDb } from "../../../../lib/mongodb";

export const runtime = "nodejs";

const transitions: Record<string, { from: string[]; to: string }> = {
  accept: { from: ["open", "quoted"], to: "accepted" },
  cancel: { from: ["open", "quoted", "accepted"], to: "cancelled" },
  start: { from: ["accepted"], to: "in_progress" },
  complete: { from: ["accepted", "in_progress"], to: "completed" },
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await context.params;
  if (!session || !ObjectId.isValid(session.id)) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid request" }, { status: 400 });
  const body = await request.json() as { action?: string; providerId?: string };
  const transition = body.action ? transitions[body.action] : null;
  if (!transition) return Response.json({ error: "Unsupported status update" }, { status: 400 });

  try {
    const db = await getMongoDb();
    const requestId = new ObjectId(id);
    const userId = new ObjectId(session.id);
    const record = await db.collection("serviceRequests").findOne({ _id: requestId });
    if (!record) return Response.json({ error: "Request not found" }, { status: 404 });
    if (!transition.from.includes(String(record.status))) return Response.json({ error: "This request can no longer be updated that way" }, { status: 409 });

    const isCustomer = String(record.customerId) === session.id;
    let assignedProviderId = record.assignedProviderId instanceof ObjectId ? record.assignedProviderId : null;
    let assignedProviderName = String(record.assignedProviderName ?? "");

    if (body.action === "accept") {
      if (!isCustomer || !body.providerId || !ObjectId.isValid(body.providerId)) return Response.json({ error: "Choose a valid provider reply" }, { status: 403 });
      const reply = Array.isArray(record.responses) ? record.responses.find((item: { providerId?: ObjectId }) => String(item.providerId ?? "") === body.providerId) : null;
      if (!reply) return Response.json({ error: "Provider reply not found" }, { status: 404 });
      assignedProviderId = new ObjectId(body.providerId);
      assignedProviderName = String(reply.providerBusiness ?? reply.providerName ?? "Selected provider");
    } else if (body.action === "cancel") {
      if (!isCustomer) return Response.json({ error: "Only the customer can perform this update" }, { status: 403 });
    } else {
      if (body.action === "start" && isCustomer) return Response.json({ error: "The selected provider starts the job" }, { status: 403 });
      if (!isCustomer) {
        if (!assignedProviderId) return Response.json({ error: "No provider has been selected" }, { status: 409 });
        const profile = await db.collection("providers").findOne({ userId, _id: assignedProviderId, status: "active", verificationStatus: "approved" });
        if (!profile) return Response.json({ error: "Only the selected provider can update this job" }, { status: 403 });
      }
    }

    const now = new Date();
    const result = await db.collection("serviceRequests").findOneAndUpdate(
      { _id: requestId, status: { $in: transition.from } },
      { $set: { status: transition.to, assignedProviderId, assignedProviderName, updatedAt: now }, $push: { statusHistory: { status: transition.to, changedAt: now, changedBy: userId } } as never },
      { returnDocument: "after" },
    );
    if (!result) return Response.json({ error: "Request status changed. Refresh and try again." }, { status: 409 });
    if (transition.to === "completed" && assignedProviderId) await db.collection("providers").updateOne({ _id: assignedProviderId }, { $inc: { completedJobs: 1 } });
    return Response.json({ data: { _id: id, status: result.status, assignedProviderId: assignedProviderId ? String(assignedProviderId) : "", assignedProviderName } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update request" }, { status: 500 });
  }
}
