"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

/**
 * Werbe-Block auf /account: Invite-Link + Kopieren + Zähler geworbener Mitspieler.
 * Ein geworbener Erstlogin bringt dem Werber +14 Tage Pro (max. 3).
 */
export function InviteBlock({
  inviteUrl,
  count,
  bonusDays,
}: {
  inviteUrl: string;
  count: number;
  bonusDays: number;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      if (typeof navigator.share === "function") {
        await navigator
          .share({ url: inviteUrl, title: "Ligabase", text: "Spiel mit mir bei Ligabase" })
          .catch(() => {});
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // still
    }
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground">
        Teile deinen Link. Loggt sich ein neuer Mitspieler damit zum ersten Mal ein,
        bekommst du <span className="text-foreground font-medium">+14 Tage Pro</span> –
        bis zu 3-mal.
      </p>

      <div className="flex items-center gap-2">
        <input
          readOnly
          value={inviteUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs font-mono truncate"
        />
        <button
          type="button"
          onClick={share}
          className="inline-flex items-center gap-1.5 shrink-0 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Kopiert" : "Teilen"}
        </button>
      </div>

      {count > 0 ? (
        <div className="rounded-md border border-primary/30 bg-primary/[0.06] px-3 py-2 text-xs">
          <span className="font-medium">{count}</span>{" "}
          {count === 1 ? "Mitspieler geworben" : "Mitspieler geworben"} ·{" "}
          <span className="font-medium">+{bonusDays} Tage Pro</span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Noch niemanden geworben.</p>
      )}
    </div>
  );
}
