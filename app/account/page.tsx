import type { Metadata } from "next";
import Link from "next/link";
import { requireSessionOrRedirect } from "@/lib/auth";
import { getAccess, getEntitlement, type Plan } from "@/lib/entitlement";
import { LogoutButton } from "@/components/logout-button";
import { PushToggle } from "@/components/push-toggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Logo } from "@/components/ui/logo";
import { User, Crown, Bell, Sparkles, Settings, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

const PLAN_LABEL: Record<Plan, string> = {
  "hinrunde-2627": "Pro Hinrunde 26/27",
  "rueckrunde-2627": "Pro Rückrunde 26/27",
  season: "Pro Saison",
  monthly: "Pro Monatlich",
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function AccountPage() {
  const session = await requireSessionOrRedirect("/account");
  const access = await getAccess(session.userId);
  const ent = await getEntitlement();
  const isPro = access.pro;

  return (
    <div className="flex-1 flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 glass">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <Link href="/leagues" className="hover:opacity-90 transition">
            <Logo size={28} />
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-10 space-y-6">
        <div className="slide-up">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Settings className="size-5" />
            </span>
            Account
          </h1>
        </div>

        {/* Profile card with avatar */}
        <Card className="slide-up slide-up-1">
          <CardContent className="p-6 flex items-center gap-4">
            <UserAvatar name={session.name ?? "?"} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-lg truncate">{session.name ?? "–"}</div>
              <div className="text-sm text-muted-foreground truncate">{session.email ?? "–"}</div>
              <div className="text-xs text-muted-foreground mt-1 font-mono tabular">
                ID: {session.userId}
              </div>
            </div>
            {isPro ? (
              <Badge variant="success" className="gap-1 py-1 px-3 shrink-0">
                <Crown className="size-3" /> Pro
              </Badge>
            ) : access.trial ? (
              <Badge variant="muted" className="gap-1 py-1 px-3 shrink-0">
                <Sparkles className="size-3" /> Testphase
              </Badge>
            ) : null}
          </CardContent>
        </Card>

        {/* Pro card */}
        <Card className="slide-up slide-up-2 overflow-hidden relative">
          {isPro && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-700" />
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Zugang
            </CardTitle>
            <CardDescription>
              {isPro
                ? "Du hast Pro 🎉"
                : access.trial
                ? "Kostenlose Testphase läuft"
                : "Schalte die Pro-Flächen frei"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isPro && ent ? (
              <>
                <Row label="Plan" value={PLAN_LABEL[ent.plan] ?? "Pro"} />
                {access.proUntil && (
                  <Row label="Aktiv bis" value={fmtDate(access.proUntil)} />
                )}
              </>
            ) : access.trial && access.trialEnd ? (
              <>
                <Row label="Status" value="Testphase (alles frei)" />
                <Row label="Läuft bis" value={fmtDate(access.trialEnd)} />
                <p className="text-muted-foreground">
                  Danach bleiben Wettbewerb und Bid-Advisor mit Pro frei –
                  6 € pro Halbserie, einmalig.
                </p>
                <Button asChild>
                  <Link href="/upgrade">
                    Jetzt Pro sichern <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Du bist auf dem kostenlosen Tier. Pro entsperrt die Kontostände
                  und Max-Gebote aller Manager (Wettbewerb) und den Bid-Advisor.
                </p>
                <Button asChild>
                  <Link href="/upgrade">
                    Pro freischalten <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Push card */}
        <Card className="slide-up slide-up-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              Push-Notifications
            </CardTitle>
            <CardDescription>
              Marktwert-Drops, neue Transfers in deiner Liga, Watchlist-Alerts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PushToggle />
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center pt-4">
          Ligabase ist nicht offiziell mit Kickbase verbunden. Nutzung auf eigene Verantwortung.
        </p>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
