import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { getSnapshot } from "@/lib/snapshot-store";
import { formatEUR } from "@/lib/utils";
import { LinkIcon, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Liga-Momentaufnahme",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function SnapshotPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const snap = await getSnapshot(token);

  if (!snap) {
    return (
      <div className="flex-1 flex flex-col">
        <AppHeader />
        <main className="flex-1 mx-auto max-w-md w-full px-4 py-20 text-center">
          <div className="size-14 rounded-full bg-muted mx-auto flex items-center justify-center mb-5">
            <LinkIcon className="size-6 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Link abgelaufen</h1>
          <p className="text-muted-foreground mb-8">
            Diese Momentaufnahme gibt es nicht mehr – Snapshot-Links sind 7 Tage gültig.
            Sieh die Zahlen deiner Liga live, wenn du dich einloggst.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 h-11 px-6 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            Mit Kickbase einloggen <ArrowRight className="size-4" />
          </Link>
        </main>
      </div>
    );
  }

  const createdLabel = new Date(snap.createdAt).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader />
      <main className="flex-1 mx-auto max-w-2xl w-full px-4 py-10">
        <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Liga-Momentaufnahme
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {snap.leagueName ?? "Deine Liga"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Momentaufnahme vom {createdLabel} · Kontostände und Max-Gebote aller Manager,
          geschätzt aus öffentlichen Liga-Daten.
        </p>

        <div className="mt-6 rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs tabular">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th className="pl-4 py-2.5 font-semibold w-8">#</th>
                  <th className="py-2.5 font-semibold min-w-[120px]">Manager</th>
                  <th className="text-right py-2.5 font-semibold">Punkte</th>
                  <th className="text-right py-2.5 font-semibold">Siege</th>
                  <th className="text-right py-2.5 font-semibold">Teamwert</th>
                  <th className="text-right py-2.5 font-semibold">Cash</th>
                  <th className="text-right pr-4 py-2.5 font-semibold">Max-Gebot</th>
                </tr>
              </thead>
              <tbody>
                {snap.rows.map((r, i) => (
                  <tr key={i} className="border-b border-border/40 last:border-0">
                    <td className="pl-4 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="py-2.5 font-medium truncate">{r.name}</td>
                    <td className="text-right py-2.5 font-mono">
                      {r.seasonPoints?.toLocaleString("de-DE") ?? "–"}
                    </td>
                    <td className="text-right py-2.5 font-mono text-amber-700">
                      {r.matchdayWins > 0 ? `${r.matchdayWins}×` : "–"}
                    </td>
                    <td className="text-right py-2.5 font-mono">
                      {formatEUR(r.teamValue, { compact: true })}
                    </td>
                    <td className="text-right py-2.5 font-mono">
                      {formatEUR(r.cashEstimate, { compact: true })}
                    </td>
                    <td className="text-right pr-4 py-2.5 font-mono text-primary">
                      {formatEUR(r.maxBidSingleSell, { compact: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/[0.05] p-6 text-center">
          <h2 className="font-semibold text-lg mb-1">Das ist DEINE Liga</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            Log dich mit deinem Kickbase-Account ein und sieh alles live – Netto-Teamwert-Verlauf,
            Bid-Advisor und die kompletten Kontostände.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 h-11 px-6 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            Mit Kickbase einloggen <ArrowRight className="size-4" />
          </Link>
        </div>

        <p className="mt-8 text-xs text-muted-foreground text-center">
          Ligabase ist nicht offiziell mit Kickbase verbunden. Alle Cash-Werte sind
          Schätzungen aus öffentlichen Liga-Daten.
        </p>
      </main>
    </div>
  );
}
