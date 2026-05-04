import type { Metadata } from "next";
import Link from "next/link";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/logout-button";
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
} from "lucide-react";

export const metadata: Metadata = { title: "Deine Ligen" };
export const dynamic = "force-dynamic";

export default async function LeaguesPage() {
  const session = await requireSessionOrRedirect("/leagues");
  const data = await withKbAuth("/leagues", () => kb.leagues(session.token));
  const leagues = data.it ?? [];

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-40">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm shadow-sm shadow-emerald-500/20">
              B
            </span>
            BetterBase
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {session.name && (
              <Link
                href="/account"
                className="text-muted-foreground hidden sm:inline hover:text-foreground transition"
              >
                {session.name}
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Trophy className="size-5" />
            </span>
            Deine Ligen
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Wähle eine Liga, um dein Dashboard zu öffnen.
            {leagues.length > 0 && ` ${leagues.length} ${leagues.length === 1 ? "Liga" : "Ligen"} aktiv.`}
          </p>
        </div>

        {leagues.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center">
              <div className="size-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Sparkles className="size-6" />
              </div>
              <h3 className="font-semibold mb-1">Noch keine Ligen</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                Wir haben keine Ligen für dich gefunden. Leg zuerst in der Kickbase-App eine
                Liga an oder tritt einer bei.
              </p>
              <a
                href="https://www.kickbase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Zur Kickbase-App <ChevronRight className="size-4" />
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {leagues.map((l) => {
              const place = l.pl;
              return (
                <Link key={l.i} href={`/league/${l.i}`} className="group block">
                  <Card className="card-hover h-full overflow-hidden relative">
                    {place === 1 && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-200" />
                    )}
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-base truncate flex items-center gap-2">
                            {l.n}
                            {l.adm && (
                              <span className="inline-flex items-center" title="Du bist Admin">
                                <ShieldCheck className="size-3.5 text-primary" />
                              </span>
                            )}
                          </div>
                          {place !== undefined && (
                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              {place === 1 ? (
                                <>
                                  <Crown className="size-3 text-amber-500" />
                                  <span className="text-amber-600 font-medium">Tabellenführer</span>
                                </>
                              ) : (
                                <span>Platz #{place} von {l.un ?? "?"}</span>
                              )}
                            </div>
                          )}
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
                        {l.un !== undefined && (
                          <Stat icon={<Users className="size-3.5" />} label="Manager">
                            {l.un}
                          </Stat>
                        )}
                        {l.lpc !== undefined && (
                          <Stat icon={<Trophy className="size-3.5" />} label="Spieler">
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

        <p className="text-xs text-muted-foreground text-center mt-10">
          BetterBase ist nicht offiziell mit Kickbase verbunden.
        </p>
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
      <div className="font-mono font-semibold text-sm">{children}</div>
    </div>
  );
}
