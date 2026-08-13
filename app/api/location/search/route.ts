import { getMongoDb } from "../../../../lib/mongodb";

export const runtime = "nodejs";

type PhotonFeature = {
  geometry?: { coordinates?: unknown[] };
  properties?: Record<string, unknown>;
};

function clean(value:unknown){return typeof value==="string"?value.trim():"";}
function normalize(value:string){return value.normalize("NFKD").replace(/[^a-z0-9]/gi,"").toLocaleLowerCase("en-IN");}

async function findNearleoServiceAreas(query:string){
  try{
    const db=await getMongoDb();
    const rows=await db.collection("providers").find(
      {status:{$ne:"disabled"},locality:{$exists:true,$ne:""},"location.coordinates.1":{$exists:true}},
      {projection:{locality:1,location:1}},
    ).limit(500).toArray();
    const needle=normalize(query);
    const seen=new Set<string>();
    return rows.flatMap(row=>{
      const locality=clean(row.locality);
      const normalized=normalize(locality);
      const coordinates=row.location?.coordinates;
      if(!locality||needle.length<2||!normalized.includes(needle)||!Array.isArray(coordinates))return [];
      const longitude=Number(Number(coordinates[0]).toFixed(2));
      const latitude=Number(Number(coordinates[1]).toFixed(2));
      const key=normalized;
      if(!Number.isFinite(latitude)||latitude<6||latitude>38||!Number.isFinite(longitude)||longitude<68||longitude>98||seen.has(key))return [];
      seen.add(key);
      const [name,...contextParts]=locality.split(",").map(part=>part.trim()).filter(Boolean);
      return [{name,context:contextParts.join(", ")||"Nearleo service area",label:locality,latitude,longitude}];
    }).slice(0,6);
  }catch{return [];}
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const query = requestUrl.searchParams.get("q")?.trim().slice(0, 120) ?? "";
  const requestedLatitude = Number(requestUrl.searchParams.get("lat"));
  const requestedLongitude = Number(requestUrl.searchParams.get("lng"));
  const latitudeBias = Number.isFinite(requestedLatitude)&&requestedLatitude>=6&&requestedLatitude<=38?requestedLatitude:11.8764;
  const longitudeBias = Number.isFinite(requestedLongitude)&&requestedLongitude>=68&&requestedLongitude<=98?requestedLongitude:75.3738;
  if (query.length < 2) return Response.json({ data: [] });
  try {
    const nearleoAreas=await findNearleoServiceAreas(query);
    if(nearleoAreas.length)return Response.json({data:nearleoAreas,source:"nearleo"},{headers:{"cache-control":"public, max-age=30, s-maxage=60"}});
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "6");
    url.searchParams.set("lang", "en");
    url.searchParams.set("bbox", "68.1,6.5,97.4,35.7");
    url.searchParams.set("lat", String(latitudeBias));
    url.searchParams.set("lon", String(longitudeBias));
    url.searchParams.set("location_bias_scale", "0.7");
    const response = await fetch(url, {
      headers: { "user-agent": "Nearleo/1.0 (https://nearleo.com)", "accept-language": "en-IN,en;q=0.9" },
      next: { revalidate: 2_592_000 },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error("Location search is temporarily unavailable");
    const payload = await response.json() as { features?: PhotonFeature[] };
    const seen = new Set<string>();
    const results = (payload.features ?? []).flatMap(feature => {
      const coordinates = feature.geometry?.coordinates;
      const longitude = Number(coordinates?.[0]);
      const latitude = Number(coordinates?.[1]);
      const properties = feature.properties ?? {};
      const countryCode = clean(properties.countrycode).toUpperCase();
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (countryCode && countryCode !== "IN")) return [];
      const name = clean(properties.name) || clean(properties.street) || clean(properties.city) || clean(properties.district) || query;
      const contextParts = [properties.locality,properties.district,properties.city,properties.county,properties.state,properties.postcode,properties.country]
        .map(clean)
        .filter((part,index,all)=>part&&part.toLocaleLowerCase("en-IN")!==name.toLocaleLowerCase("en-IN")&&all.indexOf(part)===index);
      const context = contextParts.join(", ");
      const key = `${latitude.toFixed(5)}:${longitude.toFixed(5)}:${name.toLocaleLowerCase("en-IN")}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ name:name.slice(0,90), context:context.slice(0,150), label:[name,context].filter(Boolean).join(", ").slice(0,180), latitude, longitude }];
    });
    return Response.json({ data: results }, { headers: { "cache-control": "public, max-age=300, s-maxage=2592000, stale-while-revalidate=86400" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to search locations" }, { status: 500 });
  }
}
