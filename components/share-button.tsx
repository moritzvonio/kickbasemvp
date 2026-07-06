"use client";

import { useState } from "react";
import { Share2, Loader2, Link2, Check } from "lucide-react";

/**
 * Teilen-Aktionen für die Wettbewerb-Seite.
 *  - „Als Bild teilen": server-gerendertes 1080×1350-PNG via Web Share API (Datei),
 *    Fallback Download.
 *  - „Link für die Liga-Gruppe": erzeugt einen 7-Tage-Snapshot-Link, teilt ihn
 *    (Web Share) bzw. kopiert ihn in die Zwischenablage. Nur wenn `snapshotEnabled`.
 */
export function ShareButtons({
  leagueId,
  snapshotEnabled,
}: {
  leagueId: string;
  snapshotEnabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [snapLoading, setSnapLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function shareImage() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/league/${leagueId}/wettbewerb/share-image`);
      if (!res.ok) return;
      const blob = await res.blob();
      const file = new File([blob], "ligabase-wettbewerb.png", { type: "image/png" });

      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
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
      // still
    } finally {
      setLoading(false);
    }
  }

  async function shareLink() {
    if (snapLoading) return;
    setSnapLoading(true);
    try {
      const res = await fetch("/api/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId }),
      });
      if (!res.ok) return;
      const { url } = await res.json();
      if (!url) return;

      if (typeof navigator.share === "function") {
        await navigator
          .share({ url, title: "Ligabase", text: "Schau, was Ligabase über unsere Liga sagt" })
          .catch(() => {});
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // still
    } finally {
      setSnapLoading(false);
    }
  }

  const chip =
    "inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-full text-[11px] font-medium border border-border text-foreground hover:bg-accent transition-colors disabled:opacity-60";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button type="button" onClick={shareImage} disabled={loading} className={chip}>
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Share2 className="size-3.5" />}
        Als Bild teilen
      </button>
      {snapshotEnabled && (
        <button type="button" onClick={shareLink} disabled={snapLoading} className={chip}>
          {snapLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : copied ? (
            <Check className="size-3.5 text-primary" />
          ) : (
            <Link2 className="size-3.5" />
          )}
          {copied ? "Link kopiert" : "Link für die Liga-Gruppe"}
        </button>
      )}
    </div>
  );
}
