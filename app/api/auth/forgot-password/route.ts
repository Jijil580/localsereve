import { createHash, randomBytes } from "node:crypto";
import { getMongoDb } from "../../../../lib/mongodb";
import { sendPasswordRecoveryEmail } from "../../../../lib/gmail";

export const runtime="nodejs";

export async function POST(request:Request){
  const body=await request.json() as {email?:unknown};
  const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return Response.json({error:"Enter the Gmail/email address used for your Nearleo account"},{status:400});
  try{
    const db=await getMongoDb();const users=db.collection("users");
    const user=await users.findOne({email,status:"active"},{projection:{fullName:1,email:1,passwordResetRequestedAt:1}});
    if(user){
      const requestedAt=user.passwordResetRequestedAt instanceof Date?user.passwordResetRequestedAt.getTime():0;
      if(Date.now()-requestedAt<60_000)return Response.json({ok:true,message:"If that email belongs to an active Nearleo account, a recovery email has been sent."});
      const token=randomBytes(32).toString("base64url");
      const tokenHash=createHash("sha256").update(token).digest("hex");
      await users.updateOne({_id:user._id},{$set:{passwordResetTokenHash:tokenHash,passwordResetExpiresAt:new Date(Date.now()+30*60*1000),passwordResetRequestedAt:new Date()}});
      try{await sendPasswordRecoveryEmail(String(user.email),String(user.fullName||"there"),token)}catch(error){console.error("Nearleo recovery email failed",error)}
    }
    return Response.json({ok:true,message:"If that email belongs to an active Nearleo account, a recovery email has been sent."});
  }catch{return Response.json({error:"Unable to process account recovery right now"},{status:500})}
}
