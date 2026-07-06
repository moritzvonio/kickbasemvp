import Stripe from "stripe";
import { env } from "@/lib/env";

let _stripe: Stripe | null = null;

/** Lazy Stripe init. Returns null if STRIPE_SECRET_KEY is missing — callers handle. */
export function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  const key = env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // Omit apiVersion → SDK uses its built-in default (currently "2026-04-22.dahlia").
  _stripe = new Stripe(key);
  return _stripe;
}

export function stripeConfigured(): boolean {
  return !!env.STRIPE_SECRET_KEY;
}

/** Ein Produkt „Pro Halbserie", je Halbserie ein One-Time-Price zu 6,00 €. */
export const STRIPE_PRICES = {
  "hinrunde-2627": env.STRIPE_PRICE_HINRUNDE_2627,
  "rueckrunde-2627": env.STRIPE_PRICE_RUECKRUNDE_2627,
} as const;

export type Plan = keyof typeof STRIPE_PRICES;

export function planFromString(s: string | undefined | null): Plan | null {
  if (s === "hinrunde-2627" || s === "rueckrunde-2627") return s;
  return null;
}
