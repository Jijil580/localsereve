import { cookies } from "next/headers";
import { MongoServerError } from "mongodb";
import { createSession, type SessionUser } from "../../../../../lib/auth";
import { decodeGoogleIntent, GOOGLE_OAUTH_COOKIE, googleOAuthConfig } from "../../../../../lib/google-oauth";
import { getMongoDb } from "../../../../../lib/mongodb";
import { TERMS_VERSION } from "../../../../../lib/terms";

export const runtime = "nodejs";

type GoogleProfile = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

function returnToNearleo(request: Request, status: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin;
  return Response.redirect(new URL(`/?googleAuth=${encodeURIComponent(status)}`, origin));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const cookieStore = await cookies();
  const intent = decodeGoogleIntent(cookieStore.get(GOOGLE_OAUTH_COOKIE)?.value);
  cookieStore.delete(GOOGLE_OAUTH_COOKIE);

  if (requestUrl.searchParams.get("error")) return returnToNearleo(request, "cancelled");
  const code = requestUrl.searchParams.get("code") || "";
  const state = requestUrl.searchParams.get("state") || "";
  if (!intent || !code || !state || state !== intent.state) return returnToNearleo(request, "invalid_state");

  const { clientId, clientSecret, redirectUri } = googleOAuthConfig(request);
  if (!clientId || !clientSecret) return returnToNearleo(request, "not_configured");

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
      cache: "no-store",
    });
    const tokens = await tokenResponse.json() as { access_token?: string };
    if (!tokenResponse.ok || !tokens.access_token) return returnToNearleo(request, "token_failed");

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    });
    const profile = await profileResponse.json() as GoogleProfile;
    const email = profile.email?.trim().toLowerCase() || "";
    const googleId = profile.sub?.trim() || "";
    if (!profileResponse.ok || !googleId || !email || profile.email_verified !== true) return returnToNearleo(request, "unverified_email");

    const db = await getMongoDb();
    const users = db.collection("users");
    await Promise.all([
      users.createIndex({ email: 1 }, { unique: true }),
      users.createIndex({ phone: 1 }, { unique: true }),
      users.createIndex({ googleId: 1 }, { unique: true, sparse: true }),
    ]);
    const existing = await users.findOne({ $or: [{ googleId }, { email }] });
    if (existing && existing.status !== "active") return returnToNearleo(request, "account_unavailable");

    const now = new Date();
    let user: SessionUser;
    if (existing) {
      user = {
        id: existing._id.toString(),
        fullName: String(existing.fullName || profile.name || email.split("@")[0]),
        email,
        role: existing.role === "provider" || existing.role === "admin" ? existing.role : "customer",
      };
      await users.updateOne({ _id: existing._id }, { $set: { googleId, googleProfilePhotoUrl: profile.picture || existing.googleProfilePhotoUrl || "", emailVerified: true, lastLoginAt: now, termsVersion: TERMS_VERSION, termsAcceptedAt: now, updatedAt: now } });
    } else {
      const fullName = (profile.name || email.split("@")[0]).trim().replace(/\s+/g, " ").slice(0, 80);
      const result = await users.insertOne({
        fullName,
        email,
        phone: `google:${googleId}`,
        role: intent.role,
        status: "active",
        authProvider: "google",
        googleId,
        googleProfilePhotoUrl: profile.picture || "",
        emailVerified: true,
        phoneVerified: false,
        termsVersion: TERMS_VERSION,
        termsAcceptedAt: now,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
      });
      user = { id: result.insertedId.toString(), fullName, email, role: intent.role };
    }

    await createSession(user);
    return returnToNearleo(request, "success");
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) return returnToNearleo(request, "account_exists");
    return returnToNearleo(request, "failed");
  }
}
