import { ObjectId } from "mongodb";
import { Readable } from "node:stream";
import { getMongoDb } from "../../../../../../lib/mongodb";
import { readProviderFile } from "../../../../../../lib/provider-files";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string; index: string }> }) {
  const { id, index: indexText } = await context.params;
  const index = Number(indexText);
  if (!ObjectId.isValid(id) || !Number.isInteger(index) || index < 0 || index > 3) return new Response("Not found", { status: 404 });
  const db = await getMongoDb();
  const provider = await db.collection("providers").findOne({ _id: new ObjectId(id), status: "active", published: true, verificationStatus: "approved" }, { projection: { portfolioImageIds: 1 } });
  const fileId = Array.isArray(provider?.portfolioImageIds) ? provider.portfolioImageIds[index] : null;
  if (!(fileId instanceof ObjectId)) return new Response("Not found", { status: 404 });
  const stored = await readProviderFile(db, fileId);
  if (!stored || stored.file.metadata?.kind !== "recent-work") return new Response("Not found", { status: 404 });
  return new Response(Readable.toWeb(stored.stream) as ReadableStream, { headers: { "content-type": String(stored.file.metadata?.contentType ?? "image/jpeg"), "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff" } });
}
