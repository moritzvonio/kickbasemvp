# PLAN 2026-07-06 – Go-to-Market Ligabase (Saison 26/27)

Status: ENTWURF zur Freigabe · Autor: Fable · Budget: ~0 € Media, nur Zeit + Rev-Share
Kampagnenfenster: **jetzt bis Saisonstart 28.08.2026** (1. Spieltag, WM-bedingt spät;
Kickbase-Kader-Updates erwartet ab Mitte/Ende Juli – d.h. die Community wacht in ~2 Wochen auf).

---

## 0. Executive Summary

Ligabase hat ein verifiziertes Alleinstellungsmerkmal (Konkurrenten-Cash-Analyse – kein
anderes Tool im Markt bietet das), einen frisch reparierten News-Layer, eine installierbare
PWA und praktisch null Traffic (15 Besucher/30 Tage). Die Konkurrenz ist kostenlos, betreibt
aber **kein einziges Affiliate-Programm** – wir können als erstes Tool der Nische mit
Creator-Rabattcodes arbeiten. Der Wachstumsplan steht auf drei Beinen:

1. **Produkt-Viralität**: Die Liga ist der Verteiler. Jeder User analysiert 9–17 Mitspieler –
   Share-Cards für die Liga-WhatsApp-Gruppe und öffentliche Liga-Snapshot-Links machen
   daraus einen Loop. (Fehlt heute komplett → 4 kleine Build-Slices.)
2. **Creator statt Ads**: 8 priorisierte Kontakte (validierte Reichweiten), Modell
   Affiliate-Code + Barter + fertige Content-Formate. Ziel: 2–3 Deals bis Mitte August.
3. **Content/SEO auf das Saisonstart-Fenster**: 6–8 Artikel + News-Frische + GSC.

Nord-Stern-Metrik: **aktivierte Ligen** (nicht User). Ziel bis 30.09.: 50 Ligen konservativ,
200 ambitioniert.

---

## 1. Ausgangslage (Stand 06.07.2026)

**Produkt-Assets**
- Wettbewerbs-Analyse mit Cash-/Max-Gebot-Schätzung aller Mitspieler – **Marktlücke,
  empirisch validiert** (eigener Kontostand als Anker, Modell-Validierungspanel live)
- News-Aggregator mit Spieler-Tagging (432 Spieler, self-healing Index) – LigaInsider-artig
- Top-50, Markt-Analysen, Trading-Insights, Bid-Advisor, Aufstellungs-Planer
- PWA installierbar (iOS + Android, Install-Prompts live seit heute)
- Blog-System (10 Posts angelegt), SEO-Grundgerüst (Sitemap, Schema, llms.txt), /admin-Analytics

**Harte Wahrheiten**
- Traffic: 15 Besucher/57 Views in 30 Tagen (immerhin: 8 davon organisch Google/Bing)
- Stripe-Preise nie konfiguriert → es gibt faktisch kein kaufbares Produkt
- Kein Share-, Referral- oder Invite-Feature
- Marke inkonsistent (Ligabase/LigaBase/betterbase/kickbasemvp)
- Kickbase-API ist inoffiziell → ToS-Risiko (Abschnitt 7)

**Timing (verifiziert)**
- 1. Spieltag: **Fr 28.08.2026** (Bayern – Stuttgart); 2. Liga schon ab 07.08.
- Kickbase-Saisonvorbereitung (Kader/Marktwerte): erwartet ab Mitte/Ende Juli
- → Die Zielgruppe kommt in den nächsten 2–4 Wochen aus der Sommerpause zurück

---

## 2. Positionierung & Messaging

**Hero-Claim (Arbeitsstand):**
> „Ligabase zeigt dir, was deine Liga wirklich bieten kann. Kontostand, Max-Gebot und
> Strategie jedes Mitspielers – berechnet aus den öffentlichen Liga-Daten."

- Der Hook ist die **Cash-Röntgenbrille**: emotional (Informationsvorsprung im Bieterkrieg),
  einzigartig, in einem Satz erklärbar, perfekt für Creator-Thumbnails („So viel Geld hat
  dein Liga-Rivale WIRKLICH").
- Sekundärnutzen: All-in-One-Companion (News, Top-Spieler, Trading) – „ein Tab statt fünf".
- Pflicht-Disclaimer überall: „Inoffizielles Fan-Projekt, nicht mit Kickbase verbunden."
- **Markenhygiene vor Launch**: einheitlich „Ligabase" (Schreibweise final entscheiden),
  Landing-Hero auf den Cash-Hook umstellen (heute generisch „smarteste Companion-App").

**Anti-Positionierung**: Wir treten NICHT gegen LigaInsider-Startelf-Prognosen an (88,6 %
Trefferquote, in der Kickbase-App integriert). Startelf = verlinken/ergänzen, nie Kernversprechen.

---

## 3. Pricing & Packaging (Entscheidungsvorlage)

Der Markt ist kostenlos-gewöhnt (Kickly, BaseXI, KickbaseNerd: alle gratis, spendenbasiert).
Deshalb: großzügiger Free-Tier, Pro nur für den Differenzierer, und ein sozialer Kaufmechanismus.

| Tier | Inhalt | Preis (Vorschlag) |
|---|---|---|
| **Free** | Liga-Dashboard, Top-50, News, Liga-Feed, Aufstellungs-Planer | 0 € |
| **Pro** | Wettbewerb (Cash/Max-Gebote aller Mitspieler), Bid-Advisor, Netto-Teamwert-Verlauf | **14,99 €/Saison** (Early-Bird bis 28.08.: 9,99 €) oder 2,99 €/Monat |
| **Liga-Pass** | Pro für ALLE Manager einer Liga | **29,99 €/Saison** |

**Warum Liga-Pass das Kernprodukt ist:** Einer zahlt, die ganze Liga ist freigeschaltet –
bei 10 Managern sind das 3 €/Person/Saison, das organisiert jede WhatsApp-Gruppe in
5 Minuten. Gleichzeitig zwingt es das Produkt in die Gruppe („wir haben jetzt alle Ligabase").
Psychologisch: Der Zahler ist meist der Liga-Admin/Nerd – unsere Kernpersona.

- Saison-Pricing vor Monats-Abo bewerben (Kickbase ist ein Saisonprodukt; Churn im Juni ist
  sonst strukturell).
- Anker: Kickbase Pro selbst kostet 26,99 €/Jahr – wir bleiben sichtbar darunter.
- Creator-Codes: 30 % Rabatt für Käufer + 30 % Rev-Share für den Creator (Stripe Promotion
  Codes, sauber trackbar). Kein Wettbewerber hat so etwas.

> **ENTSCHEIDUNG MOURICE:** Preise final, Rev-Share-Höhe, Early-Bird ja/nein.

---

## 4. Wachstumsmotor 1: Produkt-Viralität (Build-Slices)

Die Liga-WhatsApp-Gruppe ist der Verteiler mit dem höchsten Vertrauen und null Kosten.
Vier kleine Slices (je via /blueprint → /build, geschätzt je 0,5–1 Tag):

- **S1 – Share-Cards**: „Wettbewerb"-Ergebnis als Bild exportieren (OG-Image-Renderer
  existiert schon für /opengraph-image → wiederverwenden). Vorlagen: Spieltags-Ranking,
  Netto-Teamwert-Chart, „Max-Gebote deiner Liga" (mit dezentem ligabase.de-Branding).
  Ein Tap → WhatsApp.
- **S2 – Public Liga-Snapshot**: Read-only-Link zur Wettbewerbsansicht (tokenisiert,
  24h-Cache, ohne Login einsehbar). Empfänger sieht SEINE eigene Zeile hervorgehoben +
  CTA „Mit deinem Kickbase-Login siehst du alles live". Das ist der Conversion-Moment:
  Die Mitspieler sehen ihre eigenen (geschätzten) Kontostände – wer widerspricht, muss
  sich einloggen.
- **S3 – Referral light**: „Mitspieler eingeladen → +14 Tage Pro" (Invite-Link mit Liga-Kontext,
  Zählung über Login-Events derselben Liga-ID; kein komplexes System nötig).
- **S4 – Onboarding-TTW**: Nach Login in <60 s zum Wow: direkt in die Liga springen,
  Wettbewerb anteasern (Free sieht die Tabelle verpixelt/teilweise → Upgrade-Moment).
  Login-Vertrauen stärken („Passwort wird nicht gespeichert" prominenter, Link auf
  Erklärseite – die Kickbase-Login-Hürde ist die größte Conversion-Bremse der Nische).

Flankierend (kein Build): **GSC einrichten** (15 Min, DNS-Verifizierung) + Vercel-Analytics-
Events für Funnel-Schritte (Login → Liga geöffnet → Wettbewerb geöffnet → Share genutzt).

---

## 5. Wachstumsmotor 2: Creator-Kooperationen (Kernstück)

**Modell (Nullbudget-Stack):**
1. **Barter**: Creator + seine komplette Liga bekommen Pro/Liga-Pass gratis (Saison).
2. **Affiliate**: persönlicher Rabattcode (z.B. TOBI30) → 30 % Rabatt + 30 % Rev-Share.
3. **Content-Zulieferung**: Wir pitchen kein „bewirb unser Tool", sondern ein **Format**:
   - „Cash-Check": Creator zeigt live die geschätzten Kontostände seiner Liga – Drama garantiert
   - „Wer blufft beim Bieten?": Max-Gebot-Ranking vor dem Spieltag
   - Wöchentliche Netto-Teamwert-Grafik seiner Creator-Liga (automatisch von uns geliefert)
   Creator brauchen Content-Ideen mehr als Geld – unser Tool GENERIERT Stories.

**Priorisierte Kontaktliste (Reichweiten verifiziert, Juli 2026):**

| # | Wer | Reichweite | Warum / Ansatz |
|---|---|---|---|
| 1 | **Kickbase Guide (Tobias Sogorski)** | YT 40,4K + IG 26K + Twitch 3,3K | Größte unabhängige Reichweite, affiliate-erfahren (HOLY-Code). Ein Kontakt, drei Kanäle. Impressum-Mail. |
| 2 | **Fernschuss-Podcast** (Paul, Jakob, Tobi) | n/v, aber 2 laufende Rabattcode-Deals | Beweisen Offenheit für exakt unser Modell. Personelle Überschneidung mit #1 → als Paket pitchen. |
| 3 | **Kickbase Insider** | IG 13K, TikTok 6,6K | Offizieller Creator-Status, noch KEINE Tool-Partnerschaft – First-Mover-Chance. |
| 4 | **Kickbase Kis** | TikTok 13,2K + wö. Twitch | Multi-Plattform, offizieller Creator. |
| 5 | **Punktelieferanten-Podcast** | n/v, 3 Folgen/Woche | Höchste Frequenz der Nische = viele Werbeslots. |
| 6 | **r/kickbasemanager** | ~6.200 Member | Kein Deal, sondern Maker-Post (Abschnitt 6). |
| 7 | **Manager United (Niko Sameith)** | YT 5,3K + eigenes Tool | Cross-Promotion statt Affiliate (Nachbar-Tool). |
| 8 | **Der Kickbase-Quickie** | n/v, 82 Folgen | Treue Nischen-Hörerschaft, Test-Slot. |

Nicht ansprechen: STSB/„Rush to Glory"/Kickbase-Discord (alles Kickbase-eigene Kanäle),
Willy/Sidney (Gagen-Liga), Kickbaseking (inaktiv, evtl. exklusiv gebunden).

**Ansprache-Template (Mail, per Creator anpassen):**
> Betreff: Cash-Check für deine Kickbase-Liga – exklusives Feature für [Name]
>
> Hi [Name], ich bin Mourice, Indie-Entwickler von ligabase.de – dem einzigen
> Kickbase-Tool, das die Kontostände und Max-Gebote aller Liga-Konkurrenten berechnet
> (aus den öffentlichen Transferdaten, mathematisch validiert).
> Ich schaue deinen Content seit [x] und glaube, das gibt ein starkes Format:
> „Wie viel Geld haben meine Liga-Gegner WIRKLICH?" – live aufgedeckt.
> Mein Angebot: Saison-Vollzugang für dich + deine ganze Liga, ein persönlicher
> Rabattcode für deine Community (30 % Rabatt) und 30 % Beteiligung an jedem Kauf
> über deinen Code. Kein Skript, keine Vorgaben – teste es einfach mit deiner Liga.
> 10 Minuten Demo-Call oder direkt Zugang? [Link]

**Tracking**: Stripe Promotion Codes pro Creator + UTM-Links + /admin um Code-Umsätze
erweitern (Mini-Slice S5). Erfolgskriterium pro Deal: >100 Klicks, >20 Logins, >3 Käufe
im ersten Monat – sonst Deal nicht verlängern.

---

## 6. Wachstumsmotor 3: Community & Content

**Reddit r/kickbasemanager (~6.200 Member):**
- VORHER manuell Self-Promo-Regeln prüfen (Recherche kam nicht an die Sidebar).
- Format: ehrlicher Maker-Post zur Saisonvorbereitung („Ich habe ein Tool gebaut, das
  ausrechnet, wie viel Cash eure Liga-Gegner haben – so funktioniert die Mathematik
  dahinter [mit Screenshots]. Kostenlos testbar, Feedback willkommen"). Transparenz
  („bin der Entwickler") + Mehrwert im Post selbst (die Bonus-Regeln-Tabelle aus
  docs/kickbase-bonus-regeln.md ist Reddit-Gold) statt Link-Drop.
- AMA-Bereitschaft; Feature-Wünsche einsammeln = Bindung + Roadmap-Futter.

**Content-Serie Saisonstart (6–8 Artikel, KW 29–34):**
1. „Kickbase Startbudget & Saisonstart-Strategie 26/27" (Hauptkeyword der Phase)
2. „Wie viel Geld haben meine Kickbase-Mitspieler?" (unser Money-Keyword, führt zum Tool)
3. „Kickbase Bonus-Regeln 26/27: Tagesbonus, Punkteprämie, Erfolge" (aus unserer Doku –
   niemand sonst hat die verifizierten Zahlen)
4. „Marktwert-Reset zum Saisonstart erklärt"
5. „Die 50 wichtigsten Spieler zur neuen Saison" (verlinkt Top-50-Feature)
6. „Kickbase-Tools im Vergleich 2026" (ehrlich, inkl. Konkurrenz – rankt für alle Tool-Namen)
- Frage-Antwort-Struktur (FAQ-Schema existiert) → auch für KI-Suchen (llms.txt).
- News-Seite läuft als Frische-Signal automatisch mit (stündlich in der Sitemap).

**Flankierend**: GSC-Daten ab Woche 1 nutzen, um nachzuschärfen, was zieht.

---

## 7. Risiko Kickbase & Guardrails

Befund der Recherche: Kein Developer-Programm, ToS verbieten „data mining"/„excessive
load" (mit Ausnahme „necessary for proper use"), aber **seit Jahren geduldetes
Tool-Ökosystem ohne einen dokumentierten Abmahn-Fall**. Risiko: real, kalkulierbar, nicht akut.

Guardrails (teils erledigt, teils Pflicht vor Launch):
1. Disclaimer „inoffiziell, nicht mit Kickbase verbunden" auf Landing + Footer (prüfen/ergänzen)
2. API-Zugriff schonend halten: Caching (KV) aggressiv nutzen, keine Polling-Exzesse;
   Requests skalieren mit Ligen, nicht mit Seitenaufrufen
3. Keine Features, die ins Spiel EINGREIFEN (kein Auto-Bieten o.ä.) – nur Lesen + Rechnen
4. Vor der Creator-Welle: informelle, freundliche Mail an Kickbase Support/Partnerships
   („Fan-Projekt, wir halten uns an X/Y, Ansprechpartner bei Bedenken") – schafft
   dokumentierten guten Willen. **ENTSCHEIDUNG MOURICE: ja/nein** (Trade-off: schlafende
   Hunde vs. Absicherung)
5. Plan B, falls API-Zugang kippt: News-Layer + Content + Community sind API-unabhängig;
   E-Mail-Liste der User von Tag 1 an aufbauen (Kontaktkanal, den uns niemand nehmen kann)

---

## 8. Timeline bis Saisonstart (28.08.) + 4 Spieltage

| Woche | Fokus | Konkret |
|---|---|---|
| **KW 28** (06.–12.07.) | Fundament | Stripe-Preise + Liga-Pass live, GSC einrichten, Marken-/Landing-Refresh auf Cash-Hook, Disclaimer prüfen, S1 Share-Cards bauen |
| **KW 29** (13.–19.07.) | Loops + Erstkontakt | S2 Snapshot-Links + S4 Onboarding bauen, Kontakt #1–#4 anschreiben (individualisiert), Artikel 1+3 publizieren |
| **KW 30** (20.–26.07.) | Kickbase-Kader-Updates = Community wacht auf | Artikel 2+4+5, Creator-Follow-ups + Demo-Calls, S3 Referral + S5 Code-Tracking bauen |
| **KW 31** (27.07.–02.08.) | Beta mit Creator-Ligen | 1–2 Creator-Ligen live begleiten (Feedback-Schleife), Kontakt #5–#8, Kickbase-Mail (falls ja) |
| **KW 32–33** (03.–16.08.) | Soft-Launch | Reddit-Maker-Post (2. Liga läuft schon = Anlass), Creator-Content geht live (Saisonvorbereitungs-Videos), Early-Bird-Pricing kommunizieren |
| **KW 34–35** (17.–30.08.) | **Launch-Welle zum 1. Spieltag** | Creator-Codes pushen, Share-Cards prominent im Produkt, Artikel 6, News-Push |
| **Sept. (ST 1–4)** | Rhythmus + Iteration | Spieltags-Content-Takt, K-Faktor & Funnel messen, 2. Creator-Welle nach Daten, Retention-Fixes |

Aufwand Mourice: ~2–4 h/Woche (Creator-Kommunikation + Entscheidungen). Rest ist Claude-Build.

---

## 9. Metriken & Ziele (bis 30.09.2026)

| Metrik | Konservativ | Ambitioniert |
|---|---|---|
| Aktivierte Ligen (Wettbewerb geöffnet) | 50 | 200 |
| User | 300 | 1.500 |
| K-Faktor (User je Liga) | 2,0 | 4,0 |
| Woche-4-Retention (Spieltags-Wochen) | 25 % | 40 % |
| Zahlende (Pro/Liga-Pass) | 15 | 80 |
| Creator-Deals aktiv | 2 | 4 |

Funnel-Events (Vercel Analytics + /admin): Besuch → Login → Liga geöffnet → Wettbewerb
geöffnet → Share/Invite → Kauf. Wöchentlicher Blick, keine Dashboards-Bastelei.

---

## 10. Offene Entscheidungen (Mourice)

1. **Pricing**: Zahlen aus Abschnitt 3 ok? Early-Bird ja/nein?
2. **Rev-Share**: 30 % ok? (Alternative: 50 % im ersten Monat als Türöffner)
3. **Kickbase proaktiv kontaktieren**: ja/nein (Abschnitt 7.4)
4. **Markenschreibweise**: „Ligabase" oder „LigaBase" (dann überall konsistent)
5. **Absender der Creator-Mails**: du persönlich (empfohlen – Indie-Maker-Story zieht) oder Team-Alias

Nach Freigabe: Slices S1–S5 als eigene /blueprint-Pläne, Creator-Mails als Drafts zur Durchsicht.
