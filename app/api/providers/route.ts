import { and, desc, eq, gte, like } from "drizzle-orm";
import { getDb } from "../../../db";
import { providerProfiles } from "../../../db/schema";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim().slice(0, 80);
  const verified = url.searchParams.get("verified") === "true";
  const minRating = Math.min(5, Math.max(0, Number(url.searchParams.get("rating") ?? 0)));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
  const filters = [gte(providerProfiles.averageRating, minRating)];
  if (search) filters.push(like(providerProfiles.businessName, `%${search.replaceAll("%", "\\%")}%`));
  if (verified) filters.push(eq(providerProfiles.verified, true));
  try {
    const rows = await getDb().select().from(providerProfiles).where(and(...filters)).orderBy(desc(providerProfiles.averageRating)).limit(limit);
    return Response.json({ data: rows, meta: { limit, count: rows.length } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load providers" }, { status: 500 });
  }
}
