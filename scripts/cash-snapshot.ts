/**
 * Cash-Diagnose: Snapshot-Puller.
 *
 * Zieht ALLE Rohdaten, die für die Cash-Schätzung relevant sind, und legt
 * sie als JSON unter diag/snapshots/ ab — danach kann die Analyse
 * (scripts/cash-analyze.ts) beliebig oft offline laufen, ohne die
 * Kickbase-API erneut zu belasten.
 *
 * Login-Daten aus .env.local (KICKBASE_EMAIL / KICKBASE_PASSWORD).
 *
 * Run:
 *   pnpm tsx scripts/cash-snapshot.ts            # alle Ligen
 *   pnpm tsx scripts/cash-snapshot.ts <leagueId> # nur eine Liga
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvLocal() {
  try {
    const txt = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* .env.local optional */
  }
}
loadEnvLocal();

async function main() {
const email = process.env.KICKBASE_EMAIL;
const password = process.env.KICKBASE_PASSWORD;
if (!email || !password) {
  console.error("KICKBASE_EMAIL / KICKBASE_PASSWORD fehlen in .env.local");
  process.exit(1);
}

// Import NACH dem Env-Load (lib/env parst beim Import)
const { kb } = await import("../lib/kickbase/api");
const { decodeKickbaseToken } = await import("../lib/session");

const onlyLeagueId = process.argv[2];

console.log("→ Login als", email);
const login = await kb.login({ em: email, pass: password });
const token = login.token ?? login.tkn;
if (!token) {
  console.error("Login fehlgeschlagen — keine token im Response:", JSON.stringify(login).slice(0, 300));
  process.exit(1);
}
const decoded = decodeKickbaseToken(token);
const myUserId = decoded.uid ?? login.user?.i ?? login.u?.i ?? "";
console.log("✓ Token erhalten. userId =", myUserId, "| exp =", decoded.exp ? new Date(decoded.exp * 1000).toISOString() : "?");

// /leagues/selection liefert pro Liga das eigene Budget (b) mit — wichtiger
// Wahrheits-Anker. /v4/leagues antwortet mit `lins` (nicht `it`), daher
// selection als primäre Quelle.
const selection = await kb.leagues(token);
const leagues: Array<{ i: string; n: string; b?: number; tv?: number }> = (selection.it ?? []).map(
  (l) => ({ i: l.i, n: l.n, b: l.b, tv: (l as unknown as Record<string, unknown>).tv as number | undefined })
);
console.log(`✓ ${leagues.length} Liga(en):`, leagues.map((l) => `${l.n} (${l.i}${l.b !== undefined ? `, b=${l.b}` : ""})`).join(" · "));

const targets = onlyLeagueId ? leagues.filter((l) => l.i === onlyLeagueId) : leagues;
if (targets.length === 0) {
  console.error("Keine passende Liga gefunden.");
  process.exit(1);
}

mkdirSync(join(process.cwd(), "diag", "snapshots"), { recursive: true });

for (const league of targets) {
  const t0 = Date.now();
  console.log(`\n═══ Liga "${league.n}" (${league.i}) ═══`);

  const [overview, ranking, activities, myBudget, meInLeague, achievements] = await Promise.all([
    kb.leagueOverviewWithManagers(token, league.i).catch((e) => ({ __error: String(e) })),
    kb.ranking(token, league.i).catch((e) => ({ __error: String(e) })),
    kb.activitiesAll(token, league.i).catch(() => []),
    kb.myBudget(token, league.i).catch((e) => ({ __error: String(e) })),
    kb.meInLeague(token, league.i).catch((e) => ({ __error: String(e) })),
    kb.userAchievementsTotal(token, league.i).catch(() => ({ items: [], total: 0 })),
  ]);

  const rankingRec = ranking as Record<string, unknown>;
  const members = ((rankingRec.us ?? rankingRec.it) as Array<{ i: string; n: string }> | undefined) ?? [];
  console.log(`  overview/ranking geladen · ${members.length} Manager · ${(activities as unknown[]).length} Activities`);

  // Per-Spieltag-Rankings (1..nd), tolerant gegen Fehler
  const totalDays = Number(rankingRec.nd ?? 34) || 34;
  const perDayRankings: Record<number, unknown> = {};
  for (let day = 1; day <= totalDays; day++) {
    const r = await kb.ranking(token, league.i, day).catch(() => null);
    if (r) perDayRankings[day] = r;
  }
  console.log(`  per-Spieltag-Rankings: ${Object.keys(perDayRankings).length}/${totalDays}`);

  // Pro Manager: Transfers (voll paginiert) + Squad + Dashboard
  const managers: Record<string, unknown> = {};
  for (const m of members) {
    const [transfers, squad, dashboard] = await Promise.all([
      kb.managerTransferAll(token, league.i, m.i).catch(() => []),
      kb.managerSquad(token, league.i, m.i).catch(() => null),
      kb.managerDashboard(token, league.i, m.i).catch(() => null),
    ]);
    managers[m.i] = { info: m, transfers, squad, dashboard };
    console.log(`  ${m.n}: ${(transfers as unknown[]).length} Transfers, Squad ${squad ? "✓" : "✗"}, Dashboard ${dashboard ? "✓" : "✗"}`);
  }

  const snapshot = {
    meta: {
      fetchedAt: new Date().toISOString(),
      leagueId: league.i,
      leagueName: league.n,
      myUserId,
      leagueListBudget: league.b,
    },
    overview,
    ranking,
    perDayRankings,
    activities,
    myBudget,
    meInLeague,
    achievements,
    managers,
  };

  const file = join(process.cwd(), "diag", "snapshots", `${league.i}_${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(file, JSON.stringify(snapshot, null, 1));
  console.log(`  ✓ Snapshot → ${file} (${Math.round(Date.now() - t0) / 1000}s)`);
}

console.log("\nFertig.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
