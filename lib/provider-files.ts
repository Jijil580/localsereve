import "server-only";
import { Db, GridFSBucket, ObjectId } from "mongodb";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export async function saveProviderFile(db: Db, file: File, kind: "profile-photo" | "id-front" | "id-back", userId: ObjectId) {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Upload JPG, PNG or WebP images only");
  if (!file.size || file.size > MAX_FILE_BYTES) throw new Error("Each image must be smaller than 4 MB");
  const bucket = new GridFSBucket(db, { bucketName: "providerUploads" });
  const upload = bucket.openUploadStream(`${userId}-${kind}-${Date.now()}`, { metadata: { userId, kind, contentType: file.type } });
  const completed = new Promise<ObjectId>((resolve, reject) => {
    upload.once("finish", () => resolve(upload.id));
    upload.once("error", reject);
  });
  upload.end(Buffer.from(await file.arrayBuffer()));
  return completed;
}

export async function deleteProviderFile(db: Db, id: unknown) {
  if (!(id instanceof ObjectId)) return;
  try { await new GridFSBucket(db, { bucketName: "providerUploads" }).delete(id); } catch { /* stale files should not block profile updates */ }
}

export async function readProviderFile(db: Db, id: ObjectId) {
  const bucket = new GridFSBucket(db, { bucketName: "providerUploads" });
  const files = await bucket.find({ _id: id }).limit(1).toArray();
  if (!files[0]) return null;
  return { file: files[0], stream: bucket.openDownloadStream(id) };
}
