import type { Metadata } from "next";
import Link from "next/link";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/logout-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Logo } from "@/components/ui/logo";
import { formatEUR } from "@/lib/utils";
import {
  ChevronRight,
  Users,
  Wallet,
  TrendingUp,
  Trophy,
  Sparkles,
  Crown,
  ShieldCheck,
  Layers,
} from "lucide-react";

export const metadata: Metadata = { title: "Deine Ligen" };
export const dynamic = "force-dynamic";

export default async function LeaguesPage() {
  const session = await requireSessionOrRedirect("/leagues");
  const data = await withKbAuth("/leagues", () => kb.leagues(session.token));
  const leagues = data.it ?? [];

  // Echte Manager-Zahl je Liga: `un` aus /leagues/selection ist NICHT die
  // Mitgliederzahl (liefert z.B. 773/1287). Korrekt ist `mgc` aus dem Overview.
  const memberCounts = await Promise.all(
    leagues.map((l) =>
      kb
        .leagueOverview(session.token, l.i, false)
        .then((ov) => (ov as { mgc?: number }).mgc)
        .catch(() => undefined)
    )
  );

  return (
    <div className="flex-1 flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 glass">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo size={28} />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {session.name && (
              <Link
                href="/account"
                className="text-muted-foreground hidden sm:inline hover:text-foreground transition px-2 py-1 rounded hover:bg-accent"
              >
                {session.name}
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-10">
        <div className="mb-8 slide-up">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Trophy className="size-5" />
            </span>
            Servus{session.name ? `, ${session.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-2.5">
            {leagues.length === 0
              ? "Lass uns deine Ligen verbinden."
              : `${leagues.length} ${leagues.length === 1 ? "Liga" : "Ligen"} aktiv. Wähle eine, um dein Dashboard zu öffnen.`}
          </p>
        </div>

        {leagues.length === 0 ? (
          <Card className="slide-up slide-up-1">
            <EmptyState
              icon={<Sparkles className="size-6" />}
              title="Noch keine Ligen"
              description="Wir haben keine Ligen für dich gefunden. Leg zuerst in der Kickbase-App eine Liga an oder tritt einer bei."
              cta={
                <a
                  href="https://www.kickbase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Zur Kickbase-App <ChevronRight className="size-4" />
                </a>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {leagues.map((l, i) => {
              const place = l.pl;
              const memberCount = memberCounts[i];
              const animClass = `slide-up slide-up-${Math.min(i + 1, 4)}`;
              return (
                <Link key={l.i} href={`/league/${l.i}`} className={`group block ${animClass}`}>
                  <Card className="card-hover h-full overflow-hidden relative">
                    {place === 1 && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />
                    )}
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-base truncate flex items-center gap-2">
                            {l.n}
                            {l.adm && (
                              <span title="Du bist Admin">
                                <ShieldCheck className="size-3.5 text-primary" />
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            {place === 1 ? (
                              <>
                                <Crown className="size-3 text-amber-500" />
                                <span className="text-amber-600 font-medium">Tabellenführer</span>
                              </>
                            ) : place !== undefined ? (
                              <span>
                                Platz <span className="font-semibold text-foreground">#{place}</span>
                                {memberCount !== undefined && ` von ${memberCount}`}
                              </span>
                            ) : (
                              <span>Liga-Übersicht</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t border-border/50">
                        {l.tv !== undefined && (
                          <Stat icon={<TrendingUp className="size-3.5" />} label="Teamwert">
                            {formatEUR(l.tv, { compact: true })}
                          </Stat>
                        )}
                        {l.b !== undefined && (
                          <Stat icon={<Wallet className="size-3.5" />} label="Budget">
                            {formatEUR(l.b, { compact: true })}
                          </Stat>
                        )}
                        {memberCount !== undefined && (
                          <Stat icon={<Users className="size-3.5" />} label="Manager">
                            {memberCount}
                          </Stat>
                        )}
                        {l.lpc !== undefined && (
                          <Stat icon={<Layers className="size-3.5" />} label="Startelf">
                            {l.lpc}
                          </Stat>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <Badge variant="muted" className="text-[10px] gap-1.5 py-1 px-2">
            <span className="size-1.5 rounded-full bg-emerald-500 pulse-dot" />
            Live mit Kickbase verbunden
          </Badge>
          <p className="text-xs text-muted-foreground mt-3">
            Ligabase ist nicht offiziell mit Kickbase verbunden.
          </p>
        </div>
      </main>
    </div>
  );
}

function Stat({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
        {icon}
        {label}
      </div>
      <div className="font-mono font-semibold text-sm tabular">{children}</div>
    </div>
  );
}
