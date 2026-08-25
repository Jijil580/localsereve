export const runtime = "nodejs";

function clean(value:unknown){return typeof value==="string"?value.trim():"";}
function validIndiaPoint(latitude:number,longitude:number){return Number.isFinite(latitude)&&latitude>=6&&latitude<=38&&Number.isFinite(longitude)&&longitude>=68&&longitude<=98;}

export async function GET(request:Request){
  const requestUrl=new URL(request.url);
  const latitude=Number(requestUrl.searchParams.get("lat"));
  const longitude=Number(requestUrl.searchParams.get("lng"));
  if(!validIndiaPoint(latitude,longitude))return Response.json({error:"Choose a valid location in India"},{status:400});
  try{
    const url=new URL("https://photon.komoot.io/reverse");
    url.searchParams.set("lat",String(latitude));
    url.searchParams.set("lon",String(longitude));
    url.searchParams.set("lang","en");
    const response=await fetch(url,{headers:{"user-agent":"Nearleo/1.0 (https://nearleo.com)","accept-language":"en-IN,en;q=0.9"},cache:"no-store",signal:AbortSignal.timeout(5_000)});
    if(!response.ok)throw new Error("Address lookup failed");
    const payload=await response.json() as {features?:Array<{properties?:Record<string,unknown>}>};
    const properties=payload.features?.[0]?.properties??{};
    const parts=[properties.name,properties.street,properties.locality,properties.district,properties.city,properties.county,properties.state,properties.postcode,properties.country]
      .map(clean)
      .filter((part,index,all)=>part&&all.indexOf(part)===index);
    const label=parts.join(", ").slice(0,180)||"Selected map location";
    return Response.json({data:{label,latitude,longitude}},{headers:{"cache-control":"private, max-age=0, no-store"}});
  }catch{return Response.json({data:{label:"Selected map location",latitude,longitude}});}
}
