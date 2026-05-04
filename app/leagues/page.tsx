import type { Metadata } from "next";
import Link from "next/link";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/logout-button";
import { formatEUR } from "@/lib/utils";
import { ChevronRight, Users, Wallet, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Deine Ligen",
};

export const dynamic = "force-dynamic";

export default async function LeaguesPage() {
  const session = await requireSessionOrRedirect("/leagues");
  const data = await withKbAuth("/leagues", () => kb.leagues(session.token));
  const leagues = data.it ?? [];

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border/50">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">
              B
            </span>
            BetterBase
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {session.name && (
              <Link href="/account" className="text-muted-foreground hidden sm:inline hover:text-foreground transition">
                {session.name}
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Deine Ligen</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Wähle eine Liga, um dein Dashboard zu öffnen.
        </p>

        {leagues.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground mb-4">
                Wir haben keine Ligen für dich gefunden. Lege zuerst in der Kickbase-App eine Liga an
                oder tritt einer bei.
              </p>
              <a
                href="https://www.kickbase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline text-sm"
              >
                Zur Kickbase-App
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {leagues.map((l) => (
              <Link key={l.i} href={`/league/${l.i}`} className="group">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
                    <CardTitle className="text-base">{l.n}</CardTitle>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="size-3.5" />
                      <span>{l.un ?? "?"} Mitglieder</span>
                      {l.adm && (
                        <Badge variant="muted" className="ml-auto">
                          Admin
                        </Badge>
                      )}
                    </div>
                    {l.b !== undefined && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Wallet className="size-3.5" />
                        <span>{formatEUR(l.b, { compact: true })} Budget</span>
                      </div>
                    )}
                    {l.tv !== undefined && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="size-3.5" />
                        <span>{formatEUR(l.tv, { compact: true })} Teamwert</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
