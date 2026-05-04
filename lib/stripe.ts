import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazy Stripe init. Returns null if STRIPE_SECRET_KEY is missing — callers handle. */
export function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // Omit apiVersion → SDK uses its built-in default (currently "2026-04-22.dahlia").
  _stripe = new Stripe(key);
  return _stripe;
}

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
  season: process.env.STRIPE_PRICE_PRO_SEASON,
} as const;

export type Plan = keyof typeof STRIPE_PRICES;

export function planFromString(s: string | undefined | null): Plan | null {
  if (s === "monthly" || s === "season") return s;
  return null;
}
