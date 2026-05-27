import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/session";
import { KickbaseError } from "@/lib/kickbase/client";

export async function requireSessionOrRedirect(currentPath = "/"): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent(currentPath)}`);
  return s;
}

/**
 * Admin-Check für das Owner-Dashboard. Erlaubte Kickbase-User-IDs aus
 * ADMIN_USER_IDS (kommagetrennt); Default = Owner-ID.
 */
export function isAdmin(userId: string | undefined | null): boolean {
  if (!userId) return false;
  const ids = (process.env.ADMIN_USER_IDS ?? "1270088")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.includes(userId);
}

/**
 * Wrap a server-side Kickbase call. If the token has expired (401/403),
 * we redirect to /login so the user can re-auth.
 */
export async function withKbAuth<T>(currentPath: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof KickbaseError && e.isAuthError) {
      redirect(`/login?next=${encodeURIComponent(currentPath)}`);
    }
    throw e;
  }
}
