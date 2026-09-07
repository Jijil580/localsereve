import "server-only";

export const GOOGLE_OAUTH_COOKIE = "nearleo_google_oauth";

export type GoogleOAuthIntent = {
  state: string;
  mode: "login" | "register";
  role: "customer" | "provider";
  createdAt: number;
};

export function googleOAuthConfig(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || new URL("/api/auth/google/callback", siteOrigin).toString();
  return { clientId, clientSecret, redirectUri };
}

export function encodeGoogleIntent(intent: GoogleOAuthIntent) {
  return Buffer.from(JSON.stringify(intent), "utf8").toString("base64url");
}

export function decodeGoogleIntent(value: string | undefined): GoogleOAuthIntent | null {
  if (!value) return null;
  try {
    const intent = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as GoogleOAuthIntent;
    if (!intent.state || !["login", "register"].includes(intent.mode) || !["customer", "provider"].includes(intent.role)) return null;
    if (!Number.isFinite(intent.createdAt) || Date.now() - intent.createdAt > 10 * 60 * 1000) return null;
    return intent;
  } catch {
    return null;
  }
}
