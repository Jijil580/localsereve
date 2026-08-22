import { ObjectId } from "mongodb";
import { getSession } from "../../../../lib/auth";
import { getMongoDb } from "../../../../lib/mongodb";

export const runtime="nodejs";

export async function GET(){
  try{
    const db=await getMongoDb();const session=await getSession();
    const [registeredUsers,registeredProviders,reviewSummary,existing]=await Promise.all([
      db.collection("users").countDocuments({status:"active"}),
      db.collection("users").countDocuments({status:"active",role:"provider"}),
      db.collection("platformReviews").aggregate<{_id:null;count:number;average:number}>([{$group:{_id:null,count:{$sum:1},average:{$avg:"$rating"}}}]).next(),
      session&&ObjectId.isValid(session.id)?db.collection("platformReviews").findOne({userId:new ObjectId(session.id)},{projection:{_id:1}}):null,
    ]);
    return Response.json({data:{communityMembers:1000+registeredUsers,registeredUsers,providers:registeredProviders,reviews:reviewSummary?.count||0,rating:Number((reviewSummary?.average||0).toFixed(1)),hasReviewed:Boolean(existing)}});
  }catch{return Response.json({data:{communityMembers:1000,registeredUsers:0,providers:0,reviews:0,rating:0,hasReviewed:false}})}
}

export async function POST(request:Request){
  const session=await getSession();if(!session||!ObjectId.isValid(session.id))return Response.json({error:"Sign in to review Nearleo"},{status:401});
  const body=await request.json() as {rating?:unknown;comment?:unknown;context?:unknown};
  const rating=Number(body.rating);const comment=typeof body.comment==="string"?body.comment.trim().slice(0,500):"";const context=typeof body.context==="string"?body.context.slice(0,40):"general";
  if(!Number.isInteger(rating)||rating<1||rating>5)return Response.json({error:"Choose a rating from 1 to 5 stars"},{status:400});
  try{
    const db=await getMongoDb();const reviews=db.collection("platformReviews");await reviews.createIndex({userId:1},{unique:true});const now=new Date();
    await reviews.updateOne({userId:new ObjectId(session.id)},{$set:{rating,comment,context,userName:session.fullName,userRole:session.role,updatedAt:now},$setOnInsert:{createdAt:now}},{upsert:true});
    return Response.json({ok:true,message:"Thank you for helping Nearleo improve."});
  }catch{return Response.json({error:"Unable to save your review right now"},{status:500})}
}
