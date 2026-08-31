import { ClientSession, ObjectId, type Db } from "mongodb";
import { clearSession, getSession, verifyPassword } from "../../../../lib/auth";
import { getMongoClient } from "../../../../lib/mongodb";

export const runtime = "nodejs";

const noStoreHeaders = { "cache-control": "no-store, max-age=0" };

function uniqueObjectIds(values: unknown[]) {
  return Array.from(new Map(values.filter(value => value instanceof ObjectId).map(value => [String(value), value as ObjectId])).values());
}

async function permanentlyDeleteAccount(db: Db, userId: ObjectId, mongoSession: ClientSession) {
  const options = { session: mongoSession };
  const [providers, messageProviderIds, ownedRequests] = await Promise.all([
    db.collection("providers").find({ userId }, { ...options, projection: { _id: 1 } }).toArray(),
    db.collection("serviceRequests").distinct("messages.providerId", { "messages.senderUserId": userId }, options),
    db.collection("serviceRequests").find({ customerId: userId }, { ...options, projection: { _id: 1 } }).toArray(),
  ]);
  const providerIds = uniqueObjectIds([...providers.map(provider => provider._id), ...messageProviderIds]);
  const providerIdStrings = providerIds.map(String);
  const ownedRequestIds = ownedRequests.map(request => request._id as ObjectId);
  const referencedRequests = providerIds.length ? await db.collection("serviceRequests").find(
    { customerId: { $ne: userId }, $or: [{ assignedProviderId: { $in: providerIds } }, { preferredProviderId: { $in: providerIds } }, { "responses.providerId": { $in: providerIds } }, { "messages.providerId": { $in: providerIds } }, { "statusHistory.changedBy": userId }] },
    { ...options, projection: { _id: 1 } },
  ).toArray() : [];
  const referencedRequestIds = referencedRequests.map(request => request._id as ObjectId);

  const [likedProviderIds, reviewedProviderIds, receiptProviderIds, uploadFiles] = await Promise.all([
    db.collection("providerLikes").distinct("providerId", { userId }, options),
    db.collection("providerReviews").distinct("providerId", { customerId: userId }, options),
    ownedRequestIds.length ? db.collection("providerRequestReceipts").distinct("providerId", { requestId: { $in: ownedRequestIds } }, options) : Promise.resolve([]),
    db.collection("providerUploads.files").find({ "metadata.userId": userId }, { ...options, projection: { _id: 1 } }).toArray(),
  ]);
  const affectedLikeProviders = uniqueObjectIds(likedProviderIds);
  const affectedReviewProviders = uniqueObjectIds(reviewedProviderIds);
  const affectedReceiptProviders = uniqueObjectIds(receiptProviderIds);
  const uploadFileIds = uploadFiles.map(file => file._id as ObjectId);
  const now = new Date();

  if (providerIds.length) {
    await db.collection("serviceRequests").updateMany(
      { customerId: { $ne: userId }, assignedProviderId: { $in: providerIds } },
      {
        $set: { status: "cancelled", cancelledAt: now, cancelledByRole: "provider", providerLocationSharing: false, updatedAt: now },
        $unset: { assignedProviderId: "", assignedProviderName: "", preferredProviderId: "", providerLiveLocation: "", providerTrackingUpdatedAt: "", providerTrackingStoppedAt: "", confirmedAt: "", arrivedAt: "", startedAt: "", completedAt: "", customerCompletionConfirmedAt: "", providerCompletionConfirmedAt: "", paymentGivenAt: "", paymentReceivedAt: "", finalAmount: "" },
        $push: { statusHistory: { status: "cancelled", changedAt: now } },
      } as never,
      options,
    );
    await db.collection("serviceRequests").updateMany(
      { customerId: { $ne: userId }, $or: [{ "responses.providerId": { $in: providerIds } }, { "messages.providerId": { $in: providerIds } }, { "statusHistory.changedBy": userId }] },
      { $pull: { responses: { providerId: { $in: providerIds } }, messages: { providerId: { $in: providerIds } }, statusHistory: { changedBy: userId } } } as never,
      options,
    );
    await db.collection("serviceRequests").updateMany(
      { customerId: { $ne: userId }, preferredProviderId: { $in: providerIds } },
      { $unset: { preferredProviderId: "" }, $set: { updatedAt: now } },
      options,
    );
    if (referencedRequestIds.length) {
      await db.collection("serviceRequests").updateMany(
        { _id: { $in: referencedRequestIds } },
        [{ $set: { quoteCount: { $size: { $ifNull: ["$responses", []] } } } }],
        options,
      );
      await db.collection("serviceRequests").updateMany(
        { _id: { $in: referencedRequestIds }, status: "quoted", quoteCount: 0, assignedProviderId: { $exists: false } },
        { $set: { status: "open", updatedAt: now } },
        options,
      );
    }
  }

  if (ownedRequestIds.length) await db.collection("providerRequestReceipts").deleteMany({ requestId: { $in: ownedRequestIds } }, options);
  if (providerIds.length) await db.collection("providerRequestReceipts").deleteMany({ providerId: { $in: providerIds } }, options);
  await db.collection("serviceRequests").deleteMany({ customerId: userId }, options);

  await db.collection("providerLikes").deleteMany({ $or: [{ userId }, ...(providerIds.length ? [{ providerId: { $in: providerIds } }] : [])] }, options);
  await db.collection("providerReviews").deleteMany({ $or: [{ customerId: userId }, ...(providerIds.length ? [{ providerId: { $in: providerIds } }] : [])] }, options);
  await db.collection("platformReviews").deleteMany({ userId }, options);
  await db.collection("bookings").deleteMany({
    $or: [
      { customerId: String(userId) }, { customerId: userId },
      ...(providerIdStrings.length ? [{ providerId: { $in: providerIdStrings } }, { providerId: { $in: providerIds } }] : []),
    ],
  }, options);

  if (uploadFileIds.length) {
    await db.collection("providerUploads.chunks").deleteMany({ files_id: { $in: uploadFileIds } }, options);
    await db.collection("providerUploads.files").deleteMany({ _id: { $in: uploadFileIds } }, options);
  }
  if (providerIds.length) await db.collection("providers").deleteMany({ _id: { $in: providerIds } }, options);

  const remainingLikeProviders = affectedLikeProviders.filter(id => !providerIdStrings.includes(String(id)));
  for (const providerId of remainingLikeProviders) {
    const likeCount = await db.collection("providerLikes").countDocuments({ providerId }, options);
    await db.collection("providers").updateOne({ _id: providerId }, { $set: { likeCount, updatedAt: now } }, options);
  }

  const remainingReviewProviders = affectedReviewProviders.filter(id => !providerIdStrings.includes(String(id)));
  for (const providerId of remainingReviewProviders) {
    const summary = await db.collection("providerReviews").aggregate<{ averageRating: number; reviewCount: number }>([
      { $match: { providerId, status: "published" } },
      { $group: { _id: null, averageRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
    ], options).next();
    await db.collection("providers").updateOne({ _id: providerId }, { $set: { averageRating: Number(summary?.averageRating ?? 0), reviewCount: Number(summary?.reviewCount ?? 0), updatedAt: now } }, options);
  }

  const remainingReceiptProviders = affectedReceiptProviders.filter(id => !providerIdStrings.includes(String(id)));
  for (const providerId of remainingReceiptProviders) {
    const requestsReceived = await db.collection("providerRequestReceipts").countDocuments({ providerId }, options);
    await db.collection("providers").updateOne({ _id: providerId }, { $set: { requestsReceived, requestCountUpdatedAt: now, updatedAt: now } }, options);
  }

  const deletedUser = await db.collection("users").deleteOne({ _id: userId }, options);
  if (deletedUser.deletedCount !== 1) throw new Error("Account deletion could not be completed");
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || session.role === "admin" || !ObjectId.isValid(session.id)) return Response.json({ error: "Sign in to delete your account" }, { status: 401, headers: noStoreHeaders });
  const body = await request.json().catch(() => ({})) as { password?: unknown; confirmation?: unknown };
  const password = typeof body.password === "string" ? body.password : "";
  const confirmation = typeof body.confirmation === "string" ? body.confirmation.trim() : "";
  if (confirmation !== "DELETE") return Response.json({ error: "Type DELETE exactly to confirm permanent deletion" }, { status: 400, headers: noStoreHeaders });
  if (password.length < 4) return Response.json({ error: "Enter your current password" }, { status: 400, headers: noStoreHeaders });

  try {
    const client = await getMongoClient();
    const db = client.db(process.env.MONGODB_DB ?? "localserve");
    const userId = new ObjectId(session.id);
    const account = await db.collection("users").findOne({ _id: userId, status: "active" }, { projection: { passwordHash: 1 } });
    if (!account || typeof account.passwordHash !== "string" || !(await verifyPassword(password, account.passwordHash))) {
      return Response.json({ error: "Your current password is incorrect" }, { status: 403, headers: noStoreHeaders });
    }

    await client.withSession(async mongoSession => {
      await mongoSession.withTransaction(async () => permanentlyDeleteAccount(db, userId, mongoSession));
    });
    await clearSession();
    return Response.json({ ok: true }, { headers: noStoreHeaders });
  } catch (error) {
    console.error("Nearleo permanent account deletion failed", error);
    return Response.json({ error: "We could not safely complete account deletion. No further action is needed right now; please try again." }, { status: 500, headers: noStoreHeaders });
  }
}
