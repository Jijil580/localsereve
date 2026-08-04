import { ObjectId } from "mongodb";
import { Readable } from "node:stream";
import { getSession } from "../../../../../lib/auth";
import { getMongoDb } from "../../../../../lib/mongodb";
import { readProviderFile } from "../../../../../lib/provider-files";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.id)) return new Response("Not found", { status: 404 });
  const db = await getMongoDb();
  const provider = await db.collection("providers").findOne({ userId: new ObjectId(session.id) }, { projection: { profilePhotoId: 1 } });
  if (!(provider?.profilePhotoId instanceof ObjectId)) return new Response("Not found", { status: 404 });
  const stored = await readProviderFile(db, provider.profilePhotoId);
  if (!stored) return new Response("Not found", { status: 404 });
  return new Response(Readable.toWeb(stored.stream) as ReadableStream, { headers: { "content-type": String(stored.file.metadata?.contentType ?? "image/jpeg"), "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
}
