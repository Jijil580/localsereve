import { ObjectId } from "mongodb";
import { getSession } from "../../../lib/auth";
import { getMongoDb } from "../../../lib/mongodb";

export const runtime="nodejs";
type RawMessage={_id?:ObjectId;providerId?:ObjectId;senderUserId?:ObjectId;senderRole?:string;senderName?:string;text?:string;createdAt?:Date;readByCustomer?:boolean;readByProvider?:boolean};
function serializeMessage(message:RawMessage){return{id:String(message._id||new ObjectId()),providerId:String(message.providerId||""),senderUserId:String(message.senderUserId||""),senderRole:String(message.senderRole||"customer"),senderName:String(message.senderName||"Nearleo user"),text:String(message.text||""),createdAt:message.createdAt||new Date(),readByCustomer:Boolean(message.readByCustomer),readByProvider:Boolean(message.readByProvider)}}

export async function GET(){
  const session=await getSession();if(!session||!ObjectId.isValid(session.id))return Response.json({error:"Sign in to view messages"},{status:401});
  try{
    const db=await getMongoDb();let profileId:ObjectId|null=null;let rows;
    if(session.role==="provider"){
      const profile=await db.collection("providers").findOne({userId:new ObjectId(session.id),status:{$ne:"disabled"}},{projection:{_id:1}});if(!profile)return Response.json({data:[]});profileId=profile._id as ObjectId;
      rows=await db.collection("serviceRequests").find({$or:[{"responses.providerId":profileId},{"messages.providerId":profileId},{assignedProviderId:profileId}]}).sort({updatedAt:-1}).limit(100).toArray();
    }else rows=await db.collection("serviceRequests").find({customerId:new ObjectId(session.id)}).sort({updatedAt:-1}).limit(100).toArray();
    const visibleProviderIds=[...new Set(rows.flatMap(row=>[...(Array.isArray(row.responses)?row.responses:[]).map((reply:{providerId?:ObjectId})=>String(reply.providerId||"")),...(Array.isArray(row.messages)?row.messages:[]).map((message:RawMessage)=>String(message.providerId||"")),String(row.assignedProviderId||"")]).filter((id:string)=>ObjectId.isValid(id)))];
    const providerProfiles=visibleProviderIds.length?await db.collection("providers").find({_id:{$in:visibleProviderIds.map((id:string)=>new ObjectId(id))},status:{$ne:"disabled"}},{projection:{_id:1,profilePhotoId:1}}).toArray():[];
    const providersWithPhotos=new Set(providerProfiles.filter(provider=>provider.profilePhotoId instanceof ObjectId).map(provider=>String(provider._id)));
    const conversations:Record<string,unknown>[]=[];
    for(const row of rows){
      const providerIds=new Set<string>();
      for(const reply of Array.isArray(row.responses)?row.responses:[])providerIds.add(String(reply.providerId||""));
      for(const message of Array.isArray(row.messages)?row.messages:[])providerIds.add(String(message.providerId||""));
      if(row.assignedProviderId)providerIds.add(String(row.assignedProviderId));
      for(const providerId of providerIds){
        if(!providerId||(profileId&&providerId!==String(profileId)))continue;
        const replies=(Array.isArray(row.responses)?row.responses:[]).filter((reply:{providerId?:ObjectId})=>String(reply.providerId||"")===providerId);
        const messages=(Array.isArray(row.messages)?row.messages:[]).filter((message:RawMessage)=>String(message.providerId||"")===providerId).map(serializeMessage);
        if(!messages.length)for(const reply of replies)messages.push(serializeMessage({_id:new ObjectId(),providerId:new ObjectId(providerId),senderRole:"provider",senderName:String(reply.providerBusiness||reply.providerName||"Professional"),text:String(reply.message||""),createdAt:reply.createdAt,readByProvider:true,readByCustomer:false}));
        messages.sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime());
        const reply=replies.at(-1);const last=messages.at(-1);
        conversations.push({id:`${row._id}:${providerId}`,requestId:String(row._id),providerId,providerPhotoUrl:providersWithPhotos.has(providerId)?`/api/providers/photo/${providerId}`:"",requestNumber:row.requestNumber,service:row.service,status:row.status,isSelected:String(row.assignedProviderId||"")===providerId,assignedProviderId:String(row.assignedProviderId||""),customerName:row.customerName,providerName:String(reply?.providerBusiness||reply?.providerName||row.assignedProviderName||"Professional"),quoteAmount:Number(reply?.quoteAmount||0),finalAmount:Number(row.finalAmount||0),confirmedAt:row.confirmedAt||null,arrivedAt:row.arrivedAt||null,startedAt:row.startedAt||null,completedAt:row.completedAt||null,cancelledAt:row.cancelledAt||null,cancelledByRole:String(row.cancelledByRole||""),customerCompletionConfirmedAt:row.customerCompletionConfirmedAt||null,providerCompletionConfirmedAt:row.providerCompletionConfirmedAt||null,paymentGivenAt:row.paymentGivenAt||null,paymentReceivedAt:row.paymentReceivedAt||null,availability:reply?.availability||"",messages,lastMessage:last?.text||"",updatedAt:last?.createdAt||row.updatedAt||row.createdAt,unread:messages.filter(message=>session.role==="provider"?message.senderRole!=="provider"&&!message.readByProvider:message.senderRole!=="customer"&&!message.readByCustomer).length});
      }
    }
    conversations.sort((a,b)=>new Date(String(b.updatedAt)).getTime()-new Date(String(a.updatedAt)).getTime());
    return Response.json({data:conversations});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Unable to load conversations"},{status:500})}
}

export async function POST(request:Request){
  const session=await getSession();if(!session||!ObjectId.isValid(session.id))return Response.json({error:"Sign in to send messages"},{status:401});
  const body=await request.json() as {requestId?:unknown;providerId?:unknown;text?:unknown};const requestId=String(body.requestId||"");const providerId=String(body.providerId||"");const text=typeof body.text==="string"?body.text.trim().slice(0,1500):"";
  if(!ObjectId.isValid(requestId)||!ObjectId.isValid(providerId)||!text)return Response.json({error:"Write a message"},{status:400});
  try{
    const db=await getMongoDb();const record=await db.collection("serviceRequests").findOne({_id:new ObjectId(requestId)});if(!record)return Response.json({error:"Request not found"},{status:404});
    const isCustomer=String(record.customerId)===session.id;let allowedProviderId:ObjectId|null=null;
    if(session.role==="provider"){
      const profile=await db.collection("providers").findOne({userId:new ObjectId(session.id),_id:new ObjectId(providerId),status:{$ne:"disabled"}});
      const hasReply=(Array.isArray(record.responses)?record.responses:[]).some((reply:{providerId?:ObjectId})=>String(reply.providerId||"")===providerId);
      const isAssigned=String(record.assignedProviderId||"")===providerId;
      if(profile&&(hasReply||isAssigned))allowedProviderId=profile._id as ObjectId;
    }else if(isCustomer){const hasReply=(Array.isArray(record.responses)?record.responses:[]).some((reply:{providerId?:ObjectId})=>String(reply.providerId||"")===providerId);if(hasReply||String(record.assignedProviderId||"")===providerId)allowedProviderId=new ObjectId(providerId)}
    if(!allowedProviderId)return Response.json({error:"You cannot message this conversation"},{status:403});
    const message={_id:new ObjectId(),providerId:allowedProviderId,senderUserId:new ObjectId(session.id),senderRole:session.role,senderName:session.fullName,text,createdAt:new Date(),readByCustomer:isCustomer,readByProvider:session.role==="provider"};
    await db.collection("serviceRequests").updateOne({_id:new ObjectId(requestId)},{$push:{messages:message} as never,$set:{updatedAt:new Date()}});
    return Response.json({data:serializeMessage(message)},{status:201});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Unable to send message"},{status:500})}
}

export async function PATCH(request:Request){
  const session=await getSession();if(!session||!ObjectId.isValid(session.id))return Response.json({error:"Sign in required"},{status:401});
  const body=await request.json() as {requestId?:unknown;providerId?:unknown};const requestId=String(body.requestId||"");const providerId=String(body.providerId||"");if(!ObjectId.isValid(requestId)||!ObjectId.isValid(providerId))return Response.json({error:"Invalid conversation"},{status:400});
  const db=await getMongoDb();const field=session.role==="provider"?"messages.$[message].readByProvider":"messages.$[message].readByCustomer";
  await db.collection("serviceRequests").updateOne({_id:new ObjectId(requestId)},{$set:{[field]:true}},{arrayFilters:[{"message.providerId":new ObjectId(providerId)}]});return Response.json({ok:true});
}
