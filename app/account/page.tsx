import type { Metadata } from "next";
import Link from "next/link";
import { requireSessionOrRedirect } from "@/lib/auth";
import { hasPro, getEntitlement } from "@/lib/entitlement";
import { LogoutButton } from "@/components/logout-button";
import { PushToggle } from "@/components/push-toggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireSessionOrRedirect("/account");
  const isPro = await hasPro(session.userId);
  const ent = await getEntitlement();

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border/50">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <Link href="/leagues" className="flex items-center gap-2 font-bold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">
              B
            </span>
            BetterBase
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Account</h1>

        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>Vom Kickbase-Token</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Name" value={session.name ?? "—"} />
            <Row label="E-Mail" value={session.email ?? "—"} />
            <Row label="Kickbase-User-ID" value={session.userId} mono />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Abo
              {isPro && <Badge variant="success">Pro aktiv</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isPro && ent ? (
              <>
                <Row
                  label="Plan"
                  value={ent.plan === "season" ? "Pro Saison" : "Pro Monatlich"}
                />
                <Row
                  label="Aktiv bis"
                  value={new Date(ent.exp * 1000).toLocaleDateString("de-DE")}
                />
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Du bist auf dem kostenlosen Tier. Pro entsperrt Liga-Sozial-Layer,
                  AI-Coach und Push-Alerts.
                </p>
                <Button asChild size="sm">
                  <Link href="/upgrade">Pro freischalten</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Push-Notifications</CardTitle>
            <CardDescription>
              Marktwert-Drops, neue Transfers in deiner Liga, Watchlist-Alerts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PushToggle />
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center pt-4">
          BetterBase ist nicht offiziell mit Kickbase verbunden. Nutzung auf eigene Verantwortung.
        </p>
      </main>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
    </div>
  );
}
