"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Sendet bei jedem (Client-)Seitenwechsel einen leichten Beacon an /api/track.
 * Server ordnet ihn der eingeloggten Session zu (First-Party, cookiebasiert
 * über die bestehende Session — kein zusätzliches Tracking-Cookie).
 */
export function TrackPageView() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    const body = JSON.stringify({ path: pathname });
    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      } else {
        void fetch("/api/track", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
          keepalive: true,
        });
      }
    } catch {
      /* tracking darf niemals die App stören */
    }
  }, [pathname]);
  return null;
}
