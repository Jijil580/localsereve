import { getMongoDb } from "../../../../lib/mongodb";

export const runtime = "nodejs";

type LocationResult = {name:string;context:string;label:string;latitude:number;longitude:number};
type PhotonFeature = {geometry?:{coordinates?:unknown[]};properties?:Record<string,unknown>};

const curatedLocations:LocationResult[]=[
  {name:"Kara – Peravoor",context:"Sivapuram, Kannur, Kerala, India",label:"Kara – Peravoor, Sivapuram, Kannur, Kerala, India",latitude:11.90982,longitude:75.60921},
];

function clean(value:unknown){return typeof value==="string"?value.trim():"";}
function normalize(value:string){return value.normalize("NFKD").replace(/[^a-z0-9]/gi,"").toLocaleLowerCase("en-IN");}
function validIndiaPoint(latitude:number,longitude:number){return Number.isFinite(latitude)&&latitude>=6&&latitude<=38&&Number.isFinite(longitude)&&longitude>=68&&longitude<=98;}

function findCuratedLocations(query:string){
  const needle=normalize(query);
  return curatedLocations.filter(location=>normalize(location.label).includes(needle)||needle.includes(normalize(location.name))).slice(0,6);
}

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
      if(!validIndiaPoint(latitude,longitude)||seen.has(normalized))return [];
      seen.add(normalized);
      const [name,...contextParts]=locality.split(",").map(part=>part.trim()).filter(Boolean);
      return [{name,context:contextParts.join(", ")||"Nearleo service area",label:locality,latitude,longitude}];
    }).slice(0,6);
  }catch{return [];}
}

async function searchPhoton(query:string,latitudeBias:number,longitudeBias:number,limit=8):Promise<LocationResult[]>{
  const url=new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q",query);
  url.searchParams.set("limit",String(limit));
  url.searchParams.set("lang","en");
  url.searchParams.set("bbox","68.1,6.5,97.4,35.7");
  url.searchParams.set("lat",String(latitudeBias));
  url.searchParams.set("lon",String(longitudeBias));
  url.searchParams.set("location_bias_scale","0.7");
  const response=await fetch(url,{headers:{"user-agent":"Nearleo/1.0 (https://nearleo.com)","accept-language":"en-IN,en;q=0.9"},next:{revalidate:2_592_000},signal:AbortSignal.timeout(5_000)});
  if(!response.ok)return [];
  const payload=await response.json() as {features?:PhotonFeature[]};
  return (payload.features??[]).flatMap(feature=>{
    const coordinates=feature.geometry?.coordinates;
    const longitude=Number(coordinates?.[0]);
    const latitude=Number(coordinates?.[1]);
    const properties=feature.properties??{};
    const countryCode=clean(properties.countrycode).toUpperCase();
    if(!validIndiaPoint(latitude,longitude)||(countryCode&&countryCode!=="IN"))return [];
    const name=clean(properties.name)||clean(properties.street)||clean(properties.city)||clean(properties.district)||query;
    const contextParts=[properties.locality,properties.district,properties.city,properties.county,properties.state,properties.postcode,properties.country]
      .map(clean)
      .filter((part,index,all)=>part&&normalize(part)!==normalize(name)&&all.indexOf(part)===index);
    const context=contextParts.join(", ");
    return [{name:name.slice(0,90),context:context.slice(0,150),label:[name,context].filter(Boolean).join(", ").slice(0,180),latitude,longitude}];
  });
}

function uniqueResults(results:LocationResult[]){
  const seen=new Set<string>();
  return results.filter(result=>{const key=`${result.latitude.toFixed(5)}:${result.longitude.toFixed(5)}:${normalize(result.name)}`;if(seen.has(key))return false;seen.add(key);return true;});
}

export async function GET(request:Request){
  const requestUrl=new URL(request.url);
  const query=requestUrl.searchParams.get("q")?.trim().slice(0,120)??"";
  const requestedLatitude=Number(requestUrl.searchParams.get("lat"));
  const requestedLongitude=Number(requestUrl.searchParams.get("lng"));
  const latitudeBias=Number.isFinite(requestedLatitude)&&requestedLatitude>=6&&requestedLatitude<=38?requestedLatitude:11.8764;
  const longitudeBias=Number.isFinite(requestedLongitude)&&requestedLongitude>=68&&requestedLongitude<=98?requestedLongitude:75.3738;
  if(query.length<2)return Response.json({data:[]});
  try{
    const [curated,nearleoAreas]=await Promise.all([Promise.resolve(findCuratedLocations(query)),findNearleoServiceAreas(query)]);
    const immediate=uniqueResults([...curated,...nearleoAreas]);
    if(immediate.length)return Response.json({data:immediate,source:"nearleo"},{headers:{"cache-control":"public, max-age=30, s-maxage=60"}});

    const exactResults=await searchPhoton(query,latitudeBias,longitudeBias);
    const normalizedQuery=normalize(query);
    const hasExactMatch=exactResults.some(result=>normalize(result.name).includes(normalizedQuery)||normalize(result.label).includes(normalizedQuery));
    if(hasExactMatch)return Response.json({data:uniqueResults(exactResults).slice(0,8)},{headers:{"cache-control":"public, max-age=300, s-maxage=2592000, stale-while-revalidate=86400"}});

    const tokens=Array.from(new Set(query.split(/\s+/).map(token=>token.trim()).filter(token=>token.length>=4))).slice(0,3);
    const tokenResults=tokens.length>1?(await Promise.all(tokens.map(token=>searchPhoton(token,latitudeBias,longitudeBias,5)))).flat():[];
    const ranked=uniqueResults([...tokenResults,...exactResults]).sort((a,b)=>{
      const aScore=tokens.filter(token=>normalize(a.label).includes(normalize(token))).length;
      const bScore=tokens.filter(token=>normalize(b.label).includes(normalize(token))).length;
      return bScore-aScore;
    });
    return Response.json({data:ranked.slice(0,8)},{headers:{"cache-control":"public, max-age=300, s-maxage=2592000, stale-while-revalidate=86400"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Unable to search locations"},{status:500});}
}
