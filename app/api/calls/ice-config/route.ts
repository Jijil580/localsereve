import { createHmac } from "node:crypto";
import { getSession } from "../../../../lib/auth";

export const runtime = "nodejs";

function urls(value: string | undefined) {
  return (value ?? "").split(",").map(item => item.trim()).filter(Boolean);
}

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in to make calls" }, { status: 401 });
  const iceServers: RTCIceServer[] = [{ urls: urls(process.env.STUN_URL).length ? urls(process.env.STUN_URL) : ["stun:stun.l.google.com:19302"] }];
  const turnUrls = urls(process.env.TURN_URL);
  if (turnUrls.length && process.env.TURN_SHARED_SECRET) {
    const username = `${Math.floor(Date.now() / 1000) + 3600}:${session.id}`;
    const credential = createHmac("sha1", process.env.TURN_SHARED_SECRET).update(username).digest("base64");
    iceServers.push({ urls: turnUrls, username, credential });
  } else if (turnUrls.length && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
    iceServers.push({ urls: turnUrls, username: process.env.TURN_USERNAME, credential: process.env.TURN_CREDENTIAL });
  }
  return Response.json({ data: iceServers });
}
