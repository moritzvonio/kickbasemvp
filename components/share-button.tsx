"use client";

import { useState } from "react";
import { Share2, Loader2 } from "lucide-react";

/**
 * Teilen-Aktionen für die Wettbewerb-Seite. „Als Bild teilen" holt das
 * server-gerenderte 1080×1350-PNG und teilt es via Web Share API (Datei),
 * Fallback ist ein Download. Snapshot-Link folgt (S2).
 */
export function ShareButtons({ leagueId }: { leagueId: string }) {
  const [loading, setLoading] = useState(false);

  async function shareImage() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/league/${leagueId}/wettbewerb/share-image`);
      if (!res.ok) return;
      const blob = await res.blob();
      const file = new File([blob], "ligabase-wettbewerb.png", { type: "image/png" });

      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        // Abbruch durch den Nutzer ist kein Fehler – still schlucken.
        await navigator.share({ files: [file], title: "Ligabase" }).catch(() => {});
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ligabase-wettbewerb.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Netzwerk-/Share-Fehler still ignorieren
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={shareImage}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-full text-[11px] font-medium border border-border text-foreground hover:bg-accent transition-colors disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Share2 className="size-3.5" />
        )}
        Als Bild teilen
      </button>
    </div>
  );
}
