/**
 * Kickbase API v4 types.
 *
 * The API uses cryptic short field names (e.g. `mv` for market value, `tid`
 * for team id). We type them as-is and document each one. Helpers in this
 * file map enums to readable names where it matters.
 */

export interface KbLoginRequest {
  em: string;
  pass: string;
}

export interface KbLoginResponse {
  /** Bearer token (JWT) */
  token?: string;
  /** Sometimes the API returns the token under a different key */
  tkn?: string;
  user?: KbUser;
  u?: KbUser;
}

export interface KbUser {
  i?: string; // id
  id?: string;
  email?: string;
  em?: string;
  name?: string;
  n?: string;
}

export interface KbErrorResponse {
  err: number;
  errMsg: string;
  svcs?: unknown[];
}

/** GET /v4/leagues/selection — featured leagues (logged-out style) */
export interface KbLeagueSelection {
  it: KbLeagueListItem[];
  anol?: number;
}

/** GET /v4/leagues — user's leagues (we hope; otherwise use /selection) */
export interface KbLeaguesResponse {
  it: KbLeagueListItem[];
}

export interface KbLeagueListItem {
  /** League id */
  i: string;
  /** League name */
  n: string;
  /** Cover photo id (numeric template id) */
  cpi?: string;
  /** Cover photo absolute path (newer field) */
  cpim?: string;
  /** Custom league image path */
  lim?: string;
  /** League flag/banner */
  f?: string;
  /** Your current budget in this league */
  b?: number;
  /** User/member count */
  un?: number;
  /** Your current player count in this league */
  lpc?: number;
  /** Budget scale (1=normal, 2=double, etc) */
  bs?: number;
  /** League version */
  vr?: number;
  /** Are you admin? */
  adm?: boolean;
  /** Your placement in this league */
  pl?: number;
  /** Your team value */
  tv?: number;
  /** Is featured? */
  idf?: boolean;
  /** Goals per match setting */
  gpm?: number;
  /** Ranking mode */
  rnkm?: number;
}

/** GET /v4/leagues/{id}/overview */
export interface KbLeagueOverview {
  // Field shape varies; we type loosely and pick the bits we use.
  i?: string;
  n?: string;
  ms?: KbManagerSummary[]; // managers
  // ... additional fields exist; access dynamically when needed
  [k: string]: unknown;
}

export interface KbManagerSummary {
  i: string; // user id
  n: string; // name
  uim?: string; // image
  pt?: number; // points
  tv?: number; // team value
  b?: number; // budget
  pl?: number; // placement
  [k: string]: unknown;
}

/** GET /v4/leagues/{id}/me/budget — current user's budget in this league */
export interface KbMeInLeague {
  /** Current budget (€) */
  b?: number;
  /** Budget scale */
  bs?: number;
  /** Max players per Bundesliga team */
  mppu?: number;
  /** Total user count in league */
  un?: number;
  /** Admin */
  adm?: boolean;
  /** Cover photo id */
  cpi?: string;
  /** League name */
  lnm?: string;
  /** Team players count per Bundesliga team */
  tpc?: { tid: string; npt: number; tim?: string }[];
  [k: string]: unknown;
}

/** GET /v4/leagues/{id}/ranking — league standings */
export interface KbRankingResponse {
  /** League name */
  ti?: string;
  /** Cover photo id */
  cpi?: string;
  /** League members (sorted by season placement) */
  us?: KbRankingUser[];
  /** Some legacy endpoints return `it` instead of `us` */
  it?: KbRankingUser[];
  /** Current matchday */
  day?: number;
  /** Number of matchdays in season */
  nd?: number;
  /** Last finished matchday */
  lfmd?: number;
  /** Season name like "25/26" */
  sn?: string;
  /** Current league player count */
  clpc?: number;
  [k: string]: unknown;
}

export interface KbRankingUser {
  /** User id */
  i: string;
  /** Display name */
  n: string;
  /** User image (relative path) */
  uim?: string;
  /** Admin */
  adm?: boolean;
  /** Season points (= total points across the season) */
  sp?: number;
  /** Matchday points (this matchday) */
  mdp?: number;
  /** Show home points / sometimes "shop points" — keep as opaque */
  shp?: number;
  /** Team value */
  tv?: number;
  /** Season placement (= rank in the league overall) */
  spl?: number;
  /** Matchday placement */
  mdpl?: number;
  /** Playing actively */
  pa?: boolean;
  /** Last 11 matchdays' points */
  lp?: (number | null)[];
  /** Lineup-position counts */
  lipc?: number;
  /** Player position counts */
  ppc?: number;
  /** Has lost lineup (didn't field 11) */
  hll?: boolean;
  /** Highest home single-matchday points */
  hhsp?: number;
  /** Is on app private list */
  iapl?: boolean;
  [k: string]: unknown;
}

/** GET /v4/leagues/{id}/squad — full squad list */
export interface KbSquadResponse {
  it: KbSquadPlayer[];
  ua?: string; // user avatar
}

export interface KbSquadPlayer {
  i: string; // player id
  n: string; // last name (or just name)
  fn?: string; // first name
  pos: number; // 1=GK, 2=DEF, 3=MID, 4=FWD
  mv: number; // current market value
  mvt?: number; // market value trend (-1..+2)
  mvgl?: number; // market value gain/loss (since purchase)
  sdmvt?: number; // same-day MV change (today)
  tfhmvt?: number; // 24h MV change
  p?: number; // current-season points (can be 0 in preseason)
  tp?: number; // all-time / total points (fallback)
  ap?: number; // avg points
  st?: number; // status (0=fit, 1=injured?, 2=red card?)
  stl?: unknown[]; // status list
  iotm?: boolean; // is on transfer market
  ofc?: number; // offer count
  tid: string; // bundesliga team id
  pim?: string; // player image path (relative to kickbase CDN)
  lo?: number; // lineup order
  lst?: number;
  mdst?: number;
  [k: string]: unknown;
}

/** GET /v4/leagues/{id}/market — current transfer market */
export interface KbMarketResponse {
  it: KbMarketEntry[];
  cs?: number;
  dt?: number;
}

export interface KbMarketEntry {
  i: string; // player id
  n: string;
  fn?: string;
  pos: number;
  mv: number;
  mvt?: number;
  prc: number; // listed price
  exs?: number; // expiry seconds
  uoc?: number; // user offer count
  tid: string;
  pim?: string;
  u?: { i: string; n: string }; // selling user
  [k: string]: unknown;
}

/** GET /v4/leagues/{id}/activitiesFeed — wer hat was gemacht
 * Kickbase returns the array under `af` (activity feed). Some legacy endpoints
 * use `it` — we accept both for safety.
 */
export interface KbActivitiesFeed {
  /** Primary: activity feed array */
  af?: KbActivity[];
  /** Legacy alias used by some responses */
  it?: KbActivity[];
  /** Comment count */
  coc?: number;
  /** Onboarding feature flag image */
  onbft?: string;
  cnt?: number;
}

export interface KbActivity {
  i: string;
  /** Activity type code. Known examples:
   * 22 = bonus payout (data.bn = amount, data.day = matchday)
   * 26 = generic league activity
   * 1/2/3 = buy/sell/transfer (heuristic)
   * 12 = achievement (heuristic)
   * 15 = lineup change (heuristic)
   */
  t: number;
  /** Comment count on this activity */
  coc?: number;
  /** Date as ISO string ("2026-02-23T18:25:22Z") or unix s/ms */
  dt?: number | string;
  date?: string;
  /** Free-form data payload */
  data?: Record<string, unknown>;
  d?: Record<string, unknown>;
  /** User who triggered the activity (optional — many activity types have no user) */
  u?: { i: string; n: string; uim?: string };
  [k: string]: unknown;
}

/** GET /v4/leagues/{id}/players/{pid}/marketvalue/{timeframe} */
export interface KbMarketValueHistory {
  it: KbMarketValuePoint[];
  trp?: number;
  prlo?: number;
  lmv?: number;
  hmv?: number;
  iso?: boolean;
  idp?: boolean;
  sprmv?: { url?: string; lf?: string; durl?: string };
}

export interface KbMarketValuePoint {
  /** Days since unix epoch (1970-01-01). dt * 86400000 = ms. */
  dt: number;
  mv: number;
}

/** GET /v4/leagues/{id}/players/{pid} — player details (rich) */
export interface KbPlayerDetails {
  i: string;
  /** First name */
  fn?: string;
  /** Last name */
  ln?: string;
  /** Single-name fallback (some endpoints) */
  n?: string;
  /** Shirt number */
  shn?: number;
  /** Bundesliga team id */
  tid: string;
  /** Team display name */
  tn?: string;
  /** Owner user id (current owner in league, if any) */
  oui?: string;
  /** Status (0 = fit, others = injured/red etc) */
  st?: number;
  /** Status list (text reasons) */
  stl?: unknown[];
  /** Position 1=GK 2=DEF 3=MID 4=FWD */
  pos: number;
  /** Total points season-to-date */
  tp?: number;
  /** Average points per matchday */
  ap?: number;
  /** Seconds played */
  sec?: number;
  /** Goals scored */
  g?: number;
  /** Assists */
  a?: number;
  /** Yellow cards */
  y?: number;
  /** Red cards */
  r?: number;
  /** Player history per matchday */
  ph?: { hp?: boolean; p?: number; md?: string }[];
  /** Current market value */
  mv: number;
  /** Custom value (?) */
  cv?: number;
  /** 24h MV trend */
  tfhmvt?: number;
  /** MV trend index */
  mvt?: number;
  /** Current matchday */
  day?: number;
  /** Recent matchday summary with opponents */
  mdsum?: KbMatchdaySummary[];
  /** Player image */
  pim?: string;
  [k: string]: unknown;
}

export interface KbMatchdaySummary {
  /** Home team id */
  t1: string;
  /** Away team id */
  t2: string;
  /** Home goals */
  t1g?: number;
  /** Away goals */
  t2g?: number;
  /** Matchday number */
  day: number;
  /** Match date ISO */
  md: string;
  /** Is current matchday */
  cur?: boolean;
  /** Player points scored this matchday */
  p?: number;
  [k: string]: unknown;
}

/** GET /v4/leagues/{id}/lineup/overview — current lineup + bench + opponents */
export interface KbLineupOverview {
  /** Matchday number this lineup is for */
  mdln?: string | number;
  /** Lineup submission deadline (ISO) */
  lis?: string;
  /** Budget */
  b?: number;
  /** Lineup players (lo=0 bench, lo=1..11 field) */
  lp?: KbLineupPlayer[];
  [k: string]: unknown;
}

export interface KbLineupPlayer {
  /** Player id */
  pi: string;
  /** Name */
  n: string;
  /** Status (0=fit, 128=ended career?) */
  st?: number;
  /** Lineup status (0=bench, 1=lineup, etc) */
  lst?: number;
  /** Matchday status */
  mdst?: number;
  /** Position 1-4 */
  pos: number;
  /** Lineup order — 0 = bench, 1..11 = field slot */
  lo?: number;
  /** Bundesliga team id */
  tid: string;
  /** Avg points */
  ap?: number;
  /** Total season points (alt) */
  tp?: number;
  /** Market value (sometimes 0 if player retired/inactive) */
  mv?: number;
  /** Next opponent home team */
  t1?: string;
  /** Next opponent away team */
  t2?: string;
  /** Next opponent home image */
  t1im?: string;
  /** Next opponent away image */
  t2im?: string;
  /** Player image */
  pim?: string;
  /** Is captain */
  ictp?: boolean;
  [k: string]: unknown;
}

/** GET /v4/leagues/{id}/players/{pid}/performance
 * Response shape: { it: [{ ti: "season title", n: "comp", ph: [matchday entries] }] }
 * The actual matchday-level points live in `it[*].ph[*]`.
 */
export interface KbPerformanceResponse {
  it?: KbPerformanceSeason[];
  [k: string]: unknown;
}

export interface KbPerformanceSeason {
  /** Season title e.g. "2025/2026" */
  ti?: string;
  /** Competition name e.g. "Bundesliga" */
  n?: string;
  /** Per-matchday entries */
  ph?: KbPerformancePoint[];
}

export interface KbPerformancePoint {
  /** Matchday number */
  day?: number;
  /** Points scored this matchday */
  p?: number;
  /** Minutes played display ("90'", "67'") */
  mp?: string;
  /** Match date ISO */
  md?: string;
  /** Home team id */
  t1?: string;
  /** Away team id */
  t2?: string;
  /** Home goals */
  t1g?: number;
  /** Away goals */
  t2g?: number;
  /** Player's team id */
  pt?: string;
  /** Status */
  st?: number;
  /** Matchday status */
  mdst?: number;
  /** Is current matchday */
  cur?: boolean;
  /** Average points (running) */
  ap?: number;
  /** Total points (running) */
  tp?: number;
  /** Total seconds played (running) */
  asp?: number;
  /** Home team image */
  t1im?: string;
  /** Away team image */
  t2im?: string;
  [k: string]: unknown;
}

/** GET /v4/competitions/{id}/players — Bundesliga-weite Spielerliste */
export interface KbCompetitionPlayersResponse {
  it: KbCompetitionPlayer[];
}

export interface KbCompetitionPlayer {
  /** Player id */
  pi: string;
  /** Name */
  n: string;
  /** First name (sometimes) */
  fn?: string;
  /** Bundesliga team id */
  tid: string;
  /** Match id (next match) */
  mi?: string;
  /** Total/season points */
  p?: number;
  /** Average points per matchday */
  ap?: number;
  /** Position 1-4 */
  pos: number;
  /** Is loaned out */
  il?: boolean;
  /** Status (5 = active default) */
  st?: number;
  /** Status list (text) */
  stl?: unknown[];
  /** Match minutes / availability rating */
  mt?: number;
  /** Goals */
  g?: number;
  /** Assists */
  a?: number;
  /** Yellow cards */
  y?: number;
  /** Red cards */
  r?: number;
  /** Penalties earned/scored */
  pes?: number;
  /** Clean sheets */
  cs?: number;
  /** Player image */
  pim?: string;
  /** Opposing team for next match */
  ot?: { i: string; tim?: string };
  /** Market value (when available) */
  mv?: number;
}

/** ─── Domain helpers ─────────────────────────────────────────── */

export const POSITION_LABELS: Record<number, "GK" | "DEF" | "MID" | "FWD"> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

/** Bundesliga teams by Kickbase tid → short name + colour */
export const BL_TEAMS: Record<string, { short: string; name: string; color: string }> = {
  "2": { short: "BVB", name: "Borussia Dortmund", color: "#FDE100" },
  "3": { short: "FCB", name: "Bayern München", color: "#DC052D" },
  "4": { short: "FCA", name: "FC Augsburg", color: "#BB0036" },
  "5": { short: "SCF", name: "SC Freiburg", color: "#B8232E" },
  "7": { short: "B04", name: "Bayer Leverkusen", color: "#E32221" },
  "8": { short: "S04", name: "Schalke 04", color: "#004D9D" },
  "9": { short: "VFB", name: "VfB Stuttgart", color: "#E32219" },
  "10": { short: "WOB", name: "VfL Wolfsburg", color: "#65B32E" },
  "11": { short: "M05", name: "Mainz 05", color: "#C3141B" },
  "13": { short: "BMG", name: "Borussia M'gladbach", color: "#000000" },
  "14": { short: "SGE", name: "Eintracht Frankfurt", color: "#E1000F" },
  "15": { short: "TSG", name: "TSG Hoffenheim", color: "#1961B5" },
  "18": { short: "BSC", name: "Hertha BSC", color: "#005CA9" },
  "20": { short: "SVW", name: "Werder Bremen", color: "#1D9053" },
  "22": { short: "KOE", name: "1. FC Köln", color: "#ED1C24" },
  "24": { short: "VFL", name: "VfL Bochum", color: "#005CA9" },
  "28": { short: "FCU", name: "1. FC Union Berlin", color: "#ED1C24" },
  "39": { short: "SVD", name: "SV Darmstadt 98", color: "#004F9F" },
  "40": { short: "FCH", name: "1. FC Heidenheim", color: "#E20613" },
  "43": { short: "RBL", name: "RB Leipzig", color: "#DC052D" },
  "50": { short: "FCSP", name: "FC St. Pauli", color: "#612916" },
  "51": { short: "HSV", name: "Hamburger SV", color: "#0A2D5E" },
};

export function teamMeta(tid: string | undefined) {
  if (!tid) return { short: "?", name: "Unknown", color: "#666" };
  return BL_TEAMS[tid] ?? { short: tid, name: `Team ${tid}`, color: "#666" };
}

export const KICKBASE_CDN = "https://kickbase.b-cdn.net";

export function playerImageUrl(pim: string | undefined): string | undefined {
  if (!pim) return undefined;
  if (pim.startsWith("http")) return pim;
  return `${KICKBASE_CDN}/${pim.replace(/^\//, "")}`;
}

/** Convert dt (days since 1970-01-01) → JS Date */
export function dtDayToDate(dt: number): Date {
  return new Date(dt * 86400 * 1000);
}
