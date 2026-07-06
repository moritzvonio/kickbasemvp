"use client";

import { useMemo, useState } from "react";
import { Calculator, Target, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatEUR, cn } from "@/lib/utils";
import { recommendBid, type BidPattern } from "@/lib/bid-analyzer";

export interface ManagerPattern {
  userId: string;
  name: string;
  image?: string;
  pattern: BidPattern;
}

const PROFILE_META: Record<
  BidPattern["profile"],
  { label: string; color: string; description: string }
> = {
  round: {
    label: "Round-Bidder",
    color: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    description: "Bietet meist auf volle Mio / halbe Mio – leicht zu schlagen",
  },
  fine: {
    label: "Fine-Bidder",
    color: "bg-amber-50 text-amber-700 ring-amber-200",
    description: "Bietet auf 100k-Schritte – moderat zu schlagen",
  },
  sniper: {
    label: "Sniper",
    color: "bg-rose-50 text-rose-700 ring-rose-200",
    description: "Krumme Bids – schwer zu antizipieren, defensiv bieten",
  },
  unknown: {
    label: "Zu wenig Daten",
    color: "bg-muted text-muted-foreground ring-border",
    description: "< 3 Käufe analysierbar",
  },
};

export function BidAdvisor({
  managerPatterns,
}: {
  managerPatterns: ManagerPattern[];
}) {
  const [mvInput, setMvInput] = useState<string>("5");
  const marketValue = useMemo(() => {
    const v = parseFloat(mvInput.replace(",", "."));
    if (!isFinite(v) || v <= 0) return 0;
    return Math.round(v * 1_000_000);
  }, [mvInput]);

  const sorted = useMemo(
    () =>
      managerPatterns
        .slice()
        .sort((a, b) => b.pattern.buyCount - a.pattern.buyCount),
    [managerPatterns]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="size-4 text-primary" />
          Bid-Advisor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 block">
              Aktueller Marktwert (Mio €)
            </label>
            <div className="flex items-center gap-2">
              <Calculator className="size-4 text-muted-foreground" />
              <input
                type="text"
                inputMode="decimal"
                value={mvInput}
                onChange={(e) => setMvInput(e.target.value)}
                placeholder="z.B. 5,2"
                className="w-32 px-3 py-1.5 rounded-md border border-border bg-background text-sm font-mono tabular focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-xs text-muted-foreground">Mio €</span>
              {marketValue > 0 && (
                <span className="text-xs font-mono text-muted-foreground tabular ml-2">
                  = {formatEUR(marketValue, { compact: true })}
                </span>
              )}
            </div>
          </div>
        </div>

        {marketValue > 0 ? (
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Empfohlene Bids – pro Konkurrent
            </div>
            {sorted.map((m) => {
              const meta = PROFILE_META[m.pattern.profile];
              const rec = recommendBid(marketValue, m.pattern);
              return (
                <div
                  key={m.userId}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/40 transition-colors"
                >
                  <UserAvatar name={m.name} image={m.image} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm truncate">
                        {m.name}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium ring-1 ring-inset",
                          meta.color
                        )}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {m.pattern.buyCount} Käufe analysiert
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-1.5 text-[11px]">
                      <span className="text-muted-foreground">
                        Round-Mio:{" "}
                        <span className="font-mono font-semibold text-foreground">
                          {Math.round(m.pattern.roundMillionPct * 100)}%
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        Fine-100k:{" "}
                        <span className="font-mono font-semibold text-foreground">
                          {Math.round(m.pattern.roundHundredPct * 100)}%
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        Sniper:{" "}
                        <span className="font-mono font-semibold text-foreground">
                          {Math.round(m.pattern.sniperPct * 100)}%
                        </span>
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2 leading-snug">
                      {rec.rationale}
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                          Min. um zu schlagen
                        </span>
                        <span className="font-mono font-bold tabular text-amber-700">
                          {formatEUR(rec.minBidToBeat, { compact: true })}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
                          Empfohlen (sicher)
                        </span>
                        <span className="font-mono font-bold tabular text-emerald-700">
                          {formatEUR(rec.safeBid, { compact: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-md bg-muted/50">
            <AlertCircle className="size-4" />
            Marktwert eingeben um Empfehlungen zu sehen
          </div>
        )}

        <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
          Heuristik basiert auf historischen Bietmustern aus
          Manager-Transfer-Logs. Sniper-Bids und sehr aktuelle Auktionen können
          das Pattern brechen.
        </p>
      </CardContent>
    </Card>
  );
}
