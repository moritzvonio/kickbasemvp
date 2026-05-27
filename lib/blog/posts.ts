/**
 * Blog-Datenmodell + Tutorial-Stubs.
 *
 * Die ausführlichen Inhalte folgen im nächsten Schritt (u.a. aus YouTube-
 * Tutorials, z.B. zum Trading). Solange ein Post `status: "coming-soon"` hat,
 * wird er auf `noindex` gesetzt (kein Thin-Content-Risiko) und NICHT in die
 * Sitemap aufgenommen. Sobald echter Inhalt da ist → `status: "published"` +
 * `body` füllen → automatisch indexierbar & in Sitemap.
 */
export interface BlogPost {
  slug: string;
  title: string;
  /** Meta-Description (<155 Zeichen). */
  description: string;
  /** Primäres SEO-Ziel-Keyword. */
  keyword: string;
  category: "Marktwert" | "Trading" | "Grundlagen" | "Aufstellung" | "Tools" | "Spieler";
  /** Kurzer Intro-/Teaser-Absatz für Index + Stub-Seite. */
  excerpt: string;
  /** Geplante Gliederung (H2s) — strukturiert die Stub-Seite. */
  outline: string[];
  readingMinutes: number;
  publishedAt: string;
  updatedAt?: string;
  status: "published" | "coming-soon";
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "kickbase-marktwert-prognose",
    title: "Kickbase Marktwert-Prognose: Wann steigt oder fällt ein Wert?",
    description:
      "Wann steigt oder fällt ein Kickbase-Marktwert? Update-Uhrzeit, Einflussfaktoren und wie du Marktwert-Prognosen für clevere Transfers nutzt.",
    keyword: "Kickbase Marktwert Prognose",
    category: "Marktwert",
    excerpt:
      "Der Marktwert ist die wichtigste Währung bei Kickbase – und er folgt Mustern. Wir zeigen, was ihn steigen und fallen lässt, wann das tägliche Update kommt und wie du mit einer Marktwert-Prognose früher kaufst und rechtzeitig verkaufst.",
    outline: [
      "Wie der Kickbase-Marktwert wirklich entsteht (Angebot & Nachfrage)",
      "Die wichtigsten Einflussfaktoren: Form, Einsatzzeit, News",
      "Update-Uhrzeit: Warum 22:00 Uhr alles entscheidet",
      "So liest du eine Marktwert-Prognose richtig",
      "Praxis: Mit LigaBase Gewinner von morgen finden",
    ],
    readingMinutes: 6,
    publishedAt: "2026-05-27",
    status: "coming-soon",
  },
  {
    slug: "kickbase-trading-guide",
    title: "Kickbase Trading: So maximierst du deinen Teamwert",
    description:
      "Kickbase Trading Schritt für Schritt: Wann kaufen, wann verkaufen, clever ins Minus gehen und den Teamwert schnell steigern. Die besten Trading-Tipps.",
    keyword: "Kickbase Trading",
    category: "Trading",
    excerpt:
      "Trading entscheidet bei Kickbase über Sieg oder Niederlage. In diesem Guide lernst du die komplette Trading-Mechanik: Kauf- und Verkaufszeitpunkte, die Minus-Strategie in der Länderspielpause und wie du Woche für Woche Teamwert aufbaust.",
    outline: [
      "Trading-Grundprinzip: Kaufen, wenn andere verkaufen",
      "Der richtige Kauf- und Verkaufszeitpunkt (22-Uhr-Regel)",
      "Ins Minus gehen: Chancen & Risiken der Minus-Strategie",
      "Risikomanagement: Wie viel Teamwert ist gesund?",
      "Trading mit dem LigaBase Transfer-Advisor",
    ],
    readingMinutes: 8,
    publishedAt: "2026-05-27",
    status: "coming-soon",
  },
  {
    slug: "kickbase-fuer-anfaenger",
    title: "Kickbase für Anfänger: Regeln, erster Spieltag & Strategie",
    description:
      "Wie funktioniert Kickbase? Regeln, erster Spieltag, Startbudget und Aufstellung einfach erklärt – der komplette Einsteiger-Guide für neue Manager.",
    keyword: "wie funktioniert Kickbase",
    category: "Grundlagen",
    excerpt:
      "Neu bei Kickbase? Hier bekommst du den kompletten Überblick: Wie das Spiel funktioniert, mit welchem Budget du startest, wie Punkte und Marktwerte zusammenhängen und welche Fehler du am ersten Spieltag unbedingt vermeiden solltest.",
    outline: [
      "Was ist Kickbase? Das Prinzip in 2 Minuten",
      "Startbudget: 100 Mio. Team + 50 Mio. Cash erklärt",
      "Deine erste Aufstellung: 11 Spieler richtig setzen",
      "Punkte, Prämien & Marktwert verstehen",
      "Die 5 häufigsten Anfängerfehler",
    ],
    readingMinutes: 7,
    publishedAt: "2026-05-27",
    status: "coming-soon",
  },
  {
    slug: "kickbase-gebots-strategie",
    title: "Wie hoch bieten? Die optimale Gebots-Strategie bei Kickbase",
    description:
      "Wie viel solltest du bei Kickbase bieten? Warum du Spieler trotz hohem Gebot nicht bekommst und wie der Transferzeitpunkt über Erfolg entscheidet.",
    keyword: "Kickbase wie hoch bieten",
    category: "Trading",
    excerpt:
      "Das höchste Gebot – und der Spieler geht trotzdem an jemand anderen? Ein Kickbase-Klassiker. Wir erklären, wie Gebote wirklich funktionieren, warum der Marktwert um 22:00 Uhr zählt und mit welchem Puffer du bieten solltest.",
    outline: [
      "Wie Gebote bei Kickbase abgewickelt werden",
      "Warum der Marktwert zum Transferzeitpunkt entscheidet",
      "Der richtige Gebots-Puffer über dem Marktwert",
      "Gegen die Liga-Bank vs. gegen andere Manager bieten",
      "Gebots-Empfehlungen mit LigaBase",
    ],
    readingMinutes: 5,
    publishedAt: "2026-05-27",
    status: "coming-soon",
  },
  {
    slug: "kickbase-punkte-praemien",
    title: "Kickbase Punkte & Prämien erklärt (Punktetabelle & Boni)",
    description:
      "Wie werden Kickbase-Punkte berechnet und wie viel Prämie gibt es? Punktetabelle, Spieltagsboni, Erfolge und Login-Bonus verständlich erklärt.",
    keyword: "Kickbase Punkte berechnen",
    category: "Grundlagen",
    excerpt:
      "Punkte sind bei Kickbase bares Geld. Dieser Guide erklärt, wie die Opta-Punkte zustande kommen, welche Prämien es für Spieltagspunkte und Erfolge gibt und wie der tägliche Login-Bonus funktioniert.",
    outline: [
      "Wie die Punkte berechnet werden (Opta / Stats Perform)",
      "Positionsabhängige Wertung: Tore, Vorlagen, Defensive",
      "Spieltagsprämien: 1.000 / 1.500 / 2.000 Punkte",
      "Erfolge & Trading-Boni (Händchen, Königstransfer)",
      "Täglicher Login-Bonus: So funktioniert die Staffelung",
    ],
    readingMinutes: 6,
    publishedAt: "2026-05-27",
    status: "coming-soon",
  },
  {
    slug: "beste-kickbase-tools-vergleich",
    title: "Die besten Kickbase-Tools 2026 im Vergleich",
    description:
      "Welches Kickbase-Tool ist das beste? Marktwert-Prognose, Live-Punkte und Scouting im Vergleich – inklusive kostenloser Optionen für deine Liga.",
    keyword: "bestes Kickbase Tool",
    category: "Tools",
    excerpt:
      "Marktwert-Prognosen, Live-Punkte, Scouting: Kickbase-Tools nehmen dir Arbeit ab und verschaffen dir einen Vorsprung. Wir vergleichen die wichtigsten Funktionen und zeigen, worauf es bei einem guten – und kostenlosen – Tool ankommt.",
    outline: [
      "Welche Funktionen ein gutes Kickbase-Tool braucht",
      "Marktwert-Prognose & Trends im Vergleich",
      "Live-Punkte, Scouting & Liga-Statistiken",
      "Kostenlos vs. Premium: Was lohnt sich?",
      "LigaBase im Überblick",
    ],
    readingMinutes: 7,
    publishedAt: "2026-05-27",
    status: "coming-soon",
  },
  {
    slug: "kickbase-aufstellung-formation",
    title: "Kickbase Aufstellung: Beste Formation & welche Spieler",
    description:
      "Welche Formation ist bei Kickbase die beste und welche Spieler solltest du aufstellen? Aufstellungs-Tipps, Deadline und Punkte-Optimierung.",
    keyword: "Kickbase beste Formation",
    category: "Aufstellung",
    excerpt:
      "Die beste Aufstellung holt jede Woche zusätzliche Punkte. Wir zeigen, welche Formationen sich lohnen, wie du auf voraussichtliche Startelfs reagierst und warum die 20:29-Uhr-Deadline so wichtig ist.",
    outline: [
      "Formationen bei Kickbase: Welche bringt die meisten Punkte?",
      "Voraussichtliche Aufstellungen richtig nutzen",
      "Die 20:29-Uhr-Deadline und ihre Tücken",
      "Rotation, Verletzungen & Last-Minute-Wechsel",
      "Aufstellung optimieren mit LigaBase",
    ],
    readingMinutes: 6,
    publishedAt: "2026-05-27",
    status: "coming-soon",
  },
  {
    slug: "kickbase-beste-spieler",
    title: "Kickbase: Die besten Punkte-Lieferanten der Saison",
    description:
      "Welche Spieler liefern bei Kickbase die meisten Punkte? Die Top-Punkte-Lieferanten der Saison und wie du sie mit der Top-50-Rangliste findest.",
    keyword: "Kickbase beste Spieler",
    category: "Spieler",
    excerpt:
      "Wer sind die zuverlässigsten Punkte-Lieferanten der Saison? Wir zeigen, wie du echte Saison-Punkte (statt Marktwert) bewertest und mit der LigaBase Top-50-Rangliste die konstantesten Spieler für deine Liga findest.",
    outline: [
      "Punkte vs. Marktwert: Worauf es wirklich ankommt",
      "Konstanz schlagen: Wer liefert Woche für Woche?",
      "Die Top-50 Saison-Punkte-Liste erklärt",
      "Schnäppchen mit hoher Punkte-Ausbeute finden",
      "Spielerwahl mit LigaBase",
    ],
    readingMinutes: 6,
    publishedAt: "2026-05-27",
    status: "coming-soon",
  },
];

export const PUBLISHED_POSTS = BLOG_POSTS.filter((p) => p.status === "published");

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
