import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/session";
import { KickbaseError } from "@/lib/kickbase/client";

export async function requireSessionOrRedirect(currentPath = "/"): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent(currentPath)}`);
  return s;
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
