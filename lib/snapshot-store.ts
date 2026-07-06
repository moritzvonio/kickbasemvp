/**
 * Öffentliche Liga-Snapshots (Conversion-Links `ligabase.de/s/{token}`).
 *
 * Speichert eine read-only Momentaufnahme der Vergleichstabelle für 7 Tage.
 * Bewusst NUR Anzeige-Felder (Name, Punkte, Werte) – KEIN Kickbase-Token,
 * KEINE User-IDs. In Prod via Vercel KV; lokal In-Memory über globalThis
 * (damit Route-Handler und öffentliche Seite denselben Store sehen).
 */

import { kv } from "@vercel/kv";

export interface SnapshotRow {
  name: string;
  seasonPoints?: number;
  matchdayWins: number;
  teamValue: number;
  cashEstimate: number;
  maxBidSingleSell: number;
  netTeamValue: number;
}

export interface Snapshot {
  leagueName: string | null;
  createdAt: string; // ISO-Datum
  rows: SnapshotRow[];
}

const KV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const TTL_S = 7 * 24 * 3600;

// globalThis-Singleton: teilt den In-Memory-Store über Modul-Instanzen hinweg
// (Route-Handler ↔ RSC im Dev sonst getrennt).
const g = globalThis as unknown as {
  __bbSnap?: Map<string, { data: Snapshot; exp: number }>;
};
const mem = g.__bbSnap ?? (g.__bbSnap = new Map());

/** Ob teilbare Snapshots verfügbar sind (persistentes KV vorhanden). */
export function snapshotConfigured(): boolean {
  return KV;
}

export async function saveSnapshot(token: string, data: Snapshot): Promise<void> {
  if (KV) {
    await kv.set(`snapshot:${token}`, data, { ex: TTL_S });
  } else {
    mem.set(token, { data, exp: Date.now() + TTL_S * 1000 });
  }
}

export async function getSnapshot(token: string): Promise<Snapshot | null> {
  if (KV) {
    return (await kv.get<Snapshot>(`snapshot:${token}`)) ?? null;
  }
  const e = mem.get(token);
  if (!e) return null;
  if (e.exp < Date.now()) {
    mem.delete(token);
    return null;
  }
  return e.data;
}
