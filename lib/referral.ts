/**
 * Referral light: geworbene Mitspieler bringen dem Werber Pro-Tage.
 *
 * Ein NEUER User (Erstlogin) mit `?ref={werberId}` schreibt dem Werber +14 Tage
 * Pro gut, gedeckelt auf 3 Gutschriften. Persistenz via Vercel KV (Prod) bzw.
 * globalThis-In-Memory (lokal, teilt Login-Route ↔ RSC). Keine next/headers-
 * Abhängigkeit → rein unit-testbar.
 */

import { kv } from "@vercel/kv";

const DAY = 86_400_000;
const KV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
export const REFERRAL_CAP = 3;
export const REFERRAL_BONUS_DAYS = 14;

const g = globalThis as unknown as {
  __bbRef?: { counts: Map<string, number>; bonus: Map<string, string> };
};
const store = g.__bbRef ?? (g.__bbRef = { counts: new Map(), bonus: new Map() });

/**
 * Neues Bonus-Enddatum: max(now, bestehendes ZUKÜNFTIGES Ende) + 14 Tage.
 * Ein bereits abgelaufener Bonus zählt ab jetzt neu.
 */
export function extendReferralBonus(existingIso: string | null, now: Date = new Date()): string {
  const existingMs = existingIso ? Date.parse(existingIso) : NaN;
  const baseMs =
    Number.isFinite(existingMs) && existingMs > now.getTime() ? existingMs : now.getTime();
  return new Date(baseMs + REFERRAL_BONUS_DAYS * DAY).toISOString();
}

async function getReferralCount(id: string): Promise<number> {
  try {
    if (KV) return (await kv.get<number>(`referral:${id}`)) ?? 0;
    return store.counts.get(id) ?? 0;
  } catch {
    return 0;
  }
}

async function getReferralBonusIso(id: string): Promise<string | null> {
  try {
    if (KV) return (await kv.get<string>(`probonus:${id}`)) ?? null;
    return store.bonus.get(id) ?? null;
  } catch {
    return null;
  }
}

/** Schreibt einem Werber eine Gutschrift zu (Cap 3). Über dem Cap: No-op. */
export async function creditReferral(referrerId: string): Promise<void> {
  try {
    if (KV) {
      // Atomar zählen: kv.incr liefert den NEUEN Wert. So kann der Cap auch
      // bei parallelen Erstlogins (mehrere Lambda-Instanzen) nicht überschritten
      // werden – ein Read-then-Write-Check wäre hier eine TOCTOU-Lücke.
      const newCount = await kv.incr(`referral:${referrerId}`);
      if (newCount > REFERRAL_CAP) return; // über Cap: Zähler steht, aber kein Bonus
      const nextIso = extendReferralBonus(await getReferralBonusIso(referrerId), new Date());
      await kv.set(`probonus:${referrerId}`, nextIso);
    } else {
      const count = store.counts.get(referrerId) ?? 0;
      if (count >= REFERRAL_CAP) return;
      const nextIso = extendReferralBonus(store.bonus.get(referrerId) ?? null, new Date());
      store.counts.set(referrerId, count + 1);
      store.bonus.set(referrerId, nextIso);
    }
  } catch {
    // still – Referral darf den Login nie stören
  }
}

/** Für die /account-Anzeige: Anzahl Gutschriften + Bonus-Ende. */
export async function getReferral(
  userId: string
): Promise<{ count: number; bonusUntil?: Date }> {
  const count = await getReferralCount(userId);
  const iso = await getReferralBonusIso(userId);
  return { count, bonusUntil: iso ? new Date(iso) : undefined };
}

/** Bonus-Ende (falls vorhanden) – für getAccess. */
export async function getReferralBonusUntil(userId: string): Promise<Date | null> {
  const iso = await getReferralBonusIso(userId);
  return iso ? new Date(iso) : null;
}
