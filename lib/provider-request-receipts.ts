import type { Db } from "mongodb";
import { ObjectId } from "mongodb";

type ReceiptPair = { providerId: ObjectId; requestId: ObjectId };

export async function recordProviderRequestReceipts(db: Db, pairs: ReceiptPair[]) {
  const uniquePairs = Array.from(new Map(pairs.map(pair => [`${pair.providerId}:${pair.requestId}`, pair])).values());
  if (!uniquePairs.length) return new Map<string, number>();

  const receipts = db.collection("providerRequestReceipts");
  await receipts.createIndex({ providerId: 1, requestId: 1 }, { unique: true });
  const now = new Date();
  await receipts.bulkWrite(uniquePairs.map(pair => ({
    updateOne: {
      filter: { providerId: pair.providerId, requestId: pair.requestId },
      update: { $setOnInsert: { providerId: pair.providerId, requestId: pair.requestId, receivedAt: now } },
      upsert: true,
    },
  })), { ordered: false });

  const providerIds = Array.from(new Map(uniquePairs.map(pair => [String(pair.providerId), pair.providerId])).values());
  const counts = await getProviderRequestCounts(db, providerIds);
  await db.collection("providers").bulkWrite(providerIds.map(providerId => ({
    updateOne: {
      filter: { _id: providerId },
      update: { $set: { requestsReceived: counts.get(String(providerId)) ?? 0, requestCountUpdatedAt: now } },
    },
  })), { ordered: false });
  return counts;
}

export async function getProviderRequestCounts(db: Db, providerIds: ObjectId[]) {
  if (!providerIds.length) return new Map<string, number>();
  const rows = await db.collection("providerRequestReceipts").aggregate([
    { $match: { providerId: { $in: providerIds } } },
    { $group: { _id: "$providerId", count: { $sum: 1 } } },
  ]).toArray();
  return new Map(rows.map(row => [String(row._id), Math.max(0, Number(row.count ?? 0))]));
}
