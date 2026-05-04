/**
 * Watchlist persistence — cookie-based MVP.
 *
 * Stores a comma-separated list of player IDs in a non-httpOnly cookie so the
 * client can read it as well. Limited to ~50 IDs (cookie size budget). When we
 * wire up Supabase or another DB, this module is the only thing that changes.
 */

import { cookies } from "next/headers";

const COOKIE = "bb_watch";
const MAX = 50;
const MAX_AGE = 60 * 60 * 24 * 365;

export async function getWatched(): Promise<string[]> {
  const jar = await cookies();
  const c = jar.get(COOKIE)?.value;
  if (!c) return [];
  return c
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX);
}

export async function isWatched(playerId: string): Promise<boolean> {
  const list = await getWatched();
  return list.includes(playerId);
}

export async function setWatched(list: string[]) {
  const jar = await cookies();
  const dedup = Array.from(new Set(list)).slice(0, MAX);
  jar.set(COOKIE, dedup.join(","), {
    httpOnly: false, // client can read via document.cookie if needed
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function watchPlayer(playerId: string) {
  const list = await getWatched();
  if (list.includes(playerId)) return list;
  const next = [playerId, ...list].slice(0, MAX);
  await setWatched(next);
  return next;
}

export async function unwatchPlayer(playerId: string) {
  const list = await getWatched();
  const next = list.filter((id) => id !== playerId);
  await setWatched(next);
  return next;
}
