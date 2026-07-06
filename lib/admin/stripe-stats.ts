/**
 * Verkaufs-Statistik fürs Admin-Dashboard – Grundlage der Creator-Rev-Share-
 * Abrechnung (30 % ab 25 Käufen pro Code). Aggregiert abgeschlossene, bezahlte
 * Stripe-Checkout-Sessions nach Promo-Code. 5-Minuten-KV-Cache, damit die
 * Admin-Seite Stripe nicht bei jedem Aufruf hämmert.
 */

import { getStripe } from "@/lib/stripe";
import { kv } from "@vercel/kv";

export interface CodeStat {
  count: number;
  revenue: number; // Euro
}

export interface SalesStats {
  totalSales: number;
  totalRevenue: number; // Euro
  byCode: Record<string, CodeStat>;
}

const KV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const CACHE_KEY = "admin:salesstats";
const CACHE_TTL_S = 300;
const NO_CODE = "ohne Code";
const MAX_PAGES = 10; // 10 × 100 = harte 1000er-Grenze

/** Aggregierte Verkäufe je Code, oder null wenn Stripe nicht konfiguriert ist. */
export async function getSalesStats(): Promise<SalesStats | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  if (KV) {
    const cached = await kv.get<SalesStats>(CACHE_KEY).catch(() => null);
    if (cached) return cached;
  }

  const stats: SalesStats = { totalSales: 0, totalRevenue: 0, byCode: {} };
  let startingAfter: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await stripe.checkout.sessions.list({
      limit: 100,
      status: "complete",
      expand: ["data.discounts.promotion_code"],
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const s of res.data) {
      if (s.payment_status !== "paid") continue;
      const revenue = (s.amount_total ?? 0) / 100;
      stats.totalSales += 1;
      stats.totalRevenue += revenue;

      let code = NO_CODE;
      const promo = s.discounts?.[0]?.promotion_code;
      if (promo && typeof promo === "object" && "code" in promo && promo.code) {
        code = promo.code;
      }
      const bucket = stats.byCode[code] ?? { count: 0, revenue: 0 };
      bucket.count += 1;
      bucket.revenue += revenue;
      stats.byCode[code] = bucket;
    }

    if (!res.has_more) break;
    startingAfter = res.data[res.data.length - 1]?.id;
    if (!startingAfter) break;
  }

  if (KV) await kv.set(CACHE_KEY, stats, { ex: CACHE_TTL_S }).catch(() => {});
  return stats;
}
