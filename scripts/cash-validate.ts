/**
 * Cash-Modell-Validierung: lässt das Strukturmodell (lib/competitor.ts)
 * gegen die Snapshots laufen. Der eigene Account wird dabei WIE EIN
 * KONKURRENT behandelt (ohne IST-Cash-Anker) — der Fehler gegen den echten
 * Cash aus /me/budget ist die ehrliche Modellgüte.
 *
 * Run: pnpm tsx scripts/cash-validate.ts [snapshot.json ...]
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const { computeManagerStats, calibrateFromOwnAccount, calibrateResidualPerPoint, DEFAULT_CALIBRATION } =
    await import("../lib/competitor");

  const args = process.argv.slice(2);
  const files = args.length
    ? args
    : readdirSync(join(process.cwd(), "diag", "snapshots"))
        .filter((f) => f.endsWith(".json"))
        .map((f) => join("diag", "snapshots", f));

  const fmtM = (n: number) => `${(n / 1_000_000).toFixed(2).replace(".", ",")}M`;

  for (const file of files) {
    const s = JSON.parse(readFileSync(file, "utf8"));
    const my: string = s.meta.myUserId;
    const leagueStartMs = Date.parse(String(s.overview.dt ?? ""));
    const nowMs = Date.parse(s.meta.fetchedAt);
    const realCash = Number(s.myBudget?.b ?? NaN);
    const members = (s.ranking.us ?? s.ranking.it ?? []) as Array<Record<string, unknown>>;
    const leagueTotalPoints = members.reduce((sum: number, u) => sum + Number(u.sp ?? 0), 0);
    const seasonFinished = Number(s.ranking.day ?? 0) >= Number(s.ranking.nd ?? 34);

    console.log(`\n═══ ${s.meta.leagueName} (${s.meta.leagueId}) — echter Cash ${fmtM(realCash)} ═══`);

    const base = (uid: string) => {
      const m = s.managers[uid];
      const rankingEntry = members.find((u) => String(u.i) === uid);
      return {
        userId: uid,
        name: m.info.n as string,
        transfers: m.transfers,
        squad: m.squad,
        dashboard: m.dashboard,
        rankingEntry: rankingEntry as never,
        leagueStartMs,
        nowMs,
        seasonFinished,
        matchdaysPlayed: Number(s.ranking.nd ?? 34) || 34,
        leagueTotalPoints,
      };
    };

    // Pass 1: eigener User OHNE Anker, residualPerPoint=0 → ehrlicher Fehler
    const ownTx = s.managers[my].transfers as Array<{ tty: number; trp: number; dt: string }>;
    const ownSold = ownTx
      .filter((t) => t.tty === 2 && Date.parse(t.dt) > leagueStartMs)
      .reduce((sum, t) => sum + t.trp, 0);
    const ownTp = Number(s.managers[my].dashboard?.tp ?? 0);
    const calRaw = calibrateFromOwnAccount({ achievements: s.achievements, ownTp, ownSoldVolume: ownSold });
    const calPass1 = { ...calRaw, residualPerPoint: 0 };

    const ownAsCompetitor = computeManagerStats({
      ...base(my),
      calibration: calPass1,
      // KEIN achievements / realCashFromApi → volle Schätzung wie für Fremde
    });
    const honestError = realCash - ownAsCompetitor.cashEstimate;
    console.log(`Eigener Account als Konkurrent geschätzt: ${fmtM(ownAsCompetitor.cashEstimate)}`);
    console.log(`  → EHRLICHER FEHLER: ${fmtM(honestError)} (${((honestError / realCash) * 100).toFixed(1)}% vom echten Cash)`);
    console.log(
      `  Komponenten: Start 50M | TransferNetto ${fmtM(ownAsCompetitor.transferBalance)} | Prämie ${fmtM(ownAsCompetitor.estimatedPointsBonus)} | Siege ${fmtM(ownAsCompetitor.estimatedWinBonus)} | Tagesbonus ${fmtM(ownAsCompetitor.estimatedLoginBonus)} | Achievements ${fmtM(ownAsCompetitor.estimatedAchievementBonus)}`
    );

    // Pass 2: Kalibrierung wie in Produktion (eigener User mit echten
    // Achievements + IST-Cash → residualPerPoint), dann alle Manager
    const ownWithAnchor = computeManagerStats({
      ...base(my),
      calibration: calPass1,
      achievements: s.achievements.total > 0 ? s.achievements : undefined,
      realCashFromApi: Number.isFinite(realCash) ? realCash : undefined,
    });
    const residualRate = calibrateResidualPerPoint(ownWithAnchor) ?? DEFAULT_CALIBRATION.residualPerPoint;
    const calFull = { ...calRaw, residualPerPoint: residualRate };
    console.log(`  residualPerPoint (geeicht): ${residualRate.toFixed(1)} €/Pkt`);

    console.log(`\n  ${"Manager".padEnd(20)} ${"Cash-Schätzung".padStart(14)} ${"MaxBid".padStart(12)} ${"tp".padStart(6)} ${"mdw".padStart(4)} ${"Tage".padStart(5)}`);
    for (const u of members) {
      const uid = String(u.i);
      const st = computeManagerStats({
        ...base(uid),
        calibration: calFull,
        achievements: uid === my && s.achievements.total > 0 ? s.achievements : undefined,
        realCashFromApi: uid === my && Number.isFinite(realCash) ? realCash : undefined,
      });
      const marker = uid === my ? " ★" : st.cashUncertain ? " ⚠" : "";
      console.log(
        `  ${(st.name + marker).padEnd(20)} ${fmtM(st.cashEstimate).padStart(14)} ${fmtM(st.maxBidSingleSell).padStart(12)} ${String(st.totalMatchdayPoints).padStart(6)} ${String(st.matchdayWins).padStart(4)} ${String(st.daysActive).padStart(5)}`
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
