/**
 * TEMP-DIAGNOSE — Roh-Dump der ranking-tv-Werte über mehrere Spieltage.
 * Beantwortet: liefert kb.ranking(dayNumber) historische oder aktuelle tv?
 *
 * GET /api/_diag/ranking-tv?leagueId=XXXX
 * Auth via bb_session-Cookie (gleiche Origin → automatisch mitgeschickt).
 *
 * NACH DIAGNOSE LÖSCHEN.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { kb } from "@/lib/kickbase/api";
import type { KbRankingUser } from "@/lib/kickbase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pick(users: KbRankingUser[]) {
  return users.slice(0, 6).map((u) => ({
    n: u.n,
    tv: u.tv,
    mdp: u.mdp,
    sp: u.sp,
    spl: u.spl,
  }));
}

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(req.url);
  const leagueId = url.searchParams.get("leagueId");
  if (!leagueId)
    return NextResponse.json({ error: "leagueId required" }, { status: 400 });

  const base = await kb.ranking(s.token, leagueId);
  const currentDay =
    typeof base.day === "number" ? base.day : undefined;

  const daysToProbe = [1, 2, 3, currentDay].filter(
    (d, i, arr): d is number =>
      typeof d === "number" && arr.indexOf(d) === i
  );

  const perDay: Record<string, ReturnType<typeof pick>> = {};
  for (const d of daysToProbe) {
    const r = await kb.ranking(s.token, leagueId, d).catch(() => null);
    perDay[`day${d}`] = r ? pick(r.us ?? r.it ?? []) : [];
  }

  // managerDashboard für ersten User — gibt es mds/ph mit historischem tv?
  const firstUserId = (base.us ?? base.it ?? [])[0]?.i;
  let dashboard: unknown = null;
  if (firstUserId) {
    const dash = await kb
      .managerDashboard(s.token, leagueId, firstUserId)
      .catch(() => null);
    if (dash) {
      dashboard = {
        u: dash.u,
        unm: dash.unm,
        tv: dash.tv,
        tp: dash.tp,
        ph: dash.ph,
        mdsCount: Array.isArray(dash.mds) ? dash.mds.length : null,
        mdsSample: Array.isArray(dash.mds) ? dash.mds.slice(0, 3) : null,
        // alle keys, falls historischer tv woanders versteckt ist
        allKeys: Object.keys(dash as Record<string, unknown>),
      };
    }
  }

  return NextResponse.json(
    {
      currentDay,
      seasonName: base.sn,
      lastFinishedMatchday: base.lfmd,
      numMatchdays: base.nd,
      probedDays: daysToProbe,
      perDay,
      dashboard,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
