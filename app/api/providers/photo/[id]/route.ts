import { ObjectId } from "mongodb";
import { Readable } from "node:stream";
import { getMongoDb } from "../../../../../lib/mongodb";
import { readProviderFile } from "../../../../../lib/provider-files";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return new Response("Not found", { status: 404 });
  const db = await getMongoDb();
  const provider = await db.collection("providers").findOne({ _id: new ObjectId(id), status: "active", published: true, verificationStatus: "approved" }, { projection: { profilePhotoId: 1 } });
  if (!(provider?.profilePhotoId instanceof ObjectId)) return new Response("Not found", { status: 404 });
  const stored = await readProviderFile(db, provider.profilePhotoId);
  if (!stored) return new Response("Not found", { status: 404 });
  return new Response(Readable.toWeb(stored.stream) as ReadableStream, { headers: { "content-type": String(stored.file.metadata?.contentType ?? "image/jpeg"), "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff" } });
}
