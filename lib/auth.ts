import "server-only";
import { createHmac, pbkdf2 as pbkdf2Callback, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";

const pbkdf2 = promisify(pbkdf2Callback);
const COOKIE_NAME = "localserve_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = { id: string; fullName: string; email: string; role: "customer" | "provider" | "admin" };
type SessionPayload = SessionUser & { exp: number };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters");
  return value;
}

function encode(value: string | Buffer) { return Buffer.from(value).toString("base64url"); }

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const iterations = 210_000;
  const hash = await pbkdf2(password, salt, iterations, 32, "sha256") as Buffer;
  return `pbkdf2-sha256$${iterations}$${encode(salt)}$${encode(hash)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, iterationText, saltText, hashText] = stored.split("$");
  if (algorithm !== "pbkdf2-sha256" || !iterationText || !saltText || !hashText) return false;
  const expected = Buffer.from(hashText, "base64url");
  const actual = await pbkdf2(password, Buffer.from(saltText, "base64url"), Number(iterationText), expected.length, "sha256") as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function sign(payload: SessionPayload) {
  const body = encode(JSON.stringify(payload));
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verify(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", secret()).update(body).digest();
  const received = Buffer.from(signature, "base64url");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch { return null; }
}

export async function createSession(user: SessionUser) {
  const token = sign({ ...user, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS });
  (await cookies()).set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_SECONDS });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const payload = verify(token);
    if (!payload) return null;
    const { exp: _exp, ...user } = payload;
    return user;
  } catch { return null; }
}

export async function clearSession() { (await cookies()).delete(COOKIE_NAME); }
