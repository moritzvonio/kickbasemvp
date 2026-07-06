import type { Metadata } from "next";
import Link from "next/link";
import { requireSessionOrRedirect } from "@/lib/auth";
import { getAccess } from "@/lib/entitlement";
import { stripeConfigured } from "@/lib/stripe";
import { currentHalfSeason } from "@/lib/season";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/app-header";
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
  const access = await getAccess(session.userId);
  const stripeReady = stripeConfigured();

  const { key: plan, end } = currentHalfSeason();
  const halfLabel = plan === "rueckrunde-2627" ? "Rückrunde 26/27" : "Hinrunde 26/27";
  const endLabel = end.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const proUntilLabel = access.proUntil?.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader />

      <main className="flex-1 mx-auto max-w-2xl w-full px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            {access.pro ? "Du hast Pro 🎉" : "Pro freischalten"}
          </h1>
          <p className="text-muted-foreground">
            {access.pro
              ? "Alle Pro-Flächen sind freigeschaltet. Danke für deinen Support."
              : "Sieh die Kontostände und Max-Gebote aller Mitspieler – berechnet aus den öffentlichen Liga-Daten."}
          </p>
        </div>

        {sp.canceled && !access.pro && (
          <div className="mb-6 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
            Kauf abgebrochen – es wurde nichts abgebucht.
          </div>
        )}

        {access.trial && !access.pro && access.trialEnd && (
          <div className="mb-6 rounded-md border border-primary/30 bg-primary/[0.06] px-4 py-3 text-sm text-foreground">
            Du bist gerade in der kostenlosen Testphase (noch bis{" "}
            {access.trialEnd.toLocaleDateString("de-DE")}). Danach schaltest du hier
            wieder frei.
          </div>
        )}

        <Card className="border-primary/50 shadow-[0_0_0_1px_rgba(16,185,129,0.35)] relative">
          {!access.pro && (
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
              Einmalzahlung
            </Badge>
          )}
          <CardHeader>
            <CardTitle>Pro {halfLabel}</CardTitle>
            <CardDescription className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-bold text-foreground">6,00 €</span>
              <span className="text-xs">einmalig · gilt bis {endLabel}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm space-y-1.5">
              <Feature>Wettbewerb: Kontostände + Max-Gebote aller Manager</Feature>
              <Feature>Bid-Advisor: Bietverhalten deiner Konkurrenten</Feature>
              <Feature>Netto-Teamwert-Verlauf der ganzen Liga</Feature>
            </ul>

            {access.pro ? (
              <div className="rounded-md border border-primary/30 bg-primary/[0.06] px-4 py-3 text-sm text-center">
                Du hast Pro{proUntilLabel ? <> bis <span className="font-medium">{proUntilLabel}</span></> : null}.
              </div>
            ) : stripeReady ? (
              <CheckoutButton plan={plan} label={`Pro ${halfLabel} für 6 € freischalten`} />
            ) : (
              <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground text-center">
                Der Kauf ist gerade nicht verfügbar. Schau später vorbei.
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Kein Abo, keine automatische Verlängerung. Alles kostenlos bis
              einschließlich Spieltag 2.
            </p>
          </CardContent>
        </Card>

        <p className="mt-10 text-xs text-muted-foreground text-center">
          Ligabase ist nicht offiziell mit Kickbase verbunden.{" "}
          <Link href="/leagues" className="underline hover:text-foreground">
            Zurück zu deinen Ligen
          </Link>
        </p>
      </main>
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
