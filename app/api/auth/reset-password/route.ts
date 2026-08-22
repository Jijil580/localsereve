import { createHash } from "node:crypto";
import { hashPassword } from "../../../../lib/auth";
import { getMongoDb } from "../../../../lib/mongodb";

export const runtime="nodejs";

export async function POST(request:Request){
  const body=await request.json() as {token?:unknown,password?:unknown};
  const token=typeof body.token==="string"?body.token:"";const password=typeof body.password==="string"?body.password:"";
  if(token.length<30)return Response.json({error:"This reset link is invalid"},{status:400});
  if(password.length<8||!/[a-z]/.test(password)||!/[A-Z]/.test(password)||!/[0-9]/.test(password))return Response.json({error:"Use at least 8 characters with uppercase, lowercase and a number"},{status:400});
  try{
    const db=await getMongoDb();const tokenHash=createHash("sha256").update(token).digest("hex");
    const result=await db.collection("users").findOneAndUpdate({passwordResetTokenHash:tokenHash,passwordResetExpiresAt:{$gt:new Date()},status:"active"},{$set:{passwordHash:await hashPassword(password),updatedAt:new Date()},$unset:{passwordResetTokenHash:"",passwordResetExpiresAt:"",passwordResetRequestedAt:""}},{returnDocument:"after"});
    if(!result)return Response.json({error:"This reset link has expired or has already been used"},{status:400});
    return Response.json({ok:true,message:"Password updated. You can now sign in."});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Unable to reset password"},{status:500})}
}
