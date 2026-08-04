import { Db, MongoClient } from "mongodb";
import { attachDatabasePool } from "@vercel/functions";

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB ?? "localserve";

declare global {
  // eslint-disable-next-line no-var
  var localServeMongoClient: Promise<MongoClient> | undefined;
}

export async function getMongoDb(): Promise<Db> {
  if (!uri) throw new Error("MONGODB_URI is not configured");
  const clientPromise = global.localServeMongoClient ?? (() => {
    const client = new MongoClient(uri, { maxPoolSize: 10, maxIdleTimeMS: 5000, serverSelectionTimeoutMS: 5000, appName: "localserve-vercel" });
    attachDatabasePool(client);
    return client.connect();
  })();
  if (process.env.NODE_ENV !== "production") global.localServeMongoClient = clientPromise;
  return (await clientPromise).db(databaseName);
}
