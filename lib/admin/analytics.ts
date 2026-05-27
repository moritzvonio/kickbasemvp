/**
 * Leichtgewichtiges First-Party-Analytics für das Owner-Admin-Dashboard.
 *
 * Speichert in Upstash/Vercel KV (mit In-Memory-Fallback fürs lokale Dev):
 *  - pro User: erste/letzte Aktivität, Login-Anzahl, Seitenaufrufe
 *  - letzte Logins (gekappt) + letzte Seitenaufrufe (gekappt)
 *  - Top-Pfade (Aufruf-Zähler)
 *
 * DSGVO: Es werden nur Kickbase-User-ID, Anzeigename und Pfad gespeichert
 * (keine IPs, keine sensiblen Daten). Listen sind gekappt → Datensparsamkeit.
 * Pro-User-Tracking gehört in die Datenschutzerklärung (Hinweis an Betreiber).
 */
import { kv } from "@vercel/kv";

const KV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const DAY = 86_400_000;

export interface UserStat {
  userId: string;
  name?: string;
  firstSeen: number;
  lastSeen: number;
  logins: number;
  views: number;
}
export interface LoginEntry { userId: string; name?: string; ts: number }
export interface ViewEntry { userId: string; name?: string; path: string; ts: number }

const K = {
  user: (id: string) => `stats:user:${id}`,
  usersSeen: "stats:users:byseen",
  logins: "stats:logins:recent",
  events: "stats:events:recent",
  paths: "stats:paths",
};

// In-Memory-Fallback (lokales Dev ohne KV)
const mem = {
  users: new Map<string, UserStat>(),
  logins: [] as LoginEntry[],
  events: [] as ViewEntry[],
  paths: new Map<string, number>(),
};

async function upsertUser(userId: string, name: string | undefined, kind: "login" | "view") {
  const now = Date.now();
  if (KV) {
    const u =
      (await kv.get<UserStat>(K.user(userId))) ??
      ({ userId, name, firstSeen: now, lastSeen: now, logins: 0, views: 0 } as UserStat);
    u.name = name ?? u.name;
    u.lastSeen = now;
    if (kind === "login") u.logins += 1;
    else u.views += 1;
    await kv.set(K.user(userId), u);
    await kv.zadd(K.usersSeen, { score: now, member: userId });
  } else {
    const u =
      mem.users.get(userId) ??
      ({ userId, name, firstSeen: now, lastSeen: now, logins: 0, views: 0 } as UserStat);
    u.name = name ?? u.name;
    u.lastSeen = now;
    if (kind === "login") u.logins += 1;
    else u.views += 1;
    mem.users.set(userId, u);
  }
}

export async function recordLogin(userId: string, name?: string) {
  await upsertUser(userId, name, "login");
  const entry: LoginEntry = { userId, name, ts: Date.now() };
  if (KV) {
    await kv.lpush(K.logins, entry);
    await kv.ltrim(K.logins, 0, 99);
  } else {
    mem.logins.unshift(entry);
    mem.logins = mem.logins.slice(0, 100);
  }
}

export async function recordView(userId: string, name: string | undefined, path: string) {
  await upsertUser(userId, name, "view");
  const entry: ViewEntry = { userId, name, path, ts: Date.now() };
  if (KV) {
    await kv.lpush(K.events, entry);
    await kv.ltrim(K.events, 0, 199);
    await kv.zincrby(K.paths, 1, path);
  } else {
    mem.events.unshift(entry);
    mem.events = mem.events.slice(0, 200);
    mem.paths.set(path, (mem.paths.get(path) ?? 0) + 1);
  }
}

export interface AdminStats {
  totalUsers: number;
  activeUsers7d: number;
  totalLogins: number;
  recentLogins: LoginEntry[];
  recentEvents: ViewEntry[];
  topPaths: { path: string; count: number }[];
}

export async function getAdminStats(): Promise<AdminStats> {
  const now = Date.now();
  if (KV) {
    const [totalUsers, activeUsers7d, recentLogins, recentEvents, pathsRaw] =
      await Promise.all([
        kv.zcard(K.usersSeen),
        kv.zcount(K.usersSeen, now - 7 * DAY, "+inf"),
        kv.lrange<LoginEntry>(K.logins, 0, 24),
        kv.lrange<ViewEntry>(K.events, 0, 39),
        kv.zrange<(string | number)[]>(K.paths, 0, 14, { rev: true, withScores: true }),
      ]);
    const topPaths: { path: string; count: number }[] = [];
    for (let i = 0; i < (pathsRaw?.length ?? 0); i += 2) {
      topPaths.push({ path: String(pathsRaw[i]), count: Number(pathsRaw[i + 1]) });
    }
    const totalLogins = (recentLogins ?? []).length; // grobe Annäherung; exakt via User-Summen
    return {
      totalUsers: totalUsers ?? 0,
      activeUsers7d: activeUsers7d ?? 0,
      totalLogins,
      recentLogins: recentLogins ?? [],
      recentEvents: recentEvents ?? [],
      topPaths,
    };
  }
  const users = [...mem.users.values()];
  return {
    totalUsers: users.length,
    activeUsers7d: users.filter((u) => u.lastSeen > now - 7 * DAY).length,
    totalLogins: users.reduce((s, u) => s + u.logins, 0),
    recentLogins: mem.logins.slice(0, 25),
    recentEvents: mem.events.slice(0, 40),
    topPaths: [...mem.paths.entries()]
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
  };
}
