import { ObjectId } from "mongodb";
import { Readable } from "node:stream";
import { requireAdmin } from "../../../../../../lib/admin-auth";
import { getMongoDb } from "../../../../../../lib/mongodb";
import { readProviderFile } from "../../../../../../lib/provider-files";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return Response.json({ error: "Admin sign-in required" }, { status: 401 });
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid provider" }, { status: 400 });
  const side = new URL(request.url).searchParams.get("side");
  const field = side === "back" ? "idCardBackId" : side === "photo" ? "profilePhotoId" : "idCardFrontId";
  const db = await getMongoDb();
  const provider = await db.collection("providers").findOne({ _id: new ObjectId(id) }, { projection: { [field]: 1 } });
  const fileId = provider?.[field];
  if (!(fileId instanceof ObjectId)) return Response.json({ error: "Document not uploaded" }, { status: 404 });
  const stored = await readProviderFile(db, fileId);
  if (!stored) return Response.json({ error: "Document not found" }, { status: 404 });
  return new Response(Readable.toWeb(stored.stream) as ReadableStream, { headers: { "content-type": String(stored.file.metadata?.contentType ?? "application/octet-stream"), "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
}
