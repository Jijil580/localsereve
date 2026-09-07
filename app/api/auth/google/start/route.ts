import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { GOOGLE_OAUTH_COOKIE, encodeGoogleIntent, googleOAuthConfig } from "../../../../../lib/google-oauth";

export const runtime = "nodejs";

function returnToNearleo(request: Request, status: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin;
  return Response.redirect(new URL(`/?googleAuth=${encodeURIComponent(status)}`, origin));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { clientId, redirectUri } = googleOAuthConfig(request);
  if (!clientId) return returnToNearleo(request, "not_configured");

  const mode = requestUrl.searchParams.get("mode") === "register" ? "register" : "login";
  const role = mode === "register" && requestUrl.searchParams.get("role") === "provider" ? "provider" : "customer";
  const state = randomBytes(32).toString("base64url");
  const intent = encodeGoogleIntent({ state, mode, role, createdAt: Date.now() });
  (await cookies()).set(GOOGLE_OAUTH_COOKIE, intent, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();
  return Response.redirect(googleUrl);
}
