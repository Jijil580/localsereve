import { getMongoDb } from "../../../../lib/mongodb";

export const runtime = "nodejs";

declare global {
  // eslint-disable-next-line no-var
  var localServeLastGeocodeAt: number | undefined;
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 120) ?? "";
  if (query.length < 2) return Response.json({ data: [] });
  try {
    const db = await getMongoDb();
    const key = query.toLocaleLowerCase("en-IN");
    const cached = await db.collection("geocodeCache").findOne({ key, expiresAt: { $gt: new Date() } });
    if (cached?.results) return Response.json({ data: cached.results, cached: true });
    const elapsed = Date.now() - (global.localServeLastGeocodeAt ?? 0);
    if (elapsed < 1100) return Response.json({ error: "Please wait a moment before searching again" }, { status: 429 });
    global.localServeLastGeocodeAt = Date.now();
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");
    url.searchParams.set("countrycodes", "in");
    url.searchParams.set("addressdetails", "1");
    const response = await fetch(url, { headers: { "user-agent": "Nearleo/1.0 (https://localserviecses.vercel.app)", "accept-language": "en-IN,en;q=0.9" }, next: { revalidate: 2_592_000 } });
    if (!response.ok) throw new Error("Location search is temporarily unavailable");
    const rows = await response.json() as Array<Record<string, unknown>>;
    const results = rows.map(row => ({ label: String(row.display_name ?? "Selected location").slice(0, 180), latitude: Number(row.lat), longitude: Number(row.lon) })).filter(row => Number.isFinite(row.latitude) && Number.isFinite(row.longitude));
    await db.collection("geocodeCache").updateOne({ key }, { $set: { key, results, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), updatedAt: new Date() } }, { upsert: true });
    return Response.json({ data: results });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to search locations" }, { status: 500 }); }
}
