import { ObjectId } from "mongodb";
import { getSession } from "../../../../lib/auth";
import { getMongoDb } from "../../../../lib/mongodb";

export const runtime = "nodejs";

const transitions: Record<string, { from: string[]; to: string }> = {
  accept: { from: ["open", "quoted"], to: "accepted" },
  confirm: { from: ["accepted"], to: "confirmed" },
  cancel: { from: ["open", "quoted", "accepted", "confirmed", "in_progress"], to: "cancelled" },
  start: { from: ["confirmed"], to: "in_progress" },
  complete: { from: ["in_progress"], to: "in_progress" },
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await context.params;
  if (!session || !ObjectId.isValid(session.id)) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid request" }, { status: 400 });
  const body = await request.json() as { action?: string; providerId?: string; finalAmount?: unknown };
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
    } else if (body.action === "confirm") {
      if (!isCustomer) return Response.json({ error: "Only the customer can confirm the selected provider" }, { status: 403 });
      if (!assignedProviderId) return Response.json({ error: "Select a provider before confirming the job" }, { status: 409 });
    } else if (body.action === "cancel") {
      if (!isCustomer) {
        if (!assignedProviderId) return Response.json({ error: "Only the customer can cancel an unassigned request" }, { status: 403 });
        const profile = await db.collection("providers").findOne({ userId, _id: assignedProviderId, status: { $ne: "disabled" } });
        if (!profile) return Response.json({ error: "Only this job's customer or selected provider can cancel it" }, { status: 403 });
      }
    } else {
      if (!assignedProviderId) return Response.json({ error: "No provider has been selected" }, { status: 409 });
      if (!isCustomer) {
        const profile = await db.collection("providers").findOne({ userId, _id: assignedProviderId, status: { $ne: "disabled" } });
        if (!profile) return Response.json({ error: "Only this job's customer or selected provider can update it" }, { status: 403 });
      }
    }

    const now = new Date();
    const statusDetails: Record<string, unknown> = {};
    if (["cancel", "start", "complete"].includes(String(body.action))) {
      statusDetails.providerLocationSharing = false;
      statusDetails.providerTrackingStoppedAt = now;
    }
    if (body.action === "confirm") statusDetails.confirmedAt = now;
    if (body.action === "start") {
      statusDetails.startedAt = now;
      statusDetails.arrivedAt = record.arrivedAt instanceof Date ? record.arrivedAt : now;
    }
    if (body.action === "cancel") {
      statusDetails.cancelledAt = now;
      statusDetails.cancelledByRole = session.role;
    }
    if (body.action === "complete") {
      const submittedAmount = Number(body.finalAmount);
      if (body.finalAmount === undefined || body.finalAmount === null || body.finalAmount === "" || !Number.isFinite(submittedAmount) || submittedAmount < 0 || submittedAmount > 10_000_000) {
        return Response.json({ error: "Enter the final amount charged before completing this work" }, { status: 400 });
      }
      const existingAmount = Number(record.finalAmount);
      const otherSideConfirmed = isCustomer ? Boolean(record.providerCompletionConfirmedAt) : Boolean(record.customerCompletionConfirmedAt);
      const ownSideConfirmed = isCustomer ? Boolean(record.customerCompletionConfirmedAt) : Boolean(record.providerCompletionConfirmedAt);
      if (ownSideConfirmed) return Response.json({ error: isCustomer ? "You already marked payment as given" : "You already marked payment as received" }, { status: 409 });
      if (otherSideConfirmed && Number.isFinite(existingAmount) && existingAmount !== submittedAmount) {
        return Response.json({ error: `The other person confirmed ₹${existingAmount.toLocaleString("en-IN")}. Enter the same final amount or discuss it in Messages.` }, { status: 409 });
      }
      statusDetails.startedAt = record.startedAt instanceof Date ? record.startedAt : now;
      statusDetails.finalAmount = submittedAmount;
      if (isCustomer) {
        statusDetails.customerCompletionConfirmedAt = now;
        statusDetails.paymentGivenAt = now;
      } else {
        statusDetails.providerCompletionConfirmedAt = now;
        statusDetails.paymentReceivedAt = now;
      }
    }
    const completionConfirmedByBoth = body.action === "complete" && Boolean(isCustomer ? record.providerCompletionConfirmedAt : record.customerCompletionConfirmedAt);
    const nextStatus = completionConfirmedByBoth ? "completed" : transition.to;
    if (nextStatus === "completed") statusDetails.completedAt = now;
    const updateFilter: Record<string, unknown> = { _id: requestId, status: { $in: transition.from } };
    if (body.action === "complete") updateFilter[isCustomer ? "customerCompletionConfirmedAt" : "providerCompletionConfirmedAt"] = { $exists: false };
    let result = await db.collection("serviceRequests").findOneAndUpdate(
      updateFilter,
      { $set: { status: nextStatus, assignedProviderId, assignedProviderName, updatedAt: now, ...statusDetails }, $push: { statusHistory: { status: nextStatus, changedAt: now, changedBy: userId } } as never },
      { returnDocument: "after" },
    );
    if (!result) return Response.json({ error: "Request status changed. Refresh and try again." }, { status: 409 });
    if (body.action === "complete" && result.status !== "completed" && result.customerCompletionConfirmedAt && result.providerCompletionConfirmedAt) {
      result = await db.collection("serviceRequests").findOneAndUpdate(
        { _id: requestId, status: "in_progress", customerCompletionConfirmedAt: { $exists: true }, providerCompletionConfirmedAt: { $exists: true } },
        { $set: { status: "completed", completedAt: now, updatedAt: now, providerLocationSharing: false, providerTrackingStoppedAt: now }, $push: { statusHistory: { status: "completed", changedAt: now, changedBy: userId } } as never },
        { returnDocument: "after" },
      ) ?? result;
    }
    if (result.status === "completed" && assignedProviderId) {
      const completedJobs = await db.collection("serviceRequests").countDocuments({ assignedProviderId, status: "completed" });
      await db.collection("providers").updateOne({ _id: assignedProviderId }, { $set: { completedJobs, updatedAt: now } });
    }
    return Response.json({ data: { _id: id, status: result.status, assignedProviderId: assignedProviderId ? String(assignedProviderId) : "", assignedProviderName, confirmedAt: result.confirmedAt, arrivedAt: result.arrivedAt, startedAt: result.startedAt, completedAt: result.completedAt, cancelledAt: result.cancelledAt, cancelledByRole: result.cancelledByRole, customerCompletionConfirmedAt: result.customerCompletionConfirmedAt, providerCompletionConfirmedAt: result.providerCompletionConfirmedAt, paymentGivenAt: result.paymentGivenAt, paymentReceivedAt: result.paymentReceivedAt, finalAmount: Number(result.finalAmount ?? 0) } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update request" }, { status: 500 });
  }
}
