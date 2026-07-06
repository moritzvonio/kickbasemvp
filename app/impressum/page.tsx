import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";

export const metadata: Metadata = {
  title: "Impressum",
  robots: { index: false, follow: true },
};

// TODO Mourice: finale Texte – Anschrift und Kontakt-E-Mail unten eintragen,
// dann die amber markierten Platzhalter entfernen. Rechtlich vor dem ersten
// Creator-Kontakt / Launch pflichtig (§ 5 DDG).
export default function ImpressumPage() {
  return (
    <div className="flex-1 flex flex-col">
      <AppHeader />
      <main className="flex-1 mx-auto max-w-2xl w-full px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Impressum</h1>

        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 mb-8">
          Hinweis: Anschrift und Kontakt-E-Mail sind noch Platzhalter und werden vor
          dem Launch ergänzt.
        </div>

        <Section title="Angaben gemäß § 5 DDG">
          <p>Mourice Engelmann</p>
          <p className="text-muted-foreground">[Anschrift folgt]</p>
        </Section>

        <Section title="Kontakt">
          <p className="text-muted-foreground">E-Mail: [E-Mail folgt]</p>
        </Section>

        <Section title="Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)">
          <p>Mourice Engelmann</p>
          <p className="text-muted-foreground">[Anschrift folgt]</p>
        </Section>

        <Section title="Haftung für Inhalte">
          <p>
            Die Inhalte dieser Seiten wurden mit größter Sorgfalt erstellt. Für die
            Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch
            keine Gewähr übernehmen.
          </p>
        </Section>

        <Section title="Hinweis zu Kickbase">
          <p>
            Ligabase ist ein unabhängiges Companion-Tool und nicht offiziell mit
            Kickbase, der DFL oder einem Bundesliga-Verein verbunden. Alle genannten
            Marken gehören ihren jeweiligen Inhabern.
          </p>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h2>
      <div className="text-sm leading-relaxed space-y-1">{children}</div>
    </section>
  );
}
