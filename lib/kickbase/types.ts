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
  i: string; // league id
  n: string; // name
  cpi?: string; // cover photo id
  b?: number; // budget (own)
  un?: number; // user/member count
  lpc?: number; // league player count
  bs?: number; // budget scale
  vr?: number; // version
  adm?: boolean; // admin
  pl?: number; // player limit
  tv?: number; // total team value
  idf?: boolean;
  gpm?: number;
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

/** GET /v4/leagues/{id}/me — current user in this league */
export interface KbMeInLeague {
  b?: number; // budget
  tv?: number; // team value
  pt?: number; // points
  pl?: number; // placement
  un?: number; // user count
  [k: string]: unknown;
}

/** GET /v4/leagues/{id}/ranking — league standings */
export interface KbRankingResponse {
  ui?: string; // current user id
  us?: KbRankingUser[];
  it?: KbRankingUser[]; // some endpoints return `it`
  [k: string]: unknown;
}

export interface KbRankingUser {
  i: string; // user id
  n: string; // name
  uim?: string; // user image
  st?: number; // status
  pt?: number; // total points
  spt?: number; // season points
  mdpt?: number; // matchday points
  tv?: number; // team value
  b?: number; // budget
  pl?: number; // placement
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
  p?: number; // total points
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

/** GET /v4/leagues/{id}/activitiesFeed — wer hat was gemacht */
export interface KbActivitiesFeed {
  it: KbActivity[];
  cnt?: number;
}

export interface KbActivity {
  i: string;
  /** Activity type code. Common: 1=transfer, 12=achievement, etc */
  t: number;
  /** Date (unix seconds or ISO depending on endpoint) */
  dt?: number | string;
  date?: string;
  /** Free-form data payload */
  data?: Record<string, unknown>;
  d?: Record<string, unknown>;
  /** User who triggered the activity */
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

/** GET /v4/leagues/{id}/players/{pid} — player details */
export interface KbPlayerDetails {
  i: string;
  n: string;
  fn?: string;
  pos: number;
  mv: number;
  mvt?: number;
  st?: number;
  p?: number;
  ap?: number;
  tid: string;
  pim?: string;
  [k: string]: unknown;
}

/** GET /v4/leagues/{id}/players/{pid}/performance — points history */
export interface KbPerformanceResponse {
  it?: KbPerformancePoint[];
  [k: string]: unknown;
}

export interface KbPerformancePoint {
  /** matchday number */
  d?: number;
  /** date label */
  date?: string;
  /** points */
  p?: number;
  /** points (alt key) */
  pt?: number;
  [k: string]: unknown;
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
