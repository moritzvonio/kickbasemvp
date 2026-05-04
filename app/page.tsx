import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Users,
  Bell,
  Sparkles,
  Lock,
} from "lucide-react";

export default function HomePage() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-md bg-background/70">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">
              B
            </span>
            BetterBase
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#pricing" className="hover:text-foreground transition">Preise</a>
            <a href="#faq" className="hover:text-foreground transition">FAQ</a>
          </nav>
          <Button asChild size="sm">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 -z-10 opacity-40"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, rgba(210,5,21,0.25) 0%, transparent 70%)",
            }}
          />
          <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
            <Badge variant="outline" className="mb-6">
              <Sparkles className="size-3 mr-1.5" /> Saison 26/27 ready
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
              Kickbase, <span className="text-primary">aber besser</span>.
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Liga-Sozial-Layer, Marktwert-Insights und Transfer-Coach in einer App.
              Login mit deinem Kickbase-Account — Passwort wird nicht gespeichert.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  Jetzt mit Kickbase einloggen <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#features">Features ansehen</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <Lock className="size-3" /> Kein Passwort-Storage · DSGVO · Kein Tracking
            </p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-border/50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold">Drei Hebel, die Kickbase nicht hat</h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                Wir bauen genau das, was in der Kickbase-App fehlt — und was Konkurrenten halbherzig machen.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              <FeatureCard
                icon={<Users className="size-5 text-primary" />}
                title="Liga-Sozial-Layer"
                desc="Wer hat wieviel Cash, wer ist der heimliche Marktwert-King, wer hat letzte Woche zu billig verkauft. Volle Transparenz in deiner Liga."
              />
              <FeatureCard
                icon={<TrendingUp className="size-5 text-primary" />}
                title="AI-Transfer-Coach"
                desc="Konkret: »Verkauf X heute — Marktwert sinkt in 3 Tagen.« Kombiniert Marktwert-Modell, Spielplan, Form und Liga-Nachfrage."
              />
              <FeatureCard
                icon={<Bell className="size-5 text-primary" />}
                title="Push-Alerts"
                desc="Push wenn Marktwert > 100k droppt, neuer Transfer in deiner Liga, oder dein Watchlist-Spieler endlich auf den Markt kommt."
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-border/50 bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold">Fair gepreist, klar bezahlt</h2>
              <p className="mt-3 text-muted-foreground">
                Free reicht für die Basics. Pro für die ganze Saison spart 60 %.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
              <PricingCard
                name="Free"
                price="0 €"
                period="für immer"
                features={[
                  "Liga-Übersicht & Tabelle",
                  "Eigenes Team & Marktwerte",
                  "Marktwert-Historie 14 Tage",
                  "1 Sponsored Card pro Screen",
                ]}
                cta={
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">Loslegen</Link>
                  </Button>
                }
              />
              <PricingCard
                name="Pro Monatlich"
                price="4,99 €"
                period="pro Monat"
                features={[
                  "Liga-Sozial-Layer",
                  "AI-Transfer-Coach",
                  "Push & Email Alerts",
                  "Unbegrenzte Marktwert-Historie",
                  "CSV/PDF Export",
                  "Werbefrei",
                ]}
                cta={
                  <Button asChild className="w-full">
                    <Link href="/login">Pro starten</Link>
                  </Button>
                }
              />
              <PricingCard
                name="Pro Saison"
                price="19,99 €"
                period="für 9 Monate (Aug–Mai)"
                highlight="Spar 60 %"
                features={[
                  "Alle Pro-Features",
                  "Effektiv 2,22 € / Monat",
                  "Saison-PDF-Report (V2)",
                  "Frühzeitiger Zugang zu Beta-Features",
                ]}
                cta={
                  <Button asChild className="w-full">
                    <Link href="/login">Saison sichern</Link>
                  </Button>
                }
                featured
              />
            </div>
            <div className="mt-10 max-w-3xl mx-auto p-5 rounded-lg border border-border bg-card/40 text-sm text-muted-foreground flex items-start gap-3">
              <Users className="size-5 mt-0.5 text-primary shrink-0" />
              <div>
                <span className="font-medium text-foreground">Liga-Pro:</span> Du bist Liga-Admin?
                Für <span className="font-mono text-foreground">9,99 € pro Saison</span> einmalig
                bekommen alle deine Liga-Mitglieder Pro automatisch. (Coming V2 — sag uns nach Login Bescheid.)
              </div>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="border-t border-border/50">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="grid gap-6 md:grid-cols-3 text-sm">
              <TrustItem icon={<Lock className="size-5 text-primary" />} title="Passwort wird nicht gespeichert">
                Wir tauschen dein Passwort sofort gegen einen Kickbase-Token. Der Token landet
                verschlüsselt in einem httpOnly-Cookie — niemals in unserer Datenbank.
              </TrustItem>
              <TrustItem icon={<ShieldCheck className="size-5 text-primary" />} title="Nicht offiziell">
                BetterBase ist nicht mit Kickbase, der DFL oder einem Bundesliga-Verein verbunden.
                Die Nutzung erfolgt auf eigene Verantwortung.
              </TrustItem>
              <TrustItem icon={<Sparkles className="size-5 text-primary" />} title="DSGVO-konform">
                Hosting in der EU, keine Tracker, kein Cookie-Banner-Spam. Plausible statt Google Analytics.
              </TrustItem>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-border/50 bg-muted/20">
          <div className="mx-auto max-w-3xl px-4 py-16">
            <h2 className="text-3xl font-bold text-center mb-10">FAQ</h2>
            <dl className="space-y-6">
              <FaqItem q="Ist BetterBase offiziell von Kickbase?">
                Nein. Wir nutzen die öffentliche Kickbase-App-API (v4) und sind ein
                unabhängiges Drittanbieter-Tool.
              </FaqItem>
              <FaqItem q="Kann mein Account gesperrt werden?">
                Uns ist kein Fall bekannt. Wir respektieren Rate-Limits, lesen nur was du selbst sehen kannst,
                und schreiben nichts ohne deine ausdrückliche Aktion.
              </FaqItem>
              <FaqItem q="Was passiert mit meinem Passwort?">
                Wir leiten es einmalig an die Kickbase-Login-API weiter, bekommen einen Token zurück
                und werfen das Passwort weg. Token wird verschlüsselt in einem httpOnly-Cookie gespeichert.
              </FaqItem>
              <FaqItem q="Wann startet ihr?">
                Saison 26/27 — Mitte August 2026. Bis dahin Beta. Saison-Pass-Käufe ab Launch
                rückwirkend gültig für die ganze Saison.
              </FaqItem>
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50">
        <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>
            © 2026 BetterBase · Nicht offiziell mit Kickbase verbunden.
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/impressum" className="hover:text-foreground">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-foreground">Datenschutz</Link>
            <Link href="/agb" className="hover:text-foreground">AGB</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardHeader>
        <div className="size-10 rounded-md bg-primary/10 flex items-center justify-center mb-3">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}

function PricingCard({
  name,
  price,
  period,
  features,
  cta,
  highlight,
  featured,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: React.ReactNode;
  highlight?: string;
  featured?: boolean;
}) {
  return (
    <Card className={featured ? "border-primary/60 shadow-[0_0_0_1px_rgba(210,5,21,0.4),0_8px_24px_-12px_rgba(210,5,21,0.4)] relative" : ""}>
      {highlight && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">{highlight}</Badge>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription className="flex items-baseline gap-2 pt-1">
          <span className="text-3xl font-bold text-foreground">{price}</span>
          <span className="text-xs">{period}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm">
          {features.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="text-primary">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
        {cta}
      </CardContent>
    </Card>
  );
}

function TrustItem({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0">{icon}</div>
      <div>
        <div className="font-medium text-foreground mb-1">{title}</div>
        <p className="text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-medium mb-1">{q}</dt>
      <dd className="text-muted-foreground text-sm">{children}</dd>
    </div>
  );
}
