/**
 * TEMP-DIAGNOSE — vollständiger Cash-Pipeline-Vergleich für den eingeloggten User.
 * Beantwortet: warum weicht projiziertes Cash vom IST-Cash (/me/budget) ab?
 *
 * GET /api/diag/cash?leagueId=XXXX
 * NACH DIAGNOSE LÖSCHEN.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { kb } from "@/lib/kickbase/api";
import type { KbActivity } from "@/lib/kickbase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const M = (n: number) => +(n / 1_000_000).toFixed(3);

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const leagueId = new URL(req.url).searchParams.get("leagueId");
  if (!leagueId)
    return NextResponse.json({ error: "leagueId required" }, { status: 400 });

  const uid = s.userId;

  const [budget, ranking, activities, transfers, ach] = await Promise.all([
    kb.myBudget(s.token, leagueId).catch(() => null),
    kb.ranking(s.token, leagueId).catch(() => null),
    kb.activitiesAll(s.token, leagueId).catch(() => [] as KbActivity[]),
    kb.managerTransferAll(s.token, leagueId, uid).catch(() => []),
    kb.userAchievementsTotal(s.token, leagueId).catch(() => ({ items: [], total: 0 })),
  ]);

  const istCash = budget?.b;
  const me = (ranking?.us ?? ranking?.it ?? []).find((u) => u.i === uid);
  const seasonPoints = me?.sp ?? 0;

  // Transfers
  let bought = 0, sold = 0, nBuy = 0, nSell = 0;
  let txMin = Infinity, txMax = -Infinity;
  for (const t of transfers) {
    if (t.tty === 1) { bought += t.trp ?? 0; nBuy++; }
    else if (t.tty === 2) { sold += t.trp ?? 0; nSell++; }
    const ts = new Date(t.dt).getTime();
    if (!isNaN(ts)) { txMin = Math.min(txMin, ts); txMax = Math.max(txMax, ts); }
  }

  // Activity-Feed: alle bn-Auszahlungen, gruppiert nach Typ-Code `t`
  const mine = activities.filter((a) => a.u?.i === undefined || a.u.i === uid);
  let actMin = Infinity, actMax = -Infinity;
  const byType: Record<string, { count: number; bnSum: number; sample: unknown }> = {};
  let totalBnAll = 0;
  const bnEvents: Array<{ t: number; date: string; day: unknown; bn_k: number; keys: string[] }> = [];
  for (const a of mine) {
    const d = (a.data ?? a.d ?? {}) as Record<string, unknown>;
    const bn = typeof d.bn === "number" ? d.bn : 0;
    const key = String(a.t);
    if (!byType[key]) byType[key] = { count: 0, bnSum: 0, sample: d };
    byType[key].count++;
    byType[key].bnSum += bn;
    totalBnAll += bn;
    const ts = new Date(a.dt ?? "").getTime();
    if (!isNaN(ts)) { actMin = Math.min(actMin, ts); actMax = Math.max(actMax, ts); }
    if (bn > 0) bnEvents.push({
      t: a.t as number,
      date: new Date(a.dt ?? "").toISOString().slice(0, 10),
      day: d.day ?? d.md ?? null,
      bn_k: Math.round(bn / 1000),
      keys: Object.keys(d),
    });
  }
  bnEvents.sort((a, b) => (a.date < b.date ? -1 : 1));
  const byTypeOut = Object.fromEntries(
    Object.entries(byType).map(([k, v]) => [k, { count: v.count, bnSumMio: M(v.bnSum) }])
  );

  const INITIAL = 50_000_000;
  const pointsPremium = seasonPoints * 1_000; // 1k €/Pkt
  const achTotal = ach.total;

  // Drei Rekonstruktions-Varianten:
  // A) Nur Feed: initial - bought + sold + Σ(alle bn aus Feed)
  const estA = INITIAL - bought + sold + totalBnAll;
  // B) Aktuelle Pipeline: initial - bought + sold + sp×1k + achievements.total (+ login-est, hier 0 zur Isolierung)
  const estB = INITIAL - bought + sold + pointsPremium + achTotal;
  // C) wie B aber OHNE pointsPremium (falls Punkteprämie schon in achievements.total steckt)
  const estC = INITIAL - bought + sold + achTotal;

  const iso = (ms: number) => (isFinite(ms) ? new Date(ms).toISOString().slice(0, 10) : null);

  return NextResponse.json(
    {
      user: { uid, name: me?.n, seasonPoints },
      istCash_Mio: istCash != null ? M(istCash) : null,
      components: {
        initial_Mio: M(INITIAL),
        bought_Mio: M(bought), nBuy,
        sold_Mio: M(sold), nSell,
        transferBalance_Mio: M(sold - bought),
        feed_totalBn_Mio: M(totalBnAll),
        pointsPremium_Mio: M(pointsPremium),
        achievementsTotal_Mio: M(achTotal),
      },
      estimates_vs_ist: {
        A_feedOnly_Mio: M(estA),
        A_gap_Mio: istCash != null ? M(istCash - estA) : null,
        B_pipeline_pts_plus_ach_Mio: M(estB),
        B_gap_Mio: istCash != null ? M(istCash - estB) : null,
        C_ach_only_no_pts_Mio: M(estC),
        C_gap_Mio: istCash != null ? M(istCash - estC) : null,
      },
      feed: {
        activitiesTotal: activities.length,
        mineCount: mine.length,
        dateRange: { from: iso(actMin), to: iso(actMax) },
        byType: byTypeOut,
      },
      transfers: { count: transfers.length, dateRange: { from: iso(txMin), to: iso(txMax) } },
      bnEvents,
      achievements: ach.items
        .filter((a) => (a.ac ?? 0) > 0 || a.total > 0)
        .map((a) => ({ t: a.t, n: a.n, ac: a.ac ?? 0, er_Mio: M(a.er), total_Mio: M(a.total) })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
