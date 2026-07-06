import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getAccess } from "@/lib/entitlement";
import { assembleCompetitionStats } from "@/lib/competition-data";
import { saveSnapshot, type Snapshot } from "@/lib/snapshot-store";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const Body = z.object({ leagueId: z.string().min(1) });

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const access = await getAccess(session.userId);
  if (!access.pro && !access.trial) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const data = await assembleCompetitionStats(session.token, body.leagueId, session.userId);
  if (!data) return NextResponse.json({ error: "NO_DATA" }, { status: 404 });

  // NUR Anzeige-Felder – kein Token, keine User-IDs.
  const rows: Snapshot["rows"] = [...data.stats]
    .sort((a, b) => b.netTeamValue - a.netTeamValue)
    .map((s) => ({
      name: s.name,
      seasonPoints: s.seasonPoints,
      matchdayWins: s.matchdayWins,
      teamValue: s.teamValue,
      cashEstimate: s.cashEstimate,
      maxBidSingleSell: s.maxBidSingleSell,
      netTeamValue: s.netTeamValue,
    }));

  const snapshot: Snapshot = {
    leagueName: data.leagueName,
    createdAt: new Date().toISOString(),
    rows,
  };

  const token = randomUUID();
  await saveSnapshot(token, snapshot);

  return NextResponse.json({ url: `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/s/${token}` });
}
