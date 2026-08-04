import "server-only";
import { getSession } from "./auth";

export const ADMIN_ID = "localserve-admin";

export async function requireAdmin() {
  const session = await getSession();
  return session?.role === "admin" && session.id === ADMIN_ID ? session : null;
}
