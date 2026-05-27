/**
 * First-Party-Seitenaufruf-Tracking (nur eingeloggte User).
 * Wird vom <TrackPageView/>-Beacon aufgerufen. Speist das Owner-Admin-Dashboard.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { recordView } from "@/lib/admin/analytics";

export const runtime = "nodejs";

const NO_CONTENT = () => new NextResponse(null, { status: 204 });

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NO_CONTENT();

  let path = "";
  try {
    const body = (await req.json()) as { path?: unknown };
    if (typeof body.path === "string") path = body.path;
  } catch {
    /* ignore */
  }
  // Nur echte App-/Marketing-Pfade; interne/admin Pfade ignorieren
  path = path.split("?")[0].slice(0, 120);
  if (!path || path.startsWith("/api") || path.startsWith("/admin")) {
    return NO_CONTENT();
  }

  await recordView(s.userId, s.name, path).catch(() => {});
  return NO_CONTENT();
}
