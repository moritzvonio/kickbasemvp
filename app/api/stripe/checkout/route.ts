import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getStripe, STRIPE_PRICES, planFromString } from "@/lib/stripe";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const Body = z.object({
  plan: z.enum(["monthly", "season"]),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        error: "STRIPE_NOT_CONFIGURED",
        message: "Stripe ist noch nicht eingerichtet. Bitte STRIPE_SECRET_KEY setzen.",
      },
      { status: 503 }
    );
  }

  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const plan = planFromString(body.plan);
  if (!plan) return NextResponse.json({ error: "INVALID_PLAN" }, { status: 400 });

  const priceId = STRIPE_PRICES[plan];
  if (!priceId) {
    return NextResponse.json(
      {
        error: "PRICE_NOT_CONFIGURED",
        message: `Stripe price id fehlt: STRIPE_PRICE_PRO_${plan.toUpperCase()}`,
      },
      { status: 503 }
    );
  }

  const isSubscription = plan === "monthly";

  const checkout = await stripe.checkout.sessions.create({
    mode: isSubscription ? "subscription" : "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.NEXT_PUBLIC_APP_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/upgrade?canceled=1`,
    client_reference_id: session.userId,
    customer_email: session.email ?? undefined,
    metadata: {
      kb_user_id: session.userId,
      plan,
    },
    locale: "de",
    allow_promotion_codes: true,
  });

  if (!checkout.url) {
    return NextResponse.json({ error: "NO_CHECKOUT_URL" }, { status: 500 });
  }
  return NextResponse.json({ url: checkout.url });
}
