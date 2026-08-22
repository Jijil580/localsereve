import "server-only";
import nodemailer from "nodemailer";

function escapeHtml(value:string){return value.replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[character]||character)}

export async function sendPasswordRecoveryEmail(to:string,fullName:string,token:string){
  const user=process.env.GMAIL_USER?.trim();
  const appPassword=process.env.GMAIL_APP_PASSWORD?.replace(/\s/g,"");
  if(!user||!appPassword)throw new Error("Gmail recovery email is not configured");
  const site=(process.env.NEXT_PUBLIC_SITE_URL||"https://www.nearleo.com").replace(/\/$/,"");
  const resetUrl=`${site}/?resetToken=${encodeURIComponent(token)}`;
  const safeName=escapeHtml(fullName);const safeEmail=escapeHtml(to);const safeResetUrl=escapeHtml(resetUrl);
  const transporter=nodemailer.createTransport({service:"gmail",auth:{user,pass:appPassword}});
  await transporter.sendMail({
    from:`Nearleo Support <${user}>`,to,subject:"Reset your Nearleo password",
    text:`Hello ${fullName},\n\nYour Nearleo username is ${to}. Reset your password using this secure link (valid for 30 minutes):\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    html:`<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#10244a"><h1 style="color:#1769e0">Nearleo</h1><p>Hello ${safeName},</p><p>Your Nearleo username is <b>${safeEmail}</b>.</p><p>Use the secure button below to set a new password. This link expires in 30 minutes.</p><p><a href="${safeResetUrl}" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#1769e0;color:#fff;text-decoration:none;font-weight:700">Reset password</a></p><p style="font-size:12px;color:#65728a">If you did not request this, you can safely ignore this email.</p></div>`,
  });
}
