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
  /** Ausführlicher Inhalt (nur bei status "published"). */
  body?: BlogSection[];
  /** Quellenangaben (für E-E-A-T / Transparenz). */
  sources?: { label: string; url: string }[];
}

/** Ein Inhaltsblock innerhalb einer Sektion. */
export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "tip"; text: string }
  | { type: "quote"; text: string; cite?: string };

export interface BlogSection {
  h2: string;
  blocks: BlogBlock[];
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
    readingMinutes: 9,
    publishedAt: "2026-05-27",
    updatedAt: "2026-05-27",
    status: "published",
    sources: [
      { label: "Kickbase Hilfe – Die 33%-Regel (ins Minus gehen)", url: "https://help.kickbase.com/en/help/wie-weit-darf-ich-ins-minus" },
      { label: "Kickbase Hilfe – Gebot & Transferzeitpunkt (22-Uhr-Update)", url: "https://help.kickbase.com/en/help/ich-habe-auf-einen-spieler-geboten-warum-habe-ich-ihn-nicht-zum-transferzeitpunkt-bekommen" },
      { label: "Kickbase Hilfe – Erfolge & Prämien", url: "https://help.kickbase.com/help/welche-erfolge-kann-ich-in-der-app-erhalten" },
      { label: "Kickbase Hilfe – Transfermarkt", url: "https://help.kickbase.com/help/transfermarkt" },
      { label: "GIGA – Kickbase: ins Minus gehen", url: "https://www.giga.de/artikel/kickbase-im-minus-gehen-was-sollte-man-beachten/" },
      { label: "LigaInsider – Marktwertverläufe", url: "https://www.ligainsider.de/seite/manager-tipps-tricks/marktwertverlaeufe/" },
      { label: "KickbaseNerd – Rating-Tool", url: "https://kbnerd.de/das-kickbase-rating-tool/" },
    ],
    body: [
      {
        h2: "Was ist Trading bei Kickbase – und warum es über den Sieg entscheidet",
        blocks: [
          { type: "p", text: "Trading bedeutet bei Kickbase: Spieler günstig kaufen, teurer verkaufen und so deinen Teamwert und dein Budget Woche für Woche steigern. Während die Punkte aus deiner Aufstellung kommen, baust du mit Trading das Kapital auf, um dir die besten Punkte-Lieferanten überhaupt leisten zu können." },
          { type: "p", text: "Der Hebel ist enorm: Wer früh die Marktwert-Gewinner erkennt, finanziert damit Stars und enteilt der Konkurrenz finanziell. Genau hier wird die Liga oft entschieden – nicht nur am Spieltag." },
        ],
      },
      {
        h2: "Das Grundprinzip: Angebot und Nachfrage",
        blocks: [
          { type: "p", text: "Der Marktwert eines Spielers richtet sich bei Kickbase vor allem nach der Nachfrage in der gesamten Community über alle Ligen hinweg – und nur indirekt nach der tatsächlichen Leistung. Kaufen viele Manager einen Spieler, steigt sein Wert; verkaufen oder listen viele ihn, fällt er." },
          { type: "tip", text: "Die wichtigste Trader-Heuristik lautet daher: antizyklisch handeln. Kaufe, wenn viele verkaufen (der Wert ist gedrückt), und verkaufe, wenn die Euphorie am größten ist." },
          { type: "p", text: "Marktwerte bewegen sich meist nicht in einem einzigen Sprung, sondern über mehrere Tage zunehmend. Geduld zahlt sich aus: Wer einen Aufwärtstrend früh erwischt, nimmt die volle Steigerung mit." },
        ],
      },
      {
        h2: "Timing: das 22-Uhr-Update und die besten Trading-Fenster",
        blocks: [
          { type: "p", text: "Kickbase aktualisiert die Marktwerte im Saison-Modus täglich gegen 22:00 Uhr. Dieser Zeitpunkt ist für Trader zentral – jede Wertänderung und jeder abgeschlossene Transfer wird hier wirksam." },
          { type: "p", text: "Besonders ertragreiche Fenster:" },
          { type: "ul", items: [
            "Saisonstart: Neuzugänge und Hype-Spieler steigen in den ersten Wochen oft stark.",
            "Direkt nach Anpfiff eines Spieltags: ab hier darfst du ins Minus gehen (mehr dazu gleich).",
            "Länderspiel- sowie Sommer- und Winterpausen: ruhige Phasen, in denen viele tief ins Minus gehen und vor dem nächsten Spieltag wieder verkaufen.",
          ] },
          { type: "p", text: "Ein Verkaufsangebot bleibt laut mehreren Fachquellen rund 72 Stunden stehen (offiziell nicht mit fester Stundenzahl bestätigt) – genug Puffer, um eine Entscheidung in Ruhe zu überdenken." },
        ],
      },
      {
        h2: "Ins Minus gehen: die 33%-Regel richtig nutzen",
        blocks: [
          { type: "p", text: "Nach dem Anpfiff des ersten Spiels eines Spieltags darfst du dein Budget ins Minus ziehen – in der Regel bis zum nächsten Spieltag. So kannst du mehr oder teurere Spieler kaufen und deren Marktwertsteigerung mitnehmen." },
          { type: "p", text: "Wie weit? Offiziell gilt die 33%-Regel: Dein Konto darf höchstens 33 Prozent deines angepassten Mannschaftswerts im Minus stehen. Der angepasste Mannschaftswert ist dein Mannschaftswert plus deinem (negativen) Kontostand." },
          { type: "tip", text: "Offizielles Beispiel von Kickbase: Mannschaftswert 100 Mio. €, Konto −10 Mio. € ergibt 100 + (−10) = 90 Mio. €. Davon 33 Prozent sind 30 Mio. € – dein Konto darf also nicht unter −30 Mio. € fallen." },
          { type: "p", text: "Die wichtigste Regel dabei: Zum Anpfiff des Spieltags (üblicherweise Freitag gegen 20:30 Uhr) muss dein Konto wieder im Plus sein. Stehst du beim Anpfiff im Minus, bekommst du für den GESAMTEN Spieltag keine Punkte. Plane deinen Rückkauf- bzw. Verkaufszeitpunkt also genau." },
        ],
      },
      {
        h2: "Welche Spieler du traden solltest",
        blocks: [
          { type: "ul", items: [
            "Neuzugänge (Sommer/Winter): steigen in den ersten Wochen meist deutlich – früh als Spekulation kaufen.",
            "Junge Talente und Rotationsspieler: schon eine 10-Minuten-Einwechslung am Wochenende kann den Marktwert in den Folgetagen anspringen lassen.",
            "Vertreter bei Verletzungen oder Sperren: fällt ein Stammspieler aus, ist sein Ersatz oft günstig und steigt mit Einsatzzeit; Rückkehrer aus langer Verletzung ziehen beim Comeback an.",
            "Unterbewertete Punkte-Lieferanten: Spieler, deren Punktpotenzial höher ist als ihr aktueller Marktwert.",
          ] },
          { type: "p", text: "Für die Bewertung helfen Rating- und Scouting-Tools sowie Marktwert-Verlaufsdaten (etwa von LigaInsider oder KickbaseNerd) – und natürlich LigaBase mit seinen Marktwert-Prognosen." },
        ],
      },
      {
        h2: "Die Gebots-Mechanik verstehen (warum dein Gebot platzt)",
        blocks: [
          { type: "p", text: "Entscheidend ist der Marktwert zum Transferzeitpunkt (dem 22-Uhr-Update), nicht zum Zeitpunkt deiner Gebotsabgabe. Steigt der Wert über Nacht über dein Gebot, wird es abgelehnt." },
          { type: "p", text: "Ein Gebot wird außerdem abgelehnt, wenn:" },
          { type: "ul", items: [
            "es unter dem aktuellen Marktwert liegt,",
            "ein anderer Manager mehr bietet (bei gleichem Gebot gewinnt, wer zuerst geboten hat),",
            "das Vereinslimit überschritten ist – Achtung: offene Gebote zählen mit!,",
            "dein Kader bereits voll ist.",
          ] },
          { type: "tip", text: "Konsequenz für die Praxis: Biete mit Aufschlag über dem Marktwert (Overpay), um das 22-Uhr-Risiko abzufedern, und behalte Vereinslimit und offene Gebote im Blick." },
          { type: "p", text: "Beim Verkauf bekommst du über ein Angebot mindestens 90 Prozent des Marktwerts; alternativ gibt es den Sofortverkauf an Kickbase zum aktuellen Marktwert." },
        ],
      },
      {
        h2: "Trading-Erfolge: Prämien für cleveres Handeln",
        blocks: [
          { type: "p", text: "Kickbase belohnt echten Markt-Gewinn mit einmaligen Geldprämien pro Spieler. Wichtig: Transfers unter Managern zählen dafür nicht, nur echter Gewinn am Markt." },
          { type: "ul", items: [
            "Bronzenes Händchen – 3 Mio. € Gewinn mit einem Spieler → 250.000 €",
            "Silbernes Händchen – 5 Mio. € Gewinn → 500.000 €",
            "Goldenes Händchen – 10 Mio. € Gewinn → 1 Mio. €",
            "Königstransfer – 25 Mio. € Gewinn → 2 Mio. €",
          ] },
          { type: "p", text: "Hinweis: Die offizielle Erfolgs-Übersicht nennt ausschließlich Geldprämien. Kursierende Angaben zu XP-Belohnungen oder einem zusätzlichen Glücklichen Händchen lassen sich an der offiziellen Quelle nicht bestätigen." },
        ],
      },
      {
        h2: "Risikomanagement und typische Anfängerfehler",
        blocks: [
          { type: "ul", items: [
            "Überstürztes Verkaufen: Marktwerte brauchen Tage zum Steigen – Panikverkäufe vernichten Gewinn.",
            "Anpfiff-Deadline ignorieren: spekulative Freitags-Käufe, die ins Minus drücken, riskieren Punkteverlust für den ganzen Spieltag.",
            "33%-Limit ohne Rückkaufplan ausreizen: Die Minus-Strategie funktioniert nur, wenn du rechtzeitig wieder ins Plus kommst.",
            "Vereinslimit und offene Gebote vergessen: Dein Gebot platzt trotz hoher Summe.",
          ] },
        ],
      },
      {
        h2: "Deine tägliche Trading-Routine",
        blocks: [
          { type: "ol", items: [
            "Nach dem 22-Uhr-Update Gewinner und Verlierer checken.",
            "Eigene Spieler beobachten – Trends und drohende Wertverluste früh erkennen.",
            "Kauf- und Verkaufskandidaten mit Marktwert-Prognosen abgleichen.",
            "Gebote mit Puffer setzen und das Vereinslimit prüfen.",
            "Vor dem Spieltag: Konto rechtzeitig ins Plus bringen.",
          ] },
        ],
      },
      {
        h2: "So hilft dir LigaBase beim Trading",
        blocks: [
          { type: "p", text: "LigaBase nimmt dir die Routine ab: Marktwert-Prognosen und 14-Tage-Trends zeigen dir die Gewinner von morgen, der Transfer- und Gebots-Advisor empfiehlt dir die sinnvolle Gebotshöhe, und der Teamwert-Vergleich seit Saisonstart zeigt dir, wie du gegenüber deiner Liga abschneidest – alles kostenlos und direkt im Browser." },
        ],
      },
    ],
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
