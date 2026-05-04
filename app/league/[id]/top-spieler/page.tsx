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

  const data = await withKbAuth(path, () =>
    kb.competitionPlayers(session.token, "1", {
      position: posFilter.value,
    })
  ).catch(() => ({ it: [] as KbCompetitionPlayer[] }));

  const all = (data.it ?? []).slice().sort((a, b) => (b.p ?? 0) - (a.p ?? 0));
  const top = all.slice(0, limit);
  const max = top[0]?.p ?? 1;

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
  rank,
  max,
  leagueId,
}: {
  player: KbCompetitionPlayer;
  rank: number;
  max: number;
  leagueId: string;
}) {
  const points = player.p ?? 0;
  const pct = points / max;
  const isInjured = player.st !== undefined && player.st !== 5 && player.st !== 0;

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
          {player.g !== undefined && player.g > 0 && (
            <span className="inline-flex items-center gap-0.5 tabular" title={`${player.g} Tore`}>
              <Goal className="size-3" />
              {player.g}
            </span>
          )}
          {player.a !== undefined && player.a > 0 && (
            <span className="inline-flex items-center gap-0.5 tabular" title={`${player.a} Vorlagen`}>
              <Footprints className="size-3" />
              {player.a}
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
          {player.ap !== undefined ? `Ø ${player.ap}` : "—"}
        </div>
      </div>
    </Link>
  );
}
