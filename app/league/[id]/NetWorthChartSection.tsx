import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart as LineChartIcon } from "lucide-react";
import { TeamValueChart } from "./wettbewerb/TeamValueChart";
import { buildNetWorthSeries, type NetWorthChartPoint } from "@/lib/networth-history";
import { getMarketValueHistories } from "@/lib/kickbase/mv-cache";
import type { KbManagerSquadResponse, KbManagerTransfer } from "@/lib/kickbase/types";
import { kv } from "@vercel/kv";

const KV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const SHOW_DEBUG = process.env.NETWORTH_DEBUG === "1";
const CACHE_VERSION = "v2"; // bei Logik-Änderung erhöhen → Cache-Bust

export interface ChartManager {
  id: string;
  name: string;
  squad: KbManagerSquadResponse | null;
  transfers: KbManagerTransfer[];
  currentCash: number;
}

interface Series {
  data: NetWorthChartPoint[];
  managers: { id: string; name: string }[];
}

/**
 * Suspense-gestreamte, KV-gecachte Netto-Teamwert-Kurve. Die teure
 * MV-History-Rekonstruktion blockiert NICHT die Hauptseite (Tabelle rendert
 * sofort, Chart streamt nach). Serie wird pro Liga & Tag in KV gecacht.
 */
export async function NetWorthChartSection({
  leagueId,
  token,
  managers,
  leagueStartMs,
  initialBudget,
  highlightUserId,
}: {
  leagueId: string;
  token: string;
  managers: ChartManager[];
  leagueStartMs: number;
  initialBudget: number;
  highlightUserId?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `networth:series:${CACHE_VERSION}:${leagueId}:${today}`;

  let series: Series | null = null;
  if (KV) {
    try {
      series = await kv.get<Series>(cacheKey);
    } catch {
      /* cache miss → compute */
    }
  }

  if (!series) {
    const ids = new Set<string>();
    for (const m of managers) {
      for (const p of m.squad?.it ?? []) ids.add(p.pi);
      for (const t of m.transfers) ids.add(t.pi);
    }
    const mvHistories = await getMarketValueHistories(token, leagueId, [...ids]);
    series = buildNetWorthSeries({
      managers,
      mvHistories,
      leagueStartMs,
      nowMs: Date.now(),
      initialBudget,
    });
    if (KV && series.data.length >= 2) {
      try {
        await kv.set(cacheKey, series, { ex: 26 * 60 * 60 });
      } catch {
        /* best-effort */
      }
    }
  }

  if (!series || series.data.length < 2) return null;

  const first = series.data[0];
  const last = series.data[series.data.length - 1];

  return (
    <section className="slide-up slide-up-1">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <LineChartIcon className="size-4" />
            </span>
            Netto-Teamwert seit Liga-Start
            <Badge variant="muted" className="ml-auto text-[10px]">
              seit {new Date(leagueStartMs).toLocaleDateString("de-DE")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TeamValueChart
            data={series.data}
            managers={series.managers}
            highlightUserId={highlightUserId}
          />
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Teamwert pro Stichtag aus der Marktwert-History des zurückgerechneten
            Kaders + Cash. Alle starten bei ~150 Mio (50 Mio Cash + ~100 Mio Team)
            – bestätigt am Liga-Start.
          </p>

          {SHOW_DEBUG && (
            <details className="mt-3 text-[11px]" open>
              <summary className="cursor-pointer text-muted-foreground">
                🔬 Debug: Start vs. Jetzt pro Manager
              </summary>
              <table className="w-full mt-2 tabular">
                <thead className="border-b border-border text-left">
                  <tr>
                    <th className="py-1 pr-3">Manager</th>
                    <th className="py-1 pr-3 text-right">Start (Mio)</th>
                    <th className="py-1 text-right">Jetzt (Mio)</th>
                  </tr>
                </thead>
                <tbody>
                  {series.managers.map((m) => (
                    <tr key={m.id} className="border-b border-border/30">
                      <td className="py-1 pr-3 truncate max-w-[160px]">{m.name}</td>
                      <td className="py-1 pr-3 text-right font-mono">
                        {((Number(first[m.name]) || 0) / 1e6).toFixed(1)}
                      </td>
                      <td className="py-1 text-right font-mono">
                        {((Number(last[m.name]) || 0) / 1e6).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
