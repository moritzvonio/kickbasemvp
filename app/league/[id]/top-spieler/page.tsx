import type { Metadata } from "next";
import Link from "next/link";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamTag } from "@/components/ui/team-tag";
import { PositionBadge } from "@/components/ui/position-icon";
import { PointBar, HotBadge } from "@/components/ui/point-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { type KbCompetitionPlayer } from "@/lib/kickbase/types";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Trophy, Goal, Footprints, ShieldCheck, AlertTriangle } from "lucide-react";

export const metadata: Metadata = { title: "Top-Spieler" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const POSITION_FILTERS = [
  { key: "all", label: "Alle", value: undefined as number | undefined },
  { key: "gk", label: "Tor", value: 1 },
  { key: "def", label: "Abwehr", value: 2 },
  { key: "mid", label: "Mittelfeld", value: 3 },
  { key: "fwd", label: "Sturm", value: 4 },
] as const;

const LIMITS = [25, 50, 100, 250] as const;

export default async function TopSpielerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pos?: string; limit?: string }>;
}) {
  const { id: leagueId } = await params;
  const sp = await searchParams;
  const path = `/league/${leagueId}/top-spieler`;
  const session = await requireSessionOrRedirect(path);

  const posFilter = POSITION_FILTERS.find((f) => f.key === sp.pos) ?? POSITION_FILTERS[0];
  const limit = (LIMITS as readonly number[]).includes(Number(sp.limit))
    ? Number(sp.limit)
    : 50;

  // "Alle": vollständigen Pool über alle Positionen mergen (der Endpoint ohne
  // Position liefert nur eine gekappte Teilmenge → es fehlten viele Spieler).
  const data = await withKbAuth(path, () =>
    posFilter.value === undefined
      ? kb.competitionPlayersAll(session.token, "1")
      : kb.competitionPlayers(session.token, "1", { position: posFilter.value })
  ).catch(() => ({ it: [] as KbCompetitionPlayer[] }));

  // Erster Sort nach competitionPlayer.p — das ist aber bei der Kickbase-API
  // NICHT konsistent die Gesamtsaison-Punkte (manchmal nur letzter Spieltag
  // oder Aggregat). Wir holen für die Top-(limit) Spieler die wirklichen
  // Saison-Punkte via Detail-Endpoint (tp) und sortieren final danach.
  const preSorted = (data.it ?? []).slice().sort((a, b) => (b.p ?? 0) - (a.p ?? 0));
  const candidates = preSorted.slice(0, Math.min(limit + 20, preSorted.length));

  // Detail-Calls (echte Saison-Punkte tp) auf die Top-Kandidaten begrenzen,
  // damit große Limits (z.B. 250) bei vollem Pool nicht hunderte Calls auslösen.
  const toDetail = candidates.slice(0, 80);
  const detailMap = new Map<
    string,
    { tp?: number; ap?: number; g?: number; a?: number }
  >();
  await Promise.all(
    toDetail.map(async (cp) => {
      try {
        const d = await kb.player(session.token, leagueId, cp.pi);
        detailMap.set(cp.pi, {
          tp: d.tp,
          ap: d.ap,
          g: d.g,
          a: d.a,
        });
      } catch {
        // ignore — fallback auf cp.p für diesen Spieler
      }
    })
  );

  // Helper: liefert tp wenn Detail vorhanden, sonst cp.p als Fallback
  const seasonPoints = (cp: KbCompetitionPlayer): number => {
    const d = detailMap.get(cp.pi);
    return d?.tp ?? cp.p ?? 0;
  };

  // Final-Sort nach echten Saison-Punkten
  const all = candidates.slice().sort((a, b) => seasonPoints(b) - seasonPoints(a));
  const top = all.slice(0, limit);

  // TEMP-DIAG: Pool-Größe ins KV schreiben → Backend-Verifikation per Peek
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import("@vercel/kv");
      await kv.set(
        `diag:top50:${leagueId}`,
        { poolSize: data.it?.length ?? 0, detailed: toDetail.length, shown: top.length, filter: posFilter.key, ts: Date.now() },
        { ex: 3600 }
      );
    } catch {
      /* best-effort */
    }
  }
  const max = seasonPoints(top[0] ?? candidates[0]) || 1;

  return (
    <div className="space-y-6">
      <div className="slide-up">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Trophy className="size-5" />
          </span>
          Top-Spieler · Bundesliga
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {top.length} Spieler nach Gesamt-Saisonpunkten
          {posFilter.value !== undefined ? ` · ${posFilter.label}` : ""}
        </p>
      </div>

      {/* Position filter chips */}
      <div className="flex items-center gap-2 flex-wrap slide-up slide-up-1">
        {POSITION_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`?${new URLSearchParams({
              ...(f.key !== "all" ? { pos: f.key } : {}),
              ...(limit !== 50 ? { limit: String(limit) } : {}),
            }).toString()}`}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              posFilter.key === f.key
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            {f.label}
          </Link>
        ))}
        <span className="text-xs text-muted-foreground ml-2">·</span>
        <span className="text-xs text-muted-foreground">Top</span>
        {LIMITS.map((n) => (
          <Link
            key={n}
            href={`?${new URLSearchParams({
              ...(posFilter.key !== "all" ? { pos: posFilter.key } : {}),
              ...(n !== 50 ? { limit: String(n) } : {}),
            }).toString()}`}
            className={cn(
              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono tabular border transition-colors",
              limit === n
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            {n}
          </Link>
        ))}
      </div>

      {top.length === 0 ? (
        <Card className="slide-up slide-up-2">
          <EmptyState
            icon={<Trophy className="size-6" />}
            title="Keine Spieler-Daten"
            description="Wir konnten die Bundesliga-Spielerliste nicht laden. Probiers später nochmal."
          />
        </Card>
      ) : (
        <Card className="slide-up slide-up-2">
          <CardContent className="p-0 divide-y divide-border/40">
            {top.map((player, idx) => (
              <PlayerRow
                key={player.pi}
                player={player}
                seasonPts={seasonPoints(player)}
                detailAp={detailMap.get(player.pi)?.ap}
                detailG={detailMap.get(player.pi)?.g}
                detailA={detailMap.get(player.pi)?.a}
                rank={idx + 1}
                max={max}
                leagueId={leagueId}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center pt-2">
        💡 Daten direkt aus der Bundesliga-Wertung von Kickbase. Klick einen Spieler
        für Marktwert-Verlauf, Spieltag-Punkte und mehr.
      </p>
    </div>
  );
}

function PlayerRow({
  player,
  seasonPts,
  detailAp,
  detailG,
  detailA,
  rank,
  max,
  leagueId,
}: {
  player: KbCompetitionPlayer;
  seasonPts: number;
  detailAp?: number;
  detailG?: number;
  detailA?: number;
  rank: number;
  max: number;
  leagueId: string;
}) {
  const points = seasonPts;
  const pct = points / max;
  const isInjured = player.st !== undefined && player.st !== 5 && player.st !== 0;
  const avg = detailAp ?? player.ap;
  const goals = detailG ?? player.g;
  const assists = detailA ?? player.a;

  return (
    <Link
      href={`/league/${leagueId}/spieler/${player.pi}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors"
    >
      <div className="w-7 text-center shrink-0">
        {rank === 1 && <span className="text-base">🥇</span>}
        {rank === 2 && <span className="text-base">🥈</span>}
        {rank === 3 && <span className="text-base">🥉</span>}
        {rank > 3 && (
          <span className="text-xs font-mono tabular text-muted-foreground">{rank}</span>
        )}
      </div>
      <PlayerAvatar pim={player.pim} tid={player.tid} size={48} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold truncate">{player.n}</span>
          <HotBadge pct={pct} />
          {isInjured && (
            <Badge variant="danger" className="text-[10px] gap-1">
              <AlertTriangle className="size-3" />
              Status {player.st}
            </Badge>
          )}
          {player.il && (
            <Badge variant="muted" className="text-[10px]">
              Verliehen
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <TeamTag tid={player.tid} size="xs" />
          <PositionBadge pos={player.pos} className="text-[9px] h-4 px-1" />
          {goals !== undefined && goals > 0 && (
            <span className="inline-flex items-center gap-0.5 tabular" title={`${goals} Tore`}>
              <Goal className="size-3" />
              {goals}
            </span>
          )}
          {assists !== undefined && assists > 0 && (
            <span className="inline-flex items-center gap-0.5 tabular" title={`${assists} Vorlagen`}>
              <Footprints className="size-3" />
              {assists}
            </span>
          )}
          {player.cs !== undefined && player.cs > 0 && (
            <span className="inline-flex items-center gap-0.5 tabular" title={`${player.cs} ohne Gegentor`}>
              <ShieldCheck className="size-3" />
              {player.cs}
            </span>
          )}
        </div>
        <div className="mt-2">
          <PointBar value={points} max={max} width={180} height={6} className="w-full max-w-[200px]" />
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="font-mono font-bold text-base tabular">
          {points.toLocaleString("de-DE")}
        </div>
        <div className="text-[10px] text-muted-foreground tabular">
          {avg !== undefined ? `Ø ${avg} / Spieltag` : "—"}
        </div>
      </div>
    </Link>
  );
}
