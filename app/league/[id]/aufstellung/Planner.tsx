"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeamTag } from "@/components/ui/team-tag";
import { PositionBadge } from "@/components/ui/position-icon";
import { formatEUR, formatDelta, cn } from "@/lib/utils";
import { POSITION_LABELS, teamMeta } from "@/lib/kickbase/types";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import {
  Wallet,
  TrendingUp,
  ArrowDown,
  RotateCcw,
  Tag,
  X,
  Calendar,
  AlertTriangle,
  Layers,
  Users,
} from "lucide-react";

export interface PlannerPlayer {
  id: string;
  name: string;
  pos: number; // 1=GK, 2=DEF, 3=MID, 4=FWD
  mv: number;
  ap?: number;
  tp?: number;
  tid: string;
  pim?: string;
  /** Lineup order from Kickbase (0 bench, 1..11 field) */
  lo?: number;
  isCaptain?: boolean;
  st?: number;
  /** Next opponent home */
  next1?: string;
  /** Next opponent away */
  next2?: string;
  tfhmvt?: number;
  mvgl?: number;
}

type FormationKey = "4-4-2" | "4-3-3" | "3-5-2" | "3-4-3" | "5-3-2" | "5-4-1" | "4-5-1";

const FORMATIONS: Record<FormationKey, { def: number; mid: number; fwd: number }> = {
  "4-4-2": { def: 4, mid: 4, fwd: 2 },
  "4-3-3": { def: 4, mid: 3, fwd: 3 },
  "3-5-2": { def: 3, mid: 5, fwd: 2 },
  "3-4-3": { def: 3, mid: 4, fwd: 3 },
  "4-5-1": { def: 4, mid: 5, fwd: 1 },
  "5-3-2": { def: 5, mid: 3, fwd: 2 },
  "5-4-1": { def: 5, mid: 4, fwd: 1 },
};

const POS_FOR_SLOT: Record<string, number> = {};
function buildSlotIds(formation: FormationKey): string[] {
  const f = FORMATIONS[formation];
  const ids: string[] = ["GK"];
  POS_FOR_SLOT["GK"] = 1;
  for (let i = 1; i <= f.def; i++) {
    const id = `D${i}`;
    ids.push(id);
    POS_FOR_SLOT[id] = 2;
  }
  for (let i = 1; i <= f.mid; i++) {
    const id = `M${i}`;
    ids.push(id);
    POS_FOR_SLOT[id] = 3;
  }
  for (let i = 1; i <= f.fwd; i++) {
    const id = `F${i}`;
    ids.push(id);
    POS_FOR_SLOT[id] = 4;
  }
  return ids;
}

interface PlannerState {
  formation: FormationKey;
  /** slotId → playerId (or null) */
  slots: Record<string, string | null>;
  /** player ids marked for sale */
  sells: string[];
}

function detectInitialFormation(players: PlannerPlayer[]): FormationKey {
  const lineup = players.filter((p) => p.lo && p.lo >= 1 && p.lo <= 11);
  const def = lineup.filter((p) => p.pos === 2).length;
  const mid = lineup.filter((p) => p.pos === 3).length;
  const fwd = lineup.filter((p) => p.pos === 4).length;
  const key = `${def}-${mid}-${fwd}` as FormationKey;
  if (FORMATIONS[key]) return key;
  return "4-3-3";
}

function buildInitialState(players: PlannerPlayer[]): PlannerState {
  const formation = detectInitialFormation(players);
  const slotIds = buildSlotIds(formation);
  const slots: Record<string, string | null> = {};
  for (const id of slotIds) slots[id] = null;

  const lineup = players.filter((p) => p.lo && p.lo >= 1 && p.lo <= 11);
  const gk = lineup.find((p) => p.pos === 1);
  if (gk) slots["GK"] = gk.id;

  const fillRow = (pos: number, prefix: string) => {
    const row = lineup
      .filter((p) => p.pos === pos)
      .sort((a, b) => (a.lo ?? 99) - (b.lo ?? 99));
    let i = 1;
    for (const p of row) {
      const slotId = `${prefix}${i}`;
      if (slots[slotId] === null) {
        slots[slotId] = p.id;
        i++;
      }
    }
  };
  fillRow(2, "D");
  fillRow(3, "M");
  fillRow(4, "F");

  return { formation, slots, sells: [] };
}

export function Planner({
  leagueId,
  players,
  budget,
  deadline,
  matchday,
}: {
  leagueId: string;
  players: PlannerPlayer[];
  budget: number;
  deadline?: string;
  matchday?: string | number;
}) {
  const storageKey = `bb_plan_${leagueId}_v1`;
  const initialState = useMemo(() => buildInitialState(players), [players]);
  const [state, setState] = useState<PlannerState>(initialState);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as PlannerState;
        if (parsed.formation && parsed.slots) {
          setState(parsed);
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [storageKey]);

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, storageKey, hydrated]);

  const slotIds = useMemo(() => buildSlotIds(state.formation), [state.formation]);
  const playerById = useMemo(() => {
    const m = new Map<string, PlannerPlayer>();
    for (const p of players) m.set(p.id, p);
    return m;
  }, [players]);

  const assignedIds = new Set(Object.values(state.slots).filter(Boolean) as string[]);
  const benchPlayers = players.filter((p) => !assignedIds.has(p.id));

  const filledCount = Object.values(state.slots).filter(Boolean).length;
  const sellSet = new Set(state.sells);
  const sellValue = players
    .filter((p) => sellSet.has(p.id))
    .reduce((s, p) => s + (p.mv ?? 0), 0);
  const projectedBudget = budget + sellValue;

  /** Free-slot count per position (1=GK, 2=DEF, 3=MID, 4=FWD) */
  const freeSlotByPos = useMemo(() => {
    const m: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const slotId of slotIds) {
      if (state.slots[slotId] === null) {
        const p = POS_FOR_SLOT[slotId];
        if (p) m[p] = (m[p] ?? 0) + 1;
      }
    }
    return m;
  }, [slotIds, state.slots]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over) return;
    const playerId = String(e.active.id);
    const overId = String(e.over.id);

    const player = playerById.get(playerId);
    if (!player) return;

    setState((prev) => {
      const slots = { ...prev.slots };
      // First, remove the player from any slot they're currently in
      for (const k of Object.keys(slots)) {
        if (slots[k] === playerId) slots[k] = null;
      }

      if (overId === "bench") {
        // explicit drop on bench just removes them from any slot (already done)
      } else {
        const requiredPos = POS_FOR_SLOT[overId];
        if (requiredPos === player.pos) {
          // If something else is in that slot, swap (move displaced player to bench)
          const displaced = slots[overId];
          slots[overId] = playerId;
          if (displaced) {
            // displaced just goes back to bench (no-op since it's no longer in slots)
          }
        }
        // else: invalid drop, no-op
      }
      return { ...prev, slots };
    });
  };

  const removeFromSlot = (slotId: string) => {
    setState((prev) => ({ ...prev, slots: { ...prev.slots, [slotId]: null } }));
  };

  /** Place a bench player into the first free compatible slot. No-op if none. */
  const placeOnPitch = (playerId: string) => {
    setState((prev) => {
      const player = playerById.get(playerId);
      if (!player) return prev;
      const slots = { ...prev.slots };
      for (const k of Object.keys(slots)) {
        if (slots[k] === playerId) slots[k] = null;
      }
      const ids = buildSlotIds(prev.formation);
      for (const slotId of ids) {
        if (slots[slotId] === null && POS_FOR_SLOT[slotId] === player.pos) {
          slots[slotId] = playerId;
          return { ...prev, slots };
        }
      }
      return prev;
    });
  };

  const toggleSell = (playerId: string) => {
    setState((prev) => {
      const has = prev.sells.includes(playerId);
      return {
        ...prev,
        sells: has ? prev.sells.filter((id) => id !== playerId) : [...prev.sells, playerId],
      };
    });
  };

  const setFormation = (f: FormationKey) => {
    setState((prev) => {
      const newSlotIds = buildSlotIds(f);
      const newSlots: Record<string, string | null> = {};
      for (const id of newSlotIds) newSlots[id] = null;

      // Try to keep current assignments by position
      const oldByPos = new Map<number, string[]>();
      for (const [, pid] of Object.entries(prev.slots)) {
        if (!pid) continue;
        const player = playerById.get(pid);
        if (!player) continue;
        const arr = oldByPos.get(player.pos) ?? [];
        arr.push(pid);
        oldByPos.set(player.pos, arr);
      }

      // Refill new slots in order
      for (const id of newSlotIds) {
        const reqPos = POS_FOR_SLOT[id];
        const arr = oldByPos.get(reqPos);
        if (arr && arr.length > 0) {
          newSlots[id] = arr.shift()!;
        }
      }
      return { ...prev, formation: f, slots: newSlots };
    });
  };

  const reset = () => {
    setState(initialState);
  };

  const sellPlayers = players.filter((p) => sellSet.has(p.id));

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="space-y-5">
        {/* KPI bar — always full width */}
        <section className="grid grid-cols-2 sm:grid-cols-5 gap-3 slide-up">
          <KpiTile
            icon={<Layers className="size-4" />}
            label="Aufstellung"
            value={`${filledCount} / 11`}
            accent={filledCount === 11 ? "success" : filledCount > 7 ? "warning" : "danger"}
            sub={filledCount === 11 ? "Komplett" : `${11 - filledCount} fehlen`}
          />
          <KpiTile
            icon={<Wallet className="size-4" />}
            label="Budget jetzt"
            value={formatEUR(budget, { compact: true })}
          />
          <KpiTile
            icon={<Tag className="size-4" />}
            label="+ Verkaufserlös"
            value={formatEUR(sellValue, { compact: true })}
            sub={state.sells.length > 0 ? `${state.sells.length} markiert` : undefined}
            accent={sellValue > 0 ? "success" : undefined}
          />
          <KpiTile
            icon={<TrendingUp className="size-4" />}
            label="= Geplantes Budget"
            value={formatEUR(projectedBudget, { compact: true })}
            accent="primary"
          />
          <DeadlineTile deadline={deadline} matchday={matchday} />
        </section>

        {/* Mobile-only formation row (desktop has it in sidebar) */}
        <section className="lg:hidden flex items-center justify-between flex-wrap gap-2 slide-up slide-up-1">
          <FormationPicker formation={state.formation} onChange={setFormation} />
          <Button onClick={reset} variant="outline" size="sm" className="gap-1.5">
            <RotateCcw className="size-3.5" /> Reset
          </Button>
        </section>

        {/* Main grid: Pitch left, Sidebar right (desktop only) */}
        <section className="grid gap-4 lg:grid-cols-12 slide-up slide-up-2">
          <div className="lg:col-span-7">
            <Pitch
              slotIds={slotIds}
              formation={state.formation}
              slots={state.slots}
              playerById={playerById}
              sells={sellSet}
              onRemoveFromSlot={removeFromSlot}
              onToggleSell={toggleSell}
            />
          </div>

          <aside className="lg:col-span-5 space-y-3">
            {/* Desktop formation picker + reset */}
            <Card className="hidden lg:block">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Formation
                  </span>
                  <Button onClick={reset} variant="ghost" size="sm" className="h-7 px-2 text-[11px] gap-1">
                    <RotateCcw className="size-3" /> Reset
                  </Button>
                </div>
                <FormationPicker
                  formation={state.formation}
                  onChange={setFormation}
                  variant="grid"
                />
              </CardContent>
            </Card>

            {/* Free slots overview */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Layers className="size-4" />
                  </span>
                  <span className="font-semibold text-sm">Freie Plätze</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((pos) => {
                    const free = freeSlotByPos[pos] ?? 0;
                    return (
                      <div
                        key={pos}
                        className={cn(
                          "rounded-lg border px-2 py-2 text-center",
                          free > 0
                            ? "border-primary/30 bg-primary/[0.04]"
                            : "border-border bg-muted/40"
                        )}
                      >
                        <div className="flex justify-center mb-1">
                          <PositionBadge pos={pos} />
                        </div>
                        <div
                          className={cn(
                            "text-lg font-bold tabular leading-none",
                            free > 0 ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          {free}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Sells summary inline */}
            {sellPlayers.length > 0 && (
              <SellsSummary
                players={sellPlayers}
                totalValue={sellValue}
                onUntag={toggleSell}
              />
            )}

            {/* Quick tip */}
            <Card className="bg-primary/[0.03] border-primary/20">
              <CardContent className="p-4 text-xs text-muted-foreground space-y-1.5">
                <p className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">+</span>
                  <span>
                    Tippe das <span className="font-semibold text-foreground">+</span>{" "}
                    auf einem Bank-Spieler um ihn auf den nächsten freien Platz zu setzen.
                  </span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">↕</span>
                  <span>
                    Drag-Drop funktioniert auch — zwischen Bank und Pitch sowie zwischen Slots.
                  </span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">€</span>
                  <span>
                    Verkaufs-Markierung ändert sofort das geplante Budget oben.
                  </span>
                </p>
              </CardContent>
            </Card>
          </aside>
        </section>

        {/* Bench — full width below */}
        <section className="slide-up slide-up-3">
          <BenchZone
            players={benchPlayers}
            sells={sellSet}
            freeSlotByPos={freeSlotByPos}
            onToggleSell={toggleSell}
            onPlace={placeOnPitch}
          />
        </section>
      </div>

      <DragOverlay>
        {activeId ? <PlayerCard player={playerById.get(activeId)!} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

/* ─── Formation picker (shared) ────────────────────────── */
function FormationPicker({
  formation,
  onChange,
  variant = "row",
}: {
  formation: FormationKey;
  onChange: (f: FormationKey) => void;
  variant?: "row" | "grid";
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5",
        variant === "grid" && "grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2"
      )}
    >
      {(Object.keys(FORMATIONS) as FormationKey[]).map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors tabular text-center",
            variant === "grid" && "rounded-md",
            formation === f
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

/* ─── KPI tiles ─────────────────────────────────────────── */

function KpiTile({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: "primary" | "success" | "warning" | "danger";
}) {
  const accentBar: Record<string, string> = {
    primary: "bg-gradient-to-r from-primary to-emerald-300",
    success: "bg-gradient-to-r from-emerald-500 to-emerald-300",
    warning: "bg-gradient-to-r from-amber-500 to-amber-300",
    danger: "bg-gradient-to-r from-rose-500 to-rose-300",
  };
  return (
    <Card className="card-hover relative overflow-hidden">
      {accent && (
        <div className={cn("absolute top-0 left-0 right-0 h-0.5", accentBar[accent])} />
      )}
      <CardContent className="p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5 flex items-center gap-1">
          {icon}
          {label}
        </div>
        <div className="text-lg font-bold tabular truncate">{value}</div>
        {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function DeadlineTile({ deadline, matchday }: { deadline?: string; matchday?: string | number }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!deadline) {
    return (
      <KpiTile
        icon={<Calendar className="size-4" />}
        label="Spieltag"
        value={matchday !== undefined ? `MD ${matchday}` : "—"}
      />
    );
  }
  const target = new Date(deadline).getTime();
  if (isNaN(target) || now === null) {
    return (
      <KpiTile
        icon={<Calendar className="size-4" />}
        label="Spieltag"
        value={matchday !== undefined ? `MD ${matchday}` : "—"}
      />
    );
  }
  const diff = target - now;
  const expired = diff < 0;
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86_400_000);
  const hours = Math.floor((abs / 3_600_000) % 24);
  const mins = Math.floor((abs / 60_000) % 60);

  let label: string;
  if (days > 0) label = `${days}d ${hours}h`;
  else if (hours > 0) label = `${hours}h ${mins}m`;
  else label = `${mins}m`;

  return (
    <KpiTile
      icon={<Calendar className="size-4" />}
      label={expired ? "Deadline vorbei" : "Deadline in"}
      value={label}
      sub={matchday !== undefined ? `Spieltag ${matchday}` : undefined}
      accent={expired ? "danger" : days < 1 ? "warning" : undefined}
    />
  );
}

/* ─── Pitch ────────────────────────────────────────────── */

function Pitch({
  slotIds,
  formation,
  slots,
  playerById,
  sells,
  onRemoveFromSlot,
  onToggleSell,
}: {
  slotIds: string[];
  formation: FormationKey;
  slots: Record<string, string | null>;
  playerById: Map<string, PlannerPlayer>;
  sells: Set<string>;
  onRemoveFromSlot: (slotId: string) => void;
  onToggleSell: (id: string) => void;
}) {
  const f = FORMATIONS[formation];
  const groups: Array<{ key: string; ids: string[] }> = [
    { key: "fwd", ids: slotIds.filter((id) => id.startsWith("F")) },
    { key: "mid", ids: slotIds.filter((id) => id.startsWith("M")) },
    { key: "def", ids: slotIds.filter((id) => id.startsWith("D")) },
    { key: "gk", ids: ["GK"] },
  ];

  return (
    <div className="relative rounded-2xl overflow-hidden ring-1 ring-emerald-700/50 shadow-card bg-emerald-700">
      {/* Pitch background lines */}
      <svg
        viewBox="0 0 200 280"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full opacity-25 pointer-events-none"
        aria-hidden
      >
        {/* Outer */}
        <rect x="6" y="6" width="188" height="268" fill="none" stroke="white" strokeWidth="1" />
        {/* Center line */}
        <line x1="6" y1="140" x2="194" y2="140" stroke="white" strokeWidth="0.5" />
        {/* Center circle */}
        <circle cx="100" cy="140" r="22" fill="none" stroke="white" strokeWidth="0.5" />
        <circle cx="100" cy="140" r="1.5" fill="white" />
        {/* Top penalty box */}
        <rect x="55" y="6" width="90" height="32" fill="none" stroke="white" strokeWidth="0.5" />
        <rect x="78" y="6" width="44" height="14" fill="none" stroke="white" strokeWidth="0.5" />
        {/* Bottom penalty box */}
        <rect x="55" y="242" width="90" height="32" fill="none" stroke="white" strokeWidth="0.5" />
        <rect x="78" y="260" width="44" height="14" fill="none" stroke="white" strokeWidth="0.5" />
      </svg>
      {/* Grass stripes */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "repeating-linear-gradient(180deg, transparent 0px, transparent 24px, rgba(255,255,255,0.04) 24px, rgba(255,255,255,0.04) 48px)",
        }}
      />

      <div className="relative grid grid-rows-4 gap-2 sm:gap-3 p-3 sm:p-5 min-h-[400px] sm:min-h-[440px] lg:min-h-[460px]">
        {groups.map((g) => (
          <div
            key={g.key}
            className={cn(
              "flex items-center gap-2 sm:gap-3 justify-around",
              g.ids.length > 4 ? "px-1" : "px-3 sm:px-8"
            )}
          >
            {g.ids.map((slotId) => {
              const playerId = slots[slotId];
              const player = playerId ? playerById.get(playerId) : undefined;
              return (
                <SlotTarget
                  key={slotId}
                  slotId={slotId}
                  player={player ?? null}
                  onRemove={() => onRemoveFromSlot(slotId)}
                  onToggleSell={() => player && onToggleSell(player.id)}
                  isSellMarked={!!player && sells.has(player.id)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Formation label */}
      <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/30 backdrop-blur text-white text-[10px] font-mono tabular">
        {formation} · {f.def + f.mid + f.fwd + 1}/11
      </div>
    </div>
  );
}

function SlotTarget({
  slotId,
  player,
  onRemove,
  onToggleSell,
  isSellMarked,
}: {
  slotId: string;
  player: PlannerPlayer | null;
  onRemove: () => void;
  onToggleSell: () => void;
  isSellMarked: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: slotId });
  const requiredPos = POS_FOR_SLOT[slotId];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative rounded-xl transition-all w-[60px] sm:w-[72px] lg:w-[78px]",
        isOver && "ring-2 ring-white scale-105"
      )}
    >
      {player ? (
        <PitchPlayer
          player={player}
          onRemove={onRemove}
          onToggleSell={onToggleSell}
          isSellMarked={isSellMarked}
        />
      ) : (
        <EmptySlot pos={requiredPos} />
      )}
    </div>
  );
}

function EmptySlot({ pos }: { pos: number }) {
  const label = POSITION_LABELS[pos] ?? "?";
  return (
    <div className="aspect-[3/4] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/35 bg-black/10 text-white/65 text-[10px] font-bold tracking-wider gap-1">
      <div className="size-7 rounded-full bg-white/10 flex items-center justify-center text-[9px]">
        +
      </div>
      {label}
    </div>
  );
}

function PitchPlayer({
  player,
  onRemove,
  onToggleSell,
  isSellMarked,
}: {
  player: PlannerPlayer;
  onRemove: () => void;
  onToggleSell: () => void;
  isSellMarked: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: player.id,
    data: { pos: player.pos },
  });
  const team = teamMeta(player.tid);

  return (
    <div className={cn("relative", isDragging && "opacity-30")}>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing"
      >
        <div className="rounded-xl bg-white shadow-md ring-1 ring-emerald-900/20 overflow-hidden hover:scale-[1.03] transition-transform">
          <div
            className="aspect-[1/1] flex items-center justify-center text-xs font-bold relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${team.color}26, ${team.color}0a)` }}
          >
            <PlayerAvatar
              pim={player.pim}
              tid={player.tid}
              size={88}
              rounded="md"
              className="ring-0 bg-transparent w-full h-full"
            />
            {isSellMarked && (
              <span className="absolute inset-0 bg-rose-500/35 flex items-center justify-center">
                <Tag className="size-5 text-white drop-shadow" />
              </span>
            )}
            {player.st !== undefined && player.st !== 0 && (
              <span className="absolute bottom-1 right-1 size-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] ring-1 ring-white" title="Verletzt/Gesperrt">
                <AlertTriangle className="size-3" />
              </span>
            )}
          </div>
          <div className="px-1.5 py-1 text-center">
            <div className="text-[10px] sm:text-[11px] font-semibold truncate">
              {player.name}
            </div>
            <div className="text-[9px] font-mono text-muted-foreground tabular">
              {formatEUR(player.mv, { compact: true })}
            </div>
          </div>
        </div>
      </div>
      {/* Action buttons */}
      <div className="absolute -top-1 -right-1 flex gap-0.5 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSell();
          }}
          className={cn(
            "size-5 rounded-full text-[9px] ring-1 ring-white transition-colors flex items-center justify-center",
            isSellMarked ? "bg-rose-500 text-white" : "bg-black/60 text-white hover:bg-rose-500"
          )}
          title="Verkaufen"
        >
          €
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="size-5 rounded-full bg-black/60 text-white text-[9px] ring-1 ring-white hover:bg-black/80 flex items-center justify-center"
          title="Auf Bank"
        >
          <ArrowDown className="size-3" />
        </button>
      </div>
    </div>
  );
}

/* ─── Bench ────────────────────────────────────────────── */

function BenchZone({
  players,
  sells,
  freeSlotByPos,
  onToggleSell,
  onPlace,
}: {
  players: PlannerPlayer[];
  sells: Set<string>;
  freeSlotByPos: Record<number, number>;
  onToggleSell: (id: string) => void;
  onPlace: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "bench" });
  const grouped = [
    { pos: 1, label: "Tor" },
    { pos: 2, label: "Abwehr" },
    { pos: 3, label: "Mittelfeld" },
    { pos: 4, label: "Sturm" },
  ];

  return (
    <Card
      ref={setNodeRef as unknown as React.Ref<HTMLDivElement>}
      className={cn("transition-all", isOver && "ring-2 ring-primary card-glow")}
    >
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-4" />
            </span>
            <span className="font-semibold">Bank</span>
            <Badge variant="muted" className="text-[10px]">
              {players.length}
            </Badge>
          </div>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            Drag oder <span className="text-foreground font-medium">+</span> zum Aufstellen
          </span>
        </div>
        {players.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Alle Spieler aus deinem Kader sind in der Aufstellung.
          </p>
        ) : (
          <div className="space-y-3">
            {grouped.map((g) => {
              const list = players.filter((p) => p.pos === g.pos);
              if (list.length === 0) return null;
              const free = freeSlotByPos[g.pos] ?? 0;
              return (
                <div key={g.pos}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <PositionBadge pos={g.pos} />
                    <span className="text-xs text-muted-foreground">
                      {list.length} Spieler · Σ{" "}
                      {formatEUR(
                        list.reduce((s, p) => s + (p.mv ?? 0), 0),
                        { compact: true }
                      )}
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {free > 0 ? (
                        <span className="text-primary font-semibold">
                          {free} {free === 1 ? "freier Platz" : "freie Plätze"}
                        </span>
                      ) : (
                        "alle besetzt"
                      )}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {list.map((p) => (
                      <PlayerCard
                        key={p.id}
                        player={p}
                        isSellMarked={sells.has(p.id)}
                        canPlace={free > 0}
                        onToggleSell={() => onToggleSell(p.id)}
                        onPlace={() => onPlace(p.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlayerCard({
  player,
  isSellMarked,
  canPlace,
  onToggleSell,
  onPlace,
  dragging,
}: {
  player: PlannerPlayer;
  isSellMarked?: boolean;
  canPlace?: boolean;
  onToggleSell?: () => void;
  onPlace?: () => void;
  dragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: player.id,
    data: { pos: player.pos },
  });
  const trend = player.tfhmvt ?? 0;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "relative rounded-xl border bg-card p-2.5 touch-none cursor-grab active:cursor-grabbing card-hover",
        isDragging && "opacity-30",
        isSellMarked && "border-rose-300 bg-rose-50/40",
        dragging && "shadow-2xl ring-2 ring-primary"
      )}
    >
      <div className="flex items-center gap-2.5">
        <PlayerAvatar pim={player.pim} tid={player.tid} size={40} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate flex items-center gap-1">
            {player.name}
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <TeamTag tid={player.tid} size="xs" />
            <span className="font-mono tabular">
              {formatEUR(player.mv, { compact: true })}
            </span>
            {trend !== 0 && (
              <span
                className={cn(
                  "font-mono tabular",
                  trend > 0 ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {formatDelta(trend)}
              </span>
            )}
          </div>
        </div>
        {!dragging && (
          <div className="flex items-center gap-1 shrink-0">
            {onPlace && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (canPlace) onPlace();
                }}
                disabled={!canPlace}
                className={cn(
                  "size-7 rounded text-base font-bold transition-colors flex items-center justify-center",
                  canPlace
                    ? "bg-primary/15 text-primary hover:bg-primary hover:text-primary-foreground ring-1 ring-primary/30"
                    : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                )}
                title={canPlace ? "Auf nächsten freien Platz setzen" : "Keine freie Position auf dem Platz"}
                aria-label="Aufstellen"
              >
                +
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSell?.();
              }}
              className={cn(
                "size-7 rounded text-xs transition-colors flex items-center justify-center",
                isSellMarked
                  ? "bg-rose-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-rose-100 hover:text-rose-600"
              )}
              title="Zum Verkauf markieren"
              aria-label="Verkaufen"
            >
              €
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sells summary ────────────────────────────────────── */

function SellsSummary({
  players,
  totalValue,
  onUntag,
}: {
  players: PlannerPlayer[];
  totalValue: number;
  onUntag: (id: string) => void;
}) {
  return (
    <Card className="border-rose-200 bg-rose-50/40 slide-up">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="size-7 rounded-lg bg-rose-500/15 text-rose-600 flex items-center justify-center">
              <Tag className="size-4" />
            </span>
            <span className="font-semibold text-rose-900">Verkaufs-Plan</span>
            <Badge variant="danger" className="text-[10px]">
              {players.length} {players.length === 1 ? "Spieler" : "Spieler"}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Erlös
            </div>
            <div className="font-mono font-bold tabular text-emerald-700">
              + {formatEUR(totalValue, { compact: true })}
            </div>
          </div>
        </div>
        <div className="grid gap-1.5">
          {players.map((p) => {
            return (
              <div
                key={p.id}
                className="flex items-center gap-2 py-1 px-2 rounded bg-white/60 ring-1 ring-rose-100"
              >
                <TeamTag tid={p.tid} size="xs" />
                <span className="text-sm font-medium truncate flex-1">{p.name}</span>
                <span className="text-xs font-mono text-emerald-700 tabular">
                  + {formatEUR(p.mv, { compact: true })}
                </span>
                <button
                  onClick={() => onUntag(p.id)}
                  className="size-5 rounded hover:bg-rose-100 text-muted-foreground hover:text-rose-700 flex items-center justify-center transition-colors"
                  aria-label="Verkaufs-Markierung entfernen"
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
