import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "STRIPE_NOT_CONFIGURED" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "NO_SIGNATURE" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    return NextResponse.json(
      { error: "INVALID_SIGNATURE", message: e instanceof Error ? e.message : "bad sig" },
      { status: 400 }
    );
  }

  // V1 placeholder – full event handling lands once we have a DB.
  // For now we just log the relevant ones; entitlement is set at /upgrade/success
  // by reading the checkout session synchronously.
  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "invoice.payment_succeeded":
    case "invoice.payment_failed":
      console.log("[stripe-webhook]", event.type, event.id);
      break;
    default:
      // ignore
      break;
  }

  return NextResponse.json({ received: true });
}
