import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/auth";
import { getAdminStats } from "@/lib/admin/analytics";
import { getSalesStats } from "@/lib/admin/stripe-stats";
import { Logo } from "@/components/ui/logo";
import { Users, Activity, BarChart3, ExternalLink } from "lucide-react";

const eur = (n: number) =>
  n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

function ago(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return "gerade eben";
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  return new Date(ts).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const VERCEL_ANALYTICS = "https://vercel.com/moritzvonios-projects/betterbase/analytics";
const GSC = "https://search.google.com/search-console";

export default async function AdminPage() {
  const session = await getSession();
  if (!isAdmin(session?.userId)) notFound();

  const stats = await getAdminStats();
  const sales = await getSalesStats();

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Ligabase Startseite">
              <Logo size={30} />
            </Link>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Admin
            </span>
          </div>
          <Link href="/leagues" className="text-sm text-primary hover:underline">
            Zur App →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Kpi icon={<Users className="size-4" />} label="Nutzer gesamt" value={stats.totalUsers} />
          <Kpi icon={<Activity className="size-4" />} label="Aktiv (7 Tage)" value={stats.activeUsers7d} />
          <Kpi icon={<BarChart3 className="size-4" />} label="Letzte Logins" value={stats.recentLogins.length} />
        </div>

        {/* Verkäufe & Codes (nur wenn Stripe konfiguriert) */}
        {sales && (
          <Section title="Verkäufe & Codes">
            <div className="flex flex-wrap gap-x-8 gap-y-2 mb-4 text-sm">
              <div>
                <span className="text-muted-foreground">Käufe gesamt: </span>
                <span className="font-bold tabular">{sales.totalSales}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Umsatz gesamt: </span>
                <span className="font-bold tabular">{eur(sales.totalRevenue)}</span>
              </div>
            </div>
            {Object.keys(sales.byCode).length === 0 ? (
              <Empty text="Noch keine Käufe." />
            ) : (
              <Table head={["Code", "Käufe", "Umsatz", "Rev-Share (30 % ab 25)"]}>
                {Object.entries(sales.byCode)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([code, c]) => (
                    <tr key={code} className="border-b border-border/30">
                      <td className="py-2 pr-3 font-mono text-xs">{code}</td>
                      <td className="py-2 pr-3 tabular">{c.count}</td>
                      <td className="py-2 pr-3 tabular">{eur(c.revenue)}</td>
                      <td className="py-2 tabular text-muted-foreground">
                        {code === "ohne Code"
                          ? "–"
                          : c.count >= 25
                          ? eur(c.revenue * 0.3)
                          : `noch ${25 - c.count} bis zur Auszahlung`}
                      </td>
                    </tr>
                  ))}
              </Table>
            )}
          </Section>
        )}

        {/* Externe Analytics */}
        <div className="grid sm:grid-cols-2 gap-4">
          <ExtLink href={VERCEL_ANALYTICS} title="Traffic & Top-Seiten (Vercel Web Analytics)" desc="Seitenaufrufe, Referrer, Länder, Geräte – cookielos." />
          <ExtLink href={GSC} title="Such-Rankings (Google Search Console)" desc="Impressionen, Klicks, Position & indexierte Seiten." />
        </div>

        {/* Letzte Logins */}
        <Section title="Letzte Anmeldungen">
          {stats.recentLogins.length === 0 ? (
            <Empty text="Noch keine Logins erfasst." />
          ) : (
            <Table head={["Manager", "User-ID", "Wann"]}>
              {stats.recentLogins.map((l, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="py-2 pr-3 font-medium">{l.name ?? "–"}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">{l.userId}</td>
                  <td className="py-2 text-muted-foreground">{ago(l.ts)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        {/* Letzte Seitenaufrufe (pro User) */}
        <Section title="Letzte Seitenaufrufe">
          {stats.recentEvents.length === 0 ? (
            <Empty text="Noch keine Seitenaufrufe erfasst." />
          ) : (
            <Table head={["Manager", "Seite", "Wann"]}>
              {stats.recentEvents.map((e, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="py-2 pr-3 font-medium">{e.name ?? e.userId}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{e.path}</td>
                  <td className="py-2 text-muted-foreground">{ago(e.ts)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        {/* Top-Seiten */}
        <Section title="Top-Seiten (App, First-Party)">
          {stats.topPaths.length === 0 ? (
            <Empty text="Noch keine Daten." />
          ) : (
            <Table head={["Seite", "Aufrufe"]}>
              {stats.topPaths.map((p) => (
                <tr key={p.path} className="border-b border-border/30">
                  <td className="py-2 pr-3 font-mono text-xs">{p.path}</td>
                  <td className="py-2 tabular">{p.count}</td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        <p className="text-xs text-muted-foreground">
          First-Party-Tracking (User-ID, Name, Pfad) für Produkt-Analytics.
          DSGVO-Hinweis in der Datenschutzerklärung erforderlich. Aggregierter
          Traffic & Such-Rankings über die verlinkten externen Dienste.
        </p>
      </main>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold tabular">{value.toLocaleString("de-DE")}</div>
    </div>
  );
}

function ExtLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold">{title}</span>
        <ExternalLink className="size-4 text-muted-foreground group-hover:text-primary" />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </a>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {title}
      </h2>
      <div className="rounded-2xl border border-border bg-card p-4 overflow-x-auto">{children}</div>
    </section>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full text-sm">
      <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
        <tr>
          {head.map((h) => (
            <th key={h} className="py-2 pr-3 font-medium">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-3">{text}</p>;
}
