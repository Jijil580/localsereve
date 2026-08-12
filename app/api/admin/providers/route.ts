import { requireAdmin } from "../../../../lib/admin-auth";
import { getMongoDb } from "../../../../lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) return Response.json({ error: "Admin sign-in required" }, { status: 401 });
  try {
    const db = await getMongoDb();
    const rows = await db.collection("providers").find({}, { projection: { paymentDetails: 0 } }).sort({ submittedAt: -1, updatedAt: -1 }).limit(200).toArray();
    return Response.json({ data: rows.map(row => ({ ...row, verificationStatus: row.verified || row.verificationStatus === "approved" ? "approved" : "unverified", _id: String(row._id), userId: String(row.userId), profilePhotoId: row.profilePhotoId ? String(row.profilePhotoId) : null, idCardFrontId: row.idCardFrontId ? String(row.idCardFrontId) : null, idCardBackId: row.idCardBackId ? String(row.idCardBackId) : null })) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load submissions" }, { status: 500 }); }
}
