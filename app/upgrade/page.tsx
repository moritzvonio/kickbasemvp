import type { Metadata } from "next";
import Link from "next/link";
import { requireSessionOrRedirect } from "@/lib/auth";
import { hasPro } from "@/lib/entitlement";
import { stripeConfigured } from "@/lib/stripe";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckoutButton } from "./CheckoutButton";

export const metadata: Metadata = { title: "Pro freischalten" };
export const dynamic = "force-dynamic";

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const sp = await searchParams;
  const session = await requireSessionOrRedirect("/upgrade");
  const isPro = await hasPro(session.userId);
  const stripeReady = stripeConfigured();

  return (
    <div className="flex-1 mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          {isPro ? "Du hast Pro 🎉" : "Pro freischalten"}
        </h1>
        <p className="text-muted-foreground">
          {isPro
            ? "Alle Features verfügbar. Vielen Dank für deinen Support."
            : "Liga-Sozial-Layer, AI-Coach, Push-Alerts, unbegrenzte Marktwert-Historie."}
        </p>
      </div>

      {sp.canceled && (
        <div className="mb-6 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Checkout abgebrochen — kein Geld abgebucht.
        </div>
      )}

      {!stripeReady && (
        <div className="mb-6 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          ⚠️ Stripe ist noch nicht aktiviert (Beta). Setze <code className="font-mono text-xs">STRIPE_SECRET_KEY</code>{" "}
          und <code className="font-mono text-xs">STRIPE_PRICE_PRO_MONTHLY</code> /{" "}
          <code className="font-mono text-xs">STRIPE_PRICE_PRO_SEASON</code> in den Env-Vars.
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pro Monatlich</CardTitle>
            <CardDescription className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-bold text-foreground">4,99 €</span>
              <span className="text-xs">pro Monat</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm space-y-1.5 mb-4">
              <Feature>Alle Pro-Features</Feature>
              <Feature>Jederzeit kündbar</Feature>
              <Feature>Push & Email Alerts</Feature>
            </ul>
            <CheckoutButton plan="monthly" disabled={isPro || !stripeReady} />
          </CardContent>
        </Card>

        <Card className="border-primary/60 shadow-[0_0_0_1px_rgba(210,5,21,0.4)] relative">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Spar 60 %</Badge>
          <CardHeader>
            <CardTitle>Pro Saison</CardTitle>
            <CardDescription className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-bold text-foreground">19,99 €</span>
              <span className="text-xs">für 9 Monate (Aug–Mai)</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm space-y-1.5 mb-4">
              <Feature>Alle Pro-Features</Feature>
              <Feature>Effektiv 2,22 € / Monat</Feature>
              <Feature>Saison-PDF-Report (V2)</Feature>
              <Feature>Frühzugang zu Beta-Features</Feature>
            </ul>
            <CheckoutButton plan="season" disabled={isPro || !stripeReady} variant="default" />
          </CardContent>
        </Card>
      </div>

      <p className="mt-10 text-xs text-muted-foreground text-center">
        Kein Abo? Kein Problem. Free reicht für die Basics.{" "}
        <Link href="/leagues" className="underline hover:text-foreground">
          Zurück zu deinen Ligen
        </Link>
      </p>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-primary">✓</span>
      <span>{children}</span>
    </li>
  );
}
