import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const redirectedHosts = new Set([
  "nearleo.com",
  "localserviecses.vercel.app",
  "localserve-marketplace.jijilsadanandan.chatgpt.site",
]);

export function proxy(request: NextRequest) {
  const hostname = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (!redirectedHosts.has(hostname)) return NextResponse.next();

  const canonicalUrl = request.nextUrl.clone();
  canonicalUrl.protocol = "https:";
  canonicalUrl.hostname = "www.nearleo.com";
  canonicalUrl.port = "";
  return NextResponse.redirect(canonicalUrl, 308);
}

export const config = { matcher: "/:path*" };
