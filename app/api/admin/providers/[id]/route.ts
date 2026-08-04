import { ObjectId } from "mongodb";
import { requireAdmin } from "../../../../../lib/admin-auth";
import { getMongoDb } from "../../../../../lib/mongodb";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admin sign-in required" }, { status: 401 });
  try {
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid provider" }, { status: 400 });
    const body = await request.json();
    const action = body.action === "approve" ? "approve" : body.action === "reject" ? "reject" : "";
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
    if (!action || (action === "reject" && reason.length < 5)) return Response.json({ error: "Add a clear rejection reason" }, { status: 400 });
    const now = new Date();
    const update = action === "approve"
      ? { status: "active", verificationStatus: "approved", published: true, verified: true, rejectionReason: "", reviewedAt: now, reviewedBy: admin.email, updatedAt: now }
      : { status: "rejected", verificationStatus: "rejected", published: false, verified: false, rejectionReason: reason, reviewedAt: now, reviewedBy: admin.email, updatedAt: now };
    const db = await getMongoDb();
    const result = await db.collection("providers").updateOne({ _id: new ObjectId(id) }, { $set: update });
    if (!result.matchedCount) return Response.json({ error: "Provider not found" }, { status: 404 });
    return Response.json({ ok: true, status: update.verificationStatus });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to review provider" }, { status: 500 }); }
}
