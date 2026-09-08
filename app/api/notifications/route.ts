import { ObjectId } from "mongodb";
import { getSession } from "../../../lib/auth";
import { getMongoDb } from "../../../lib/mongodb";
export const runtime="nodejs";
export async function GET(){
  const session=await getSession();if(!session||!ObjectId.isValid(session.id))return Response.json({count:0,messageCount:0,target:"messages"});
  try{
    const db=await getMongoDb();const userId=new ObjectId(session.id);
    const customerRows=await db.collection("serviceRequests").find({customerId:userId,"messages":{$elemMatch:{senderRole:{$ne:"customer"},readByCustomer:{$ne:true}}}},{projection:{messages:1}}).toArray();
    const customerMessageCount=customerRows.reduce((sum,row)=>sum+(Array.isArray(row.messages)?row.messages.filter((message:{senderRole?:string;readByCustomer?:boolean})=>message.senderRole!=="customer"&&!message.readByCustomer).length:0),0);
    if(session.role!=="provider")return Response.json({count:customerMessageCount,messageCount:customerMessageCount,target:"messages"});

    const profile=await db.collection("providers").findOne({userId,status:{$ne:"disabled"}},{projection:{_id:1,service:1}});
    if(!profile)return Response.json({count:customerMessageCount,messageCount:customerMessageCount,target:"messages"});
    const user=await db.collection("users").findOne({_id:userId},{projection:{notificationsSeenAt:1}});const since=user?.notificationsSeenAt||new Date(0);
    const escaped=String(profile.service||"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const newRequests=await db.collection("serviceRequests").countDocuments({customerId:{$ne:userId},service:{$regex:`^${escaped}$`,$options:"i"},createdAt:{$gt:since},status:{$in:["open","quoted"]}});
    const providerRows=await db.collection("serviceRequests").find({"messages":{$elemMatch:{providerId:profile._id,senderRole:{$ne:"provider"},readByProvider:{$ne:true}}}},{projection:{messages:1}}).toArray();
    const providerMessageCount=providerRows.reduce((sum,row)=>sum+(Array.isArray(row.messages)?row.messages.filter((message:{providerId?:ObjectId;senderRole?:string;readByProvider?:boolean})=>String(message.providerId||"")===String(profile._id)&&message.senderRole!=="provider"&&!message.readByProvider).length:0),0);
    const messageCount=customerMessageCount+providerMessageCount;
    return Response.json({count:newRequests+messageCount,messageCount,target:newRequests?"dashboard":"messages"});
  }catch{return Response.json({count:0,messageCount:0,target:"messages"})}
}
export async function POST(){const session=await getSession();if(session&&ObjectId.isValid(session.id)){const db=await getMongoDb();await db.collection("users").updateOne({_id:new ObjectId(session.id)},{$set:{notificationsSeenAt:new Date()}})}return Response.json({ok:true})}
