import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/ui/logo";
import { TeamCrest } from "@/components/ui/team-tag";
import { Sparkline } from "@/components/ui/sparkline";
import { FormDots } from "@/components/ui/form-dots";
import { Card } from "@/components/ui/card";
import { Lock, Sparkles, Trophy, ShieldCheck, ArrowLeft, Bell, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Login",
  description: "Mit deinem Kickbase-Account einloggen.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  if (session) redirect(sp.next ?? "/leagues");

  return (
    <div className="flex-1 grid lg:grid-cols-2 min-h-screen">
      {/* Left: form */}
      <div className="flex flex-col">
        <header className="px-6 sm:px-10 py-5 flex items-center justify-between">
          <Link href="/">
            <Logo size={30} />
          </Link>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="size-3.5" /> Zurück
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-10">
          <div className="w-full max-w-sm slide-up">
            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5 ring-1 ring-primary/20">
              <Trophy className="size-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Willkommen zurück</h1>
            <p className="text-sm text-muted-foreground mb-7">
              Login mit deinem Kickbase-Account. Du brauchst kein neues Konto.
            </p>
            <LoginForm next={sp.next} />

            <div className="mt-7 space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Lock className="size-3.5 mt-0.5 text-primary shrink-0" />
                <span>
                  Dein Passwort wird <span className="text-foreground font-medium">nicht gespeichert</span>.
                  Wir tauschen es einmalig gegen einen Token von Kickbase und werfen es weg.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="size-3.5 mt-0.5 text-primary shrink-0" />
                <span>Token landet verschlüsselt in einem httpOnly-Cookie.</span>
              </div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Noch kein Kickbase-Konto?{" "}
              <a
                href="https://www.kickbase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline"
              >
                kickbase.com →
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right: visual showcase (hidden on mobile) */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-100/50">
        <div aria-hidden className="absolute inset-0 -z-0">
          <div className="absolute top-[10%] left-[10%] size-[280px] bg-emerald-300/40 rounded-full blur-3xl blob" />
          <div className="absolute bottom-[20%] right-[10%] size-[320px] bg-emerald-400/30 rounded-full blur-3xl blob blob-delay-1" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-10 gap-6">
          <Card className="w-full max-w-sm p-5 card-glow slide-up slide-up-1">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-sm flex items-center gap-1.5">
                <Trophy className="size-4 text-primary" /> Liga-Tabelle
              </div>
              <span className="text-[10px] text-muted-foreground">Spieltag 17</span>
            </div>
            {[
              { rank: "🥇", name: "Tobi", pts: "12.847" },
              { rank: "🥈", name: "Du", pts: "12.419", you: true },
              { rank: "🥉", name: "Lukas", pts: "11.998" },
            ].map((r) => (
              <div
                key={r.name}
                className={
                  "flex items-center gap-2 px-2 py-1.5 rounded text-sm " +
                  (r.you ? "bg-primary/10" : "")
                }
              >
                <span className="w-6 text-center">{r.rank}</span>
                <span className={"flex-1 " + (r.you ? "font-semibold" : "")}>{r.name}</span>
                <span className="font-mono tabular text-xs">{r.pts}</span>
              </div>
            ))}
          </Card>

          <Card className="w-full max-w-sm p-4 slide-up slide-up-2">
            <div className="flex items-start gap-3">
              <TeamCrest tid="3" size={44} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">Florian Wirtz</div>
                <div className="text-[11px] text-muted-foreground">FCB · MID</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-sm tabular">18,4 Mio €</div>
                <div className="text-[11px] text-emerald-600 font-mono">+312k</div>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <FormDots points={[122, 88, 154, 0, 96]} />
              <Sparkline values={[8.2, 8.5, 8.4, 8.7, 9.1, 9.3, 9.6, 10.1]} width={100} height={28} color="#10b981" />
            </div>
          </Card>

          <Card className="w-full max-w-sm p-4 slide-up slide-up-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="size-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <Bell className="size-3.5" />
              </span>
              <span className="font-semibold text-sm">Push-Alert</span>
              <span className="text-[10px] text-muted-foreground ml-auto">jetzt</span>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Anna</span> verkaufte{" "}
              <span className="font-medium text-foreground">Kane</span> für{" "}
              <span className="text-emerald-600 font-mono">21,1 Mio</span>
            </p>
          </Card>

          <div className="text-center mt-6">
            <Sparkles className="size-5 text-primary mx-auto mb-2" />
            <p className="text-sm font-semibold">Über 500.000 Kickbase-Spieler</p>
            <p className="text-xs text-muted-foreground mt-0.5">spielen jeden Spieltag um Punkte.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
