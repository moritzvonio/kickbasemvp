/**
 * TEMP-DIAGNOSE — probiert Parameter-Varianten des competition/players-
 * Endpoints durch (Sortierung, start, max, page, position) und schreibt die
 * Ergebnisse (Count + Sample) ins KV. Session-gated (braucht Login-Cookie).
 * User öffnet die URL einmal; ich lese per networth-peek aus.
 * NACH DIAGNOSE LÖSCHEN.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { kbFetch } from "@/lib/kickbase/client";
import type { KbCompetitionPlayersResponse, KbCompetitionPlayer } from "@/lib/kickbase/types";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function summarize(it: KbCompetitionPlayer[]) {
  return {
    count: it.length,
    sample: it.slice(0, 3).map((p) => ({ n: p.n, p: p.p, pos: p.pos })),
    maxP: it.reduce((m, p) => Math.max(m, p.p ?? 0), 0),
  };
}

async function probe(
  token: string,
  query: Record<string, string | number | boolean | null | undefined>
) {
  try {
    const r = await kbFetch<KbCompetitionPlayersResponse>(
      `/v4/competitions/1/players`,
      { token, query }
    );
    return summarize(r.it ?? []);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "err" };
  }
}

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "login required" }, { status: 401 });
  const t = s.token;

  const results: Record<string, unknown> = {
    noPosition: await probe(t, {}),
    pos2_default: await probe(t, { position: 2 }),
    pos2_start25: await probe(t, { position: 2, start: 25 }),
    pos2_start50: await probe(t, { position: 2, start: 50 }),
    pos2_max500: await probe(t, { position: 2, max: 500 }),
    pos2_page1: await probe(t, { position: 2, page: 1 }),
    pos2_sort0: await probe(t, { position: 2, sorting: 0 }),
    pos2_sort1: await probe(t, { position: 2, sorting: 1 }),
    pos2_sort2: await probe(t, { position: 2, sorting: 2 }),
    pos2_sort3: await probe(t, { position: 2, sorting: 3 }),
    pos2_sort4: await probe(t, { position: 2, sorting: 4 }),
  };

  try {
    await kv.set("diag:comp-explore", { ts: Date.now(), results }, { ex: 3600 });
  } catch {
    /* */
  }
  return NextResponse.json({ ok: true, results });
}
