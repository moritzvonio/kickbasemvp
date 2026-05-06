/**
 * Mock-Twitter-Seed für die Reporter-PLATZHALTER-Source.
 *
 * Jeder Tweet startet mit [MOCK-DEMO] damit User in Live-Phase sofort sehen
 * dass es Test-Content ist. Wird durch echte Twitter/RSS-Quelle ersetzt
 * sobald rss.app oder Twitter API budget freigegeben ist.
 *
 * Reporter-Liste sind reale Bundesliga-Reporter; der Inhalt der Mock-Tweets
 * ist offensichtlich-fictional gekennzeichnet und nicht ihre echten Aussagen.
 */

export interface MockTweet {
  id: string;
  handle: string;
  text: string;
  createdAt: string;
  imageUrl?: string;
}

export const TRUSTED_REPORTERS = [
  { handle: "Plettigoal", name: "Florian Plettenberg (Sky)" },
  { handle: "cfbayern", name: "Christian Falk (Bild)" },
  { handle: "TobiAltschaeffl", name: "Tobias Altschäffl (Sport1)" },
  { handle: "S_Vollmert", name: "Sebastian Vollmert" },
  { handle: "FabrizioRomano", name: "Fabrizio Romano (Transfer-International)" },
  { handle: "RominaKickbase", name: "Romina (Kickbase Insider)" },
] as const;

const NOW = Date.now();
const HOURS_AGO = (h: number) =>
  new Date(NOW - h * 60 * 60 * 1000).toISOString();

export const MOCK_TWITTER_SEED: MockTweet[] = [
  {
    id: "mock-001",
    handle: "Plettigoal",
    text: "[MOCK-DEMO] Update zu Wirtz: Verlängerung in Leverkusen wahrscheinlich, Gespräche laufen positiv. Final decision next week. #Bayer04",
    createdAt: HOURS_AGO(2),
  },
  {
    id: "mock-002",
    handle: "Plettigoal",
    text: "[MOCK-DEMO] Kane mit Trainings-Pause heute, kleinere Wadenprobleme, Einsatz am Wochenende fraglich. #FCBayern",
    createdAt: HOURS_AGO(5),
  },
  {
    id: "mock-003",
    handle: "Plettigoal",
    text: "[MOCK-DEMO] Musiala kehrt nach Verletzung ins Mannschaftstraining zurück. Mögliche Kader-Rückkehr Samstag. #FCBayern",
    createdAt: HOURS_AGO(9),
  },
  {
    id: "mock-004",
    handle: "Plettigoal",
    text: "[MOCK-DEMO] BVB: Bellingham steht im Mannschaftstraining, fit für Samstag. #BVB",
    createdAt: HOURS_AGO(13),
  },
  {
    id: "mock-005",
    handle: "Plettigoal",
    text: "[MOCK-DEMO] Wolfsburg-Trainer bestätigt: Wind ist nicht im Kader für Sonntag — muskuläre Probleme. #VfL",
    createdAt: HOURS_AGO(20),
  },
  {
    id: "mock-006",
    handle: "cfbayern",
    text: "[MOCK-DEMO] Tah heute beim Abschlusstraining wieder voll dabei, Einsatz gegen Stuttgart wahrscheinlich. #Bayer04",
    createdAt: HOURS_AGO(3),
  },
  {
    id: "mock-007",
    handle: "cfbayern",
    text: "[MOCK-DEMO] Frimpong-Wechsel im Sommer? Premier-League-Klubs zeigen wieder verstärkt Interesse. #Bayer04",
    createdAt: HOURS_AGO(7),
  },
  {
    id: "mock-008",
    handle: "cfbayern",
    text: "[MOCK-DEMO] Boniface fällt für 2 Wochen aus, bestätigt der Verein. #Bayer04",
    createdAt: HOURS_AGO(11),
  },
  {
    id: "mock-009",
    handle: "cfbayern",
    text: "[MOCK-DEMO] Kimmich-Update: Gespräche zur Vertragsverlängerung gehen in entscheidende Phase. #FCBayern",
    createdAt: HOURS_AGO(15),
  },
  {
    id: "mock-010",
    handle: "cfbayern",
    text: "[MOCK-DEMO] Olise mit Kniefuß-Quetschung — auf jeden Fall Einsatz am Sonntag fraglich. #FCBayern",
    createdAt: HOURS_AGO(22),
  },
  {
    id: "mock-011",
    handle: "TobiAltschaeffl",
    text: "[MOCK-DEMO] Süle steht vor Comeback. Trainer plant frische Aufstellung mit ihm in der Zentrale. #BVB",
    createdAt: HOURS_AGO(4),
  },
  {
    id: "mock-012",
    handle: "TobiAltschaeffl",
    text: "[MOCK-DEMO] Hoffenheim-Coach setzt auf Kramaric von Beginn an, trotz Müdigkeitsproblemen unter der Woche. #TSG",
    createdAt: HOURS_AGO(8),
  },
  {
    id: "mock-013",
    handle: "TobiAltschaeffl",
    text: "[MOCK-DEMO] Brandt aus dem Lazarett zurück, voller Trainingsbetrieb. #BVB",
    createdAt: HOURS_AGO(12),
  },
  {
    id: "mock-014",
    handle: "TobiAltschaeffl",
    text: "[MOCK-DEMO] Stuttgart-Stürmer Undav stark in Form — Trainer erwägt 2-Stürmer-System gegen Bremen. #VfB",
    createdAt: HOURS_AGO(17),
  },
  {
    id: "mock-015",
    handle: "TobiAltschaeffl",
    text: "[MOCK-DEMO] RB Leipzig ohne Sesko ins Spiel gegen Mainz: Sprunggelenk-Probleme. #DieRotenBullen",
    createdAt: HOURS_AGO(23),
  },
  {
    id: "mock-016",
    handle: "S_Vollmert",
    text: "[MOCK-DEMO] Frankfurt: Marmoush wieder voll im Training. Skhiri allerdings angeschlagen. #SGE",
    createdAt: HOURS_AGO(6),
  },
  {
    id: "mock-017",
    handle: "S_Vollmert",
    text: "[MOCK-DEMO] Werder-Update: Ducksch und Burke werden Sonntag wieder eine Option sein. #Werder",
    createdAt: HOURS_AGO(10),
  },
  {
    id: "mock-018",
    handle: "S_Vollmert",
    text: "[MOCK-DEMO] Köln: Kainz mit Innenbandriss — Saison-Aus. Ersatzplan läuft. #effzeh",
    createdAt: HOURS_AGO(14),
  },
  {
    id: "mock-019",
    handle: "S_Vollmert",
    text: "[MOCK-DEMO] Mainz-Trainer plant Rotation: Nebel beim Spiel am Wochenende auf der Bank. #Mainz05",
    createdAt: HOURS_AGO(19),
  },
  {
    id: "mock-020",
    handle: "S_Vollmert",
    text: "[MOCK-DEMO] Augsburg holt Onyeka aus 2. Bundesliga zurück — Leihe von 1. März. #FCA",
    createdAt: HOURS_AGO(25),
  },
  {
    id: "mock-021",
    handle: "FabrizioRomano",
    text: "[MOCK-DEMO] Bayern Munich monitoring two top European left-backs ahead of summer window. Decision in May. Here we go? Not yet 🚨",
    createdAt: HOURS_AGO(1),
  },
  {
    id: "mock-022",
    handle: "FabrizioRomano",
    text: "[MOCK-DEMO] Borussia Dortmund close to renewal with key midfielder until 2028 — paper work in progress.",
    createdAt: HOURS_AGO(16),
  },
  {
    id: "mock-023",
    handle: "RominaKickbase",
    text: "[MOCK-DEMO] Spieltagstipp: Kane top-form, mein Captain-Pick. Wirtz-Marktwert vor Spike — jetzt holen lohnt. #Kickbase",
    createdAt: HOURS_AGO(3),
  },
  {
    id: "mock-024",
    handle: "RominaKickbase",
    text: "[MOCK-DEMO] Trading-Tipp: Bellingham Marktwert übertrieben hoch, jetzt verkaufen. Süle als Schnäppchen. #Kickbase",
    createdAt: HOURS_AGO(11),
  },
  {
    id: "mock-025",
    handle: "RominaKickbase",
    text: "[MOCK-DEMO] Aufstellungs-Hack: Wenn dein Stürmer angeschlagen, Tah als zentrale Defense für stabile Punkte. #Kickbase",
    createdAt: HOURS_AGO(18),
  },
  {
    id: "mock-026",
    handle: "Plettigoal",
    text: "[MOCK-DEMO] Stuttgart: Stiller wechselt nicht im Sommer — Vereinslegende plant 5-Jahres-Verlängerung. #VfB",
    createdAt: HOURS_AGO(28),
  },
  {
    id: "mock-027",
    handle: "cfbayern",
    text: "[MOCK-DEMO] Goretzka-Wechsel? Italienische Klubs laden ihn zu Gesprächen ein. Bayern offen für Verkauf. #FCBayern",
    createdAt: HOURS_AGO(30),
  },
  {
    id: "mock-028",
    handle: "TobiAltschaeffl",
    text: "[MOCK-DEMO] Mönchengladbach plant Castrop-Verkauf — Anfragen aus England und Spanien. #Borussia",
    createdAt: HOURS_AGO(33),
  },
  {
    id: "mock-029",
    handle: "S_Vollmert",
    text: "[MOCK-DEMO] Heidenheim-Coach im Interview: 'Beste-Mann gehört Pieringer — wir geben ihn nicht ab.' #FCH",
    createdAt: HOURS_AGO(36),
  },
  {
    id: "mock-030",
    handle: "FabrizioRomano",
    text: "[MOCK-DEMO] Bundesliga clubs eyeing two Premier League players for summer free transfers. Names to be confirmed. 🚨",
    createdAt: HOURS_AGO(40),
  },
];
