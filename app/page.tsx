import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import { TeamCrest } from "@/components/ui/team-tag";
import { Sparkline } from "@/components/ui/sparkline";
import { FormDots } from "@/components/ui/form-dots";
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Users,
  Bell,
  Sparkles,
  Lock,
  Zap,
  Trophy,
  Wallet,
  Activity,
  Eye,
  Crown,
  Smartphone,
  ChartBar,
  Star,
  CheckCircle2,
  Globe,
} from "lucide-react";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <StatsStrip />
        <Features />
        <DashboardPreview />
        <Pricing />
        <Trust />
        <FAQ />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}

/* ─── Header ───────────────────────────────────────────── */
function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 glass">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <Logo size={32} />
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#preview" className="hover:text-foreground transition">Preview</a>
          <a href="#pricing" className="hover:text-foreground transition">Preise</a>
          <a href="#faq" className="hover:text-foreground transition">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/login">
              Loslegen <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ─── Hero ─────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background blobs */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] size-[480px] bg-emerald-300/30 rounded-full blur-3xl blob" />
        <div className="absolute top-[20%] right-[-15%] size-[520px] bg-emerald-400/20 rounded-full blur-3xl blob blob-delay-1" />
        <div className="absolute top-[60%] left-[20%] size-[360px] bg-emerald-200/25 rounded-full blur-3xl blob blob-delay-2" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-20 pb-12 sm:pt-28 sm:pb-20">
        <div className="text-center">
          <Badge variant="default" className="mb-6 slide-up gap-1.5 py-1 px-3">
            <span className="size-1.5 rounded-full bg-primary pulse-dot" />
            Saison 26/27 — jetzt einsteigen
          </Badge>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[0.95] slide-up slide-up-1">
            Deine Kickbase-Liga,{" "}
            <span className="gradient-text">aber mit Superkräften</span>.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed slide-up slide-up-2">
            Liga-Sozial-Layer, Marktwert-Insights und Transfer-Coach in einer App.
            Login mit deinem Kickbase-Account — Passwort wird{" "}
            <span className="text-foreground font-medium">nicht gespeichert</span>.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 slide-up slide-up-3">
            <Button asChild size="lg" className="w-full sm:w-auto card-glow">
              <Link href="/login">
                <Zap className="size-4" /> Jetzt mit Kickbase einloggen
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <a href="#preview">Preview ansehen</a>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground slide-up slide-up-4">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="size-3.5 text-primary" /> Kein Passwort-Storage
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-primary" /> DSGVO-konform
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="size-3.5 text-primary" /> Hosting in DE
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-primary" /> Beta gratis
            </span>
          </div>
        </div>

        {/* Floating preview card */}
        <div className="mt-16 max-w-4xl mx-auto slide-up slide-up-4">
          <HeroPreviewCard />
        </div>
      </div>
    </section>
  );
}

function HeroPreviewCard() {
  return (
    <div className="relative">
      <div
        className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-emerald-200/50 to-emerald-100/0 blur-2xl"
        aria-hidden
      />
      <div className="rounded-2xl border border-border bg-card shadow-[0_24px_64px_-24px_rgba(15,23,42,0.18)] overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-muted/40">
          <span className="size-2.5 rounded-full bg-rose-400/60" />
          <span className="size-2.5 rounded-full bg-amber-400/60" />
          <span className="size-2.5 rounded-full bg-emerald-400/60" />
          <span className="ml-3 text-[11px] font-mono text-muted-foreground">
            ligabase.de/league/haramlig
          </span>
        </div>
        {/* Preview content */}
        <div className="p-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-4 col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-sm flex items-center gap-1.5">
                <Trophy className="size-4 text-primary" /> Liga-Tabelle
              </div>
              <Badge variant="muted" className="text-[10px]">Spieltag 17</Badge>
            </div>
            <div className="space-y-2">
              {[
                { rank: 1, name: "Tobi", pts: 12_847, you: false, badge: "🥇" },
                { rank: 2, name: "Du", pts: 12_419, you: true, badge: "🥈" },
                { rank: 3, name: "Lukas", pts: 11_998, you: false, badge: "🥉" },
                { rank: 4, name: "Anna", pts: 11_502, you: false },
              ].map((r) => (
                <div
                  key={r.rank}
                  className={
                    "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm " +
                    (r.you ? "bg-primary/[0.07] ring-1 ring-primary/20" : "")
                  }
                >
                  <span className="text-xs font-mono text-muted-foreground w-6">
                    {r.badge ?? `#${r.rank}`}
                  </span>
                  <span className={"flex-1 truncate " + (r.you ? "font-semibold" : "")}>
                    {r.name}
                  </span>
                  <span className="font-mono tabular text-sm">
                    {r.pts.toLocaleString("de-DE")}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <MiniKpi
              icon={<Crown className="size-3.5" />}
              label="Platz"
              value="#2"
              sub="von 12"
            />
            <MiniKpi
              icon={<TrendingUp className="size-3.5" />}
              label="Letzter Spieltag"
              value="+892"
              accent="success"
            />
            <MiniKpi
              icon={<Wallet className="size-3.5" />}
              label="Budget"
              value="4,2 Mio €"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniKpi({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: "success";
}) {
  return (
    <div className="rounded-xl border border-border p-3 bg-card">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
        {icon}
        {label}
      </div>
      <div className={"text-lg font-bold tabular " + (accent === "success" ? "text-emerald-600" : "")}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

/* ─── Stats strip ──────────────────────────────────────── */
function StatsStrip() {
  const stats = [
    { value: "500K+", label: "Kickbase-Spieler" },
    { value: "147", label: "API-Endpoints" },
    { value: "0 €", label: "in der Beta" },
    { value: "<2s", label: "Page-Load" },
    { value: "🇩🇪", label: "Hosting in Deutschland" },
  ];
  return (
    <section className="border-y border-border/50 bg-gradient-to-r from-primary/[0.04] via-transparent to-primary/[0.04]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-8 text-center">
          {stats.map((s) => (
            <div key={s.label} className="flex-1 min-w-[120px]">
              <div className="text-2xl font-bold tabular">{s.value}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features ─────────────────────────────────────────── */
function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Was du kriegst"
          title="Drei Hebel, die Kickbase nicht hat"
          description="Wir bauen genau das, was in der Kickbase-App fehlt — und was Konkurrenten halbherzig machen."
        />
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          <FeatureCard
            icon={<Users className="size-5" />}
            title="Liga-Sozial-Layer"
            desc="Wer hat wieviel Cash, wer ist der heimliche Marktwert-King, wer hat zu billig verkauft. Volle Transparenz in deiner Liga."
            visual={<LeagueSocialVisual />}
          />
          <FeatureCard
            icon={<TrendingUp className="size-5" />}
            title="AI-Transfer-Coach"
            desc="»Verkauf X heute — Marktwert sinkt in 3 Tagen.« Konkrete Action-Items aus Marktwert, Spielplan, Form und Liga-Nachfrage."
            visual={<TransferCoachVisual />}
          />
          <FeatureCard
            icon={<Bell className="size-5" />}
            title="Push-Alerts"
            desc="Push wenn Marktwert > 100k droppt, neuer Transfer in deiner Liga, oder dein Watchlist-Spieler endlich auf den Markt kommt."
            visual={<PushAlertsVisual />}
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  visual,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  visual: React.ReactNode;
}) {
  return (
    <Card className="card-hover group overflow-hidden flex flex-col">
      <CardHeader>
        <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 ring-1 ring-primary/20 group-hover:scale-105 transition-transform">
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{desc}</p>
        <div className="rounded-lg bg-muted/50 ring-1 ring-border p-3 mt-auto">{visual}</div>
      </CardContent>
    </Card>
  );
}

function LeagueSocialVisual() {
  return (
    <div className="space-y-1.5">
      {[
        { name: "Tobi", action: "kaufte Musiala", price: "18,2 Mio", color: "text-emerald-600" },
        { name: "Anna", action: "verkaufte Kane", price: "21,1 Mio", color: "text-rose-600" },
        { name: "Lukas", action: "+412 Punkte", price: "Spieltag", color: "text-primary" },
      ].map((row, i) => (
        <div key={i} className="flex items-center justify-between text-[11px]">
          <span className="font-medium truncate">
            <span className="inline-flex size-4 rounded-full bg-primary/15 text-primary text-[8px] items-center justify-center font-bold mr-1.5">
              {row.name[0]}
            </span>
            {row.name} {row.action}
          </span>
          <span className={"font-mono tabular " + row.color}>{row.price}</span>
        </div>
      ))}
    </div>
  );
}

function TransferCoachVisual() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[11px]">
        <span className="size-6 rounded bg-emerald-500/15 text-emerald-600 inline-flex items-center justify-center">
          <ArrowRight className="size-3" />
        </span>
        <span className="flex-1">
          <span className="font-semibold">Verkauf Wirtz</span>{" "}
          <span className="text-muted-foreground">— MV droppt 87 % Confidence</span>
        </span>
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <span className="size-6 rounded bg-emerald-500/15 text-emerald-600 inline-flex items-center justify-center">
          <ArrowRight className="size-3" />
        </span>
        <span className="flex-1">
          <span className="font-semibold">Kauf Boniface</span>{" "}
          <span className="text-muted-foreground">— Form ↑ + leichter Gegner</span>
        </span>
      </div>
      <div className="pt-1.5 mt-1.5 border-t border-border/60">
        <Sparkline
          values={[10, 12, 11, 14, 13, 16, 18, 17, 20, 22]}
          width={240}
          height={28}
          color="#10b981"
          className="w-full"
        />
      </div>
    </div>
  );
}

function PushAlertsVisual() {
  return (
    <div className="space-y-1.5">
      {[
        { icon: <TrendingUp className="size-3" />, text: "Musiala MV +320k", time: "jetzt" },
        { icon: <Activity className="size-3" />, text: "Anna kaufte Kane", time: "2 Min" },
        { icon: <Eye className="size-3" />, text: "Watchlist: Boniface auf Markt", time: "5 Min" },
      ].map((row, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px] p-1.5 rounded bg-card ring-1 ring-border">
          <span className="size-5 rounded bg-primary/15 text-primary inline-flex items-center justify-center">
            {row.icon}
          </span>
          <span className="flex-1 truncate font-medium">{row.text}</span>
          <span className="text-muted-foreground">{row.time}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Dashboard preview section ────────────────────────── */
function DashboardPreview() {
  return (
    <section id="preview" className="py-20 sm:py-28 bg-gradient-to-b from-transparent via-emerald-50/40 to-transparent">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Live-Preview"
          title="So sieht dein Liga-Dashboard aus"
          description="Echte Daten, echte Player-Cards, echte Spieltag-Form. Alles in einer Übersicht."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <PlayerCardPreview
            name="Florian Wirtz"
            tid="7"
            pos={3}
            mv="18,4 Mio"
            mvDelta="+312k"
            trendValues={[8.2, 8.5, 8.4, 8.7, 9.1, 9.0, 9.3, 9.6, 10.1, 10.5]}
            form={[122, 88, 154, 0, 96]}
          />
          <PlayerCardPreview
            name="Harry Kane"
            tid="3"
            pos={4}
            mv="42,9 Mio"
            mvDelta="-890k"
            trendValues={[10.8, 10.6, 10.4, 10.2, 10.0, 9.7, 9.5, 9.3, 9.0]}
            form={[210, 184, 0, 142, 168]}
            negative
          />
        </div>
      </div>
    </section>
  );
}

function PlayerCardPreview({
  name,
  tid,
  pos,
  mv,
  mvDelta,
  trendValues,
  form,
  negative,
}: {
  name: string;
  tid: string;
  pos: number;
  mv: string;
  mvDelta: string;
  trendValues: number[];
  form: number[];
  negative?: boolean;
}) {
  const POS_LABEL = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" }[pos] ?? "?";
  return (
    <Card className="card-hover overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <TeamCrest tid={tid} size={48} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base truncate">{name}</div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="chip">{POS_LABEL}</span>
              <span>72 Pkt Ø</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-bold tabular">{mv}</div>
            <div className={"text-xs font-mono tabular " + (negative ? "text-rose-600" : "text-emerald-600")}>
              {mvDelta}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Form letzte 5</div>
            <FormDots points={form} />
          </div>
          <Sparkline
            values={trendValues}
            width={120}
            height={36}
            color={negative ? "#f43f5e" : "#10b981"}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Pricing ──────────────────────────────────────────── */
function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Pricing"
          title="Fair gepreist, klar bezahlt"
          description="Free reicht für die Basics. Pro für die ganze Saison spart 60 %."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
          <PricingCard
            name="Free"
            price="0 €"
            period="für immer"
            tagline="Teste LigaBase ohne Risiko."
            features={[
              { ok: true, text: "Liga-Übersicht & Tabelle" },
              { ok: true, text: "Eigenes Team & Marktwerte" },
              { ok: true, text: "Marktwert-Historie 14 Tage" },
              { ok: false, text: "Liga-Sozial-Layer" },
              { ok: false, text: "AI-Transfer-Coach" },
              { ok: false, text: "Push-Alerts" },
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
            tagline="Flexibel — jederzeit kündbar."
            features={[
              { ok: true, text: "Alles aus Free" },
              { ok: true, text: "Liga-Sozial-Layer" },
              { ok: true, text: "AI-Transfer-Coach" },
              { ok: true, text: "Push & Email Alerts" },
              { ok: true, text: "Unbegrenzte MW-Historie" },
              { ok: true, text: "CSV / PDF Export" },
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
            period="für 9 Monate"
            tagline="Effektiv 2,22 € / Monat."
            highlight="Spar 60 %"
            features={[
              { ok: true, text: "Alle Pro-Features" },
              { ok: true, text: "Saison-PDF-Report (V2)" },
              { ok: true, text: "Beta-Frühzugang" },
              { ok: true, text: "Lock dir die Pro-Features für die ganze Saison" },
            ]}
            cta={
              <Button asChild className="w-full card-glow">
                <Link href="/login">Saison sichern</Link>
              </Button>
            }
            featured
          />
        </div>

        <div className="mt-10 max-w-3xl mx-auto p-5 rounded-2xl border border-primary/20 bg-primary/[0.04] text-sm flex items-start gap-3">
          <span className="size-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Users className="size-4" />
          </span>
          <div>
            <div className="font-semibold mb-1">Liga-Pro für Admins</div>
            <p className="text-muted-foreground">
              Du bist Liga-Admin? Für{" "}
              <span className="font-mono text-foreground">9,99 € pro Saison</span> einmalig
              bekommen alle deine Liga-Mitglieder Pro automatisch. Spar 80 % gegenüber 12 ×
              Einzel-Pro. <span className="text-foreground font-medium">(Coming V2.)</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingCard({
  name,
  price,
  period,
  tagline,
  features,
  cta,
  highlight,
  featured,
}: {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: { ok: boolean; text: string }[];
  cta: React.ReactNode;
  highlight?: string;
  featured?: boolean;
}) {
  return (
    <Card
      className={
        "relative overflow-hidden " +
        (featured
          ? "card-glow border-primary/40"
          : "card-hover")
      }
    >
      {featured && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-700" />
      )}
      {highlight && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-md">{highlight}</Badge>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription className="pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground tracking-tight tabular">{price}</span>
            <span className="text-xs">{period}</span>
          </div>
          <p className="mt-2 text-xs">{tagline}</p>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm">
          {features.map((f) => (
            <li key={f.text} className={"flex items-start gap-2 " + (f.ok ? "" : "text-muted-foreground/60")}>
              <CheckCircle2
                className={"size-4 shrink-0 mt-0.5 " + (f.ok ? "text-primary" : "text-muted-foreground/40")}
              />
              <span>{f.text}</span>
            </li>
          ))}
        </ul>
        {cta}
      </CardContent>
    </Card>
  );
}

/* ─── Trust ───────────────────────────────────────────── */
function Trust() {
  return (
    <section className="py-16 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-6 md:grid-cols-3">
          <TrustItem icon={<Lock className="size-5" />} title="Passwort wird nicht gespeichert">
            Wir tauschen dein Passwort sofort gegen einen Kickbase-Token. Der Token landet
            verschlüsselt in einem httpOnly-Cookie — niemals in unserer Datenbank.
          </TrustItem>
          <TrustItem icon={<ShieldCheck className="size-5" />} title="Nicht offiziell">
            LigaBase ist nicht mit Kickbase, der DFL oder einem Bundesliga-Verein verbunden.
            Die Nutzung erfolgt auf eigene Verantwortung.
          </TrustItem>
          <TrustItem icon={<Sparkles className="size-5" />} title="DSGVO-konform">
            Hosting in der EU, keine Tracker, kein Cookie-Banner-Spam. Plausible statt Google Analytics.
          </TrustItem>
        </div>
      </div>
    </section>
  );
}

function TrustItem({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 ring-1 ring-primary/20">
        {icon}
      </span>
      <div>
        <div className="font-semibold mb-1">{title}</div>
        <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

/* ─── FAQ ─────────────────────────────────────────────── */
function FAQ() {
  return (
    <section id="faq" className="py-20 sm:py-28 border-t border-border/60 bg-gradient-to-b from-transparent to-emerald-50/30">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeading
          eyebrow="FAQ"
          title="Häufige Fragen"
          description="Alles was du wissen musst, bevor du loslegst."
        />
        <div className="mt-12 space-y-4">
          <FaqItem q="Ist LigaBase offiziell von Kickbase?">
            Nein. Wir nutzen die öffentliche Kickbase-App-API (v4) und sind ein
            unabhängiges Drittanbieter-Tool.
          </FaqItem>
          <FaqItem q="Kann mein Account gesperrt werden?">
            Uns ist kein Fall bekannt. Wir respektieren Rate-Limits, lesen nur was du selbst
            sehen kannst, und schreiben nichts ohne deine ausdrückliche Aktion.
          </FaqItem>
          <FaqItem q="Was passiert mit meinem Passwort?">
            Wir leiten es einmalig an die Kickbase-Login-API weiter, bekommen einen Token zurück
            und werfen das Passwort weg. Token wird verschlüsselt in einem httpOnly-Cookie gespeichert.
          </FaqItem>
          <FaqItem q="Wann startet ihr?">
            Saison 26/27 — Mitte August 2026. Bis dahin Beta. Saison-Pass-Käufe ab Launch
            rückwirkend gültig für die ganze Saison.
          </FaqItem>
          <FaqItem q="Gibt's eine App?">
            LigaBase ist eine PWA — du installierst sie aus dem Browser auf deinen Home-Screen.
            Push-Notifications, Offline-Cache, Vollbild — alles dabei.
          </FaqItem>
          <FaqItem q="Kann ich kündigen?">
            Pro Monatlich: jederzeit, sofortiger Effekt zum Periodenende.
            Pro Saison: keine Kündigung nötig — läuft einmalig 9 Monate ab.
          </FaqItem>
        </div>
      </div>
    </section>
  );
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-border bg-card p-5 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex items-center justify-between cursor-pointer list-none font-semibold">
        {q}
        <span className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 ml-3 group-open:rotate-45 transition-transform text-base">
          +
        </span>
      </summary>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{children}</p>
    </details>
  );
}

/* ─── Final CTA ───────────────────────────────────────── */
function FinalCta() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4">
        <div className="relative rounded-3xl overflow-hidden p-10 sm:p-16 text-center">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700" />
          <div className="absolute inset-0 -z-10 opacity-25" aria-hidden>
            <svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
              <circle cx="100" cy="50" r="22" fill="none" stroke="white" strokeWidth="0.5" />
              <line x1="100" y1="0" x2="100" y2="100" stroke="white" strokeWidth="0.5" />
              <rect x="0" y="20" width="20" height="60" fill="none" stroke="white" strokeWidth="0.5" />
              <rect x="180" y="20" width="20" height="60" fill="none" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>
          <Badge variant="secondary" className="mb-5 backdrop-blur bg-white/20 text-white border-white/30">
            <Sparkles className="size-3 mr-1.5" /> Beta läuft
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Bereit für die smartere Saison?
          </h2>
          <p className="text-emerald-50/90 text-lg max-w-xl mx-auto mb-8">
            In 90 Sekunden eingeloggt. Kein neues Konto. Kein Risiko.
          </p>
          <Button asChild size="lg" variant="secondary" className="bg-white text-emerald-700 hover:bg-emerald-50">
            <Link href="/login">
              <Zap className="size-4" /> Mit Kickbase einloggen
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────── */
function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4 text-sm">
          <div>
            <Logo size={28} />
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed max-w-[220px]">
              Die smarteste Companion-App für deine Kickbase-Saison.
              Nicht offiziell mit Kickbase verbunden.
            </p>
          </div>
          <FooterCol title="Produkt">
            <Link href="/login">Login</Link>
            <a href="#features">Features</a>
            <a href="#pricing">Preise</a>
            <a href="#faq">FAQ</a>
          </FooterCol>
          <FooterCol title="Rechtliches">
            <Link href="/impressum">Impressum</Link>
            <Link href="/datenschutz">Datenschutz</Link>
            <Link href="/agb">AGB</Link>
          </FooterCol>
          <FooterCol title="Status">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 pulse-dot" />
              Alle Systeme OK
            </span>
            <span className="text-muted-foreground">Saison 26/27</span>
          </FooterCol>
        </div>
        <div className="mt-8 pt-6 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-between">
          <span>© 2026 LigaBase</span>
          <span>Made in Berlin · with ⚽ + 🍺</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-semibold mb-3">{title}</div>
      <div className="flex flex-col gap-2 text-muted-foreground [&>*:hover]:text-foreground [&>*]:transition-colors">
        {children}
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────── */
function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="chip mx-auto mb-4">
        <Star className="size-3" />
        {eyebrow}
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h2>
      {description && (
        <p className="mt-3 text-muted-foreground text-base sm:text-lg">{description}</p>
      )}
    </div>
  );
}
