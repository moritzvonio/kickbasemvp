/**
 * Cash-Diagnose: Offline-Analyse der Snapshots.
 *
 * Beantwortet empirisch:
 *  1. Was steht im Activity-Feed (t-Codes, bn-Events, pro User)?
 *  2. Welche Komponenten erklären den EIGENEN Cash exakt (Bilanz-Identität)?
 *  3. Wie groß ist der Restfehler (Residual) und womit korreliert er
 *     (Tage / Punkte / Teamwert)?
 *
 * Run: pnpm tsx scripts/cash-analyze.ts [diag/snapshots/<file>.json ...]
 * Ohne Argument: alle Snapshots unter diag/snapshots/.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

interface Snapshot {
  meta: { fetchedAt: string; leagueId: string; leagueName: string; myUserId: string; leagueListBudget?: number };
  overview: Record<string, unknown>;
  ranking: Record<string, unknown>;
  perDayRankings: Record<string, { us?: Array<Record<string, unknown>>; it?: Array<Record<string, unknown>> }>;
  activities: Array<Record<string, unknown>>;
  myBudget: Record<string, unknown>;
  meInLeague: Record<string, unknown>;
  achievements: { items: Array<{ t: number; n?: string; ac?: number; er: number; total: number }>; total: number };
  managers: Record<
    string,
    {
      info: { i: string; n: string };
      transfers: Array<{ pi: string; pn: string; tty: number; trp: number; dt: string }>;
      squad: { it?: Array<{ pi: string; mv?: number }> } | null;
      dashboard: Record<string, unknown> | null;
    }
  >;
}

const fmtM = (n: number) => `${(n / 1_000_000).toFixed(3).replace(".", ",")}M`;
const pad = (s: string | number, w: number) => String(s).padStart(w);

function analyzeLeague(file: string) {
  const s: Snapshot = JSON.parse(readFileSync(file, "utf8"));
  const my = s.meta.myUserId;
  const leagueStartMs = Date.parse(String(s.overview.dt ?? ""));
  const realCash = Number(s.myBudget.b ?? s.meta.leagueListBudget ?? NaN);

  console.log(`\n${"═".repeat(72)}`);
  console.log(`LIGA "${s.meta.leagueName}" (${s.meta.leagueId}) — Snapshot ${s.meta.fetchedAt.slice(0, 10)}`);
  console.log(`${"═".repeat(72)}`);
  console.log(`Liga-Start (overview.dt): ${s.overview.dt}   Echter Cash: ${fmtM(realCash)}`);

  // ── 1. Feed-Forensik ────────────────────────────────────────────
  const acts = s.activities;
  const actDts = acts.map((a) => new Date(String(a.dt)).getTime()).filter((n) => !isNaN(n)).sort((a, b) => a - b);
  if (actDts.length) {
    console.log(`\n── Feed: ${acts.length} Events, ${new Date(actDts[0]).toISOString().slice(0, 10)} → ${new Date(actDts[actDts.length - 1]).toISOString().slice(0, 10)} (TRUNKIERT wenn < Liga-Start)`);
  }
  const byT = new Map<number, { count: number; withU: number; bnSum: number; bnCount: number; keys: Set<string>; example?: unknown }>();
  for (const a of acts) {
    const t = Number(a.t);
    let e = byT.get(t);
    if (!e) { e = { count: 0, withU: 0, bnSum: 0, bnCount: 0, keys: new Set() }; byT.set(t, e); }
    e.count++;
    const u = a.u as { i?: string } | undefined;
    if (u?.i) e.withU++;
    const data = (a.data ?? a.d ?? {}) as Record<string, unknown>;
    for (const k of Object.keys(data)) e.keys.add(k);
    const bn = typeof data.bn === "number" ? data.bn : 0;
    if (bn > 0) { e.bnSum += bn; e.bnCount++; if (!e.example) e.example = data; }
  }
  for (const [t, e] of [...byT.entries()].sort((a, b) => b[1].count - a[1].count)) {
    console.log(
      `   t=${pad(t, 3)}  n=${pad(e.count, 4)}  mitUser=${pad(e.withU, 4)}  bn-Events=${pad(e.bnCount, 3)}  Σbn=${pad(fmtM(e.bnSum), 10)}  keys=[${[...e.keys].join(",")}]` +
        (e.example ? `  bsp=${JSON.stringify(e.example).slice(0, 90)}` : "")
    );
  }

  // bn-Events pro User (im Feed-Fenster)
  const bnByUser = new Map<string, { n: string; count: number; sum: number; perDay: Map<number, number> }>();
  for (const a of acts) {
    const data = (a.data ?? a.d ?? {}) as Record<string, unknown>;
    const bn = typeof data.bn === "number" ? data.bn : 0;
    if (bn <= 0) continue;
    const u = a.u as { i?: string; n?: string } | undefined;
    const uid = u?.i ?? "(ohne user)";
    let e = bnByUser.get(uid);
    if (!e) { e = { n: u?.n ?? uid, count: 0, sum: 0, perDay: new Map() }; bnByUser.set(uid, e); }
    e.count++; e.sum += bn;
    const day = Number(data.day);
    if (Number.isFinite(day)) e.perDay.set(day, (e.perDay.get(day) ?? 0) + bn);
  }
  console.log(`\n── bn-Events pro User (nur Feed-Fenster!):`);
  for (const [uid, e] of bnByUser) {
    console.log(`   ${e.n.padEnd(20)} (${uid})  n=${pad(e.count, 3)}  Σ=${pad(fmtM(e.sum), 10)}  days=[${[...e.perDay.keys()].sort((a, b) => a - b).join(",")}]`);
  }

  // Vergleich: bn(day) vs mdp(day)×1000 für User mit bn-Events
  console.log(`\n── Payout-Check: bn(Spieltag) vs mdp×1000 (nur Tage im Feed-Fenster):`);
  for (const [uid, e] of bnByUser) {
    if (uid === "(ohne user)") continue;
    const rows: string[] = [];
    for (const [day, bn] of [...e.perDay.entries()].sort((a, b) => a[0] - b[0])) {
      const r = s.perDayRankings[String(day)];
      const us = (r?.us ?? r?.it ?? []) as Array<Record<string, unknown>>;
      const meRow = us.find((x) => String(x.i) === uid);
      const mdp = Number(meRow?.mdp ?? NaN);
      rows.push(`MD${day}: bn=${Math.round(bn / 1000)}k vs mdp×1k=${Number.isFinite(mdp) ? mdp : "?"}k (mdp=${mdp})`);
    }
    if (rows.length) console.log(`   ${e.n}: ${rows.join(" · ")}`);
  }

  // ── 2. Eigene Bilanz-Identität ──────────────────────────────────
  const meMgr = s.managers[my];
  const transfers = meMgr?.transfers ?? [];
  let boughtAll = 0, soldAll = 0, boughtPost = 0, soldPost = 0;
  let firstTx = Infinity, lastTx = -Infinity;
  for (const t of transfers) {
    const ts = Date.parse(t.dt);
    if (!isNaN(ts)) { firstTx = Math.min(firstTx, ts); lastTx = Math.max(lastTx, ts); }
    if (t.tty === 1) { boughtAll += t.trp; if (ts > leagueStartMs) boughtPost += t.trp; }
    else if (t.tty === 2) { soldAll += t.trp; if (ts > leagueStartMs) soldPost += t.trp; }
  }
  const netAll = soldAll - boughtAll;
  const netPost = soldPost - boughtPost;
  console.log(`\n── Eigene Transfers: n=${transfers.length}, ${isFinite(firstTx) ? new Date(firstTx).toISOString().slice(0, 10) : "?"} → ${isFinite(lastTx) ? new Date(lastTx).toISOString().slice(0, 10) : "?"}`);
  console.log(`   Käufe/Verkäufe (alle):      ${fmtM(boughtAll)} / ${fmtM(soldAll)}  → Netto ${fmtM(netAll)}`);
  console.log(`   Käufe/Verkäufe (post-Start): ${fmtM(boughtPost)} / ${fmtM(soldPost)}  → Netto ${fmtM(netPost)}`);

  // Punkte: tp aus Dashboard (Gesamt), Σ mdp aus perDayRankings (Kreuzcheck)
  const dash = meMgr?.dashboard ?? {};
  const tpDash = Number(dash.tp ?? NaN);
  const mdwDash = Number(dash.mdw ?? NaN);
  let mdpSum = 0, mdCount = 0, wins = 0;
  const tierCounts = { b: 0, s: 0, g: 0, j: 0 }; // >=500/1000/1500/2000 (Bronze/Silber/Gold/Jahrhundert)
  for (const [, r] of Object.entries(s.perDayRankings)) {
    const us = (r?.us ?? r?.it ?? []) as Array<Record<string, unknown>>;
    const meRow = us.find((x) => String(x.i) === my);
    if (!meRow) continue;
    const mdp = Number(meRow.mdp ?? 0);
    mdpSum += mdp; mdCount++;
    if (Number(meRow.mdpl) === 1) wins++;
    if (mdp >= 500) tierCounts.b++;
    if (mdp >= 1000) tierCounts.s++;
    if (mdp >= 1500) tierCounts.g++;
    if (mdp >= 2000) tierCounts.j++;
  }
  console.log(`   Punkte: tp(dashboard)=${tpDash}  Σmdp(rankings)=${mdpSum} über ${mdCount} Spieltage  | Siege: mdw=${mdwDash} vs mdpl==1: ${wins}`);
  console.log(`   Spieltags-Tiers (>=500/1000/1500/2000): ${tierCounts.b}/${tierCounts.s}/${tierCounts.g}/${tierCounts.j}  vs Achievements (100/101/102/103): ${ach(s, 100)}/${ach(s, 101)}/${ach(s, 102)}/${ach(s, 103)}`);

  const achTotal = s.achievements.total;
  const pointsPremie = (Number.isFinite(tpDash) ? tpDash : mdpSum) * 1000;
  const daysSinceStart = Math.floor((Date.parse(s.meta.fetchedAt) - leagueStartMs) / 86_400_000);

  console.log(`\n── BILANZ-IDENTITÄT (eigener Account):`);
  console.log(`   Echter Cash:                      ${fmtM(realCash)}`);
  console.log(`   Start-Budget (Annahme 50M):       ${fmtM(50_000_000)}`);
  console.log(`   + TransferNetto (post-Start):     ${fmtM(netPost)}`);
  console.log(`   + Achievements (real, API):       ${fmtM(achTotal)}`);
  console.log(`   + Punkteprämie (tp × 1000):       ${fmtM(pointsPremie)}`);
  const base = 50_000_000 + netPost + achTotal + pointsPremie;
  const residual = realCash - base;
  console.log(`   = Modell ohne Login/Tagesbonus:   ${fmtM(base)}`);
  console.log(`   → RESIDUAL:                       ${fmtM(residual)}   (${daysSinceStart} Tage seit Liga-Start)`);
  console.log(`     Residual/Tag:   ${Math.round(residual / Math.max(1, daysSinceStart)).toLocaleString("de-DE")} €`);
  console.log(`     Residual/Punkt: ${(residual / Math.max(1, Number.isFinite(tpDash) ? tpDash : mdpSum)).toFixed(1)} €`);
  const netAllResidual = realCash - (50_000_000 + netAll + achTotal + pointsPremie);
  console.log(`     (Variante alle Transfers statt post-Start → Residual: ${fmtM(netAllResidual)})`);

  // ── 3. Manager-Übersicht (Kandidaten-Modelle für Konkurrenten) ──
  console.log(`\n── Manager-Übersicht (tp/mdw aus Dashboard, Transfers post-Start):`);
  console.log(`   ${"Name".padEnd(20)} ${pad("tp", 6)} ${pad("mdw", 4)} ${pad("TransferNetto", 14)} ${pad("Käufe", 10)} ${pad("Verk.", 10)} ${pad("nTx", 5)} ${pad("TV", 10)}`);
  for (const [uid, m] of Object.entries(s.managers)) {
    const d = m.dashboard ?? {};
    let b = 0, so = 0, n = 0;
    for (const t of m.transfers) {
      const ts = Date.parse(t.dt);
      if (!(ts > leagueStartMs)) continue;
      n++;
      if (t.tty === 1) b += t.trp; else if (t.tty === 2) so += t.trp;
    }
    const tv = (m.squad?.it ?? []).reduce((s2, p) => s2 + (p.mv ?? 0), 0);
    console.log(
      `   ${(m.info.n + (uid === my ? " ★" : "")).padEnd(20)} ${pad(String(d.tp ?? "?"), 6)} ${pad(String(d.mdw ?? "?"), 4)} ${pad(fmtM(so - b), 14)} ${pad(fmtM(b), 10)} ${pad(fmtM(so), 10)} ${pad(n, 5)} ${pad(fmtM(tv), 10)}`
    );
  }
}

function ach(s: Snapshot, t: number): number {
  return s.achievements.items.find((i) => i.t === t)?.ac ?? 0;
}

const args = process.argv.slice(2);
const files = args.length
  ? args
  : readdirSync(join(process.cwd(), "diag", "snapshots"))
      .filter((f) => f.endsWith(".json"))
      .map((f) => join("diag", "snapshots", f));

for (const f of files) analyzeLeague(f);
