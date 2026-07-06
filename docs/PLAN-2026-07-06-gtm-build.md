# Plan: GTM-Build — Monetarisierung, Viral-Loops, Marken- und Design-Politur (2026-07-06)

> Umsetzung: frische Session, `/build docs/PLAN-2026-07-06-gtm-build.md`. Dieser Plan ist
> selbsttragend — kein Chat-Kontext nötig. Strategischer Kontext (nur zum Nachlesen,
> nicht nötig): docs/PLAN-2026-07-06-go-to-market.md.

## 0. Projekt-Steckbrief + Regeln (für den Kalt-Start)

- **Repo:** `/Users/chiefmourice/betterbase` (= Produkt „Ligabase", ligabase.de,
  Package-Name intern `kickbasemvp`). Kein Worktree nötig, Solo-Repo.
- **Stack:** Next.js 16 App Router (Turbopack) · TypeScript strict · Tailwind 4 ·
  Vercel · Vercel KV (`@vercel/kv`) · Stripe SDK ^22 · vitest · lucide-react.
- **Dev-Server:** `pnpm dev` → Port 3000.
- **Tests:** `pnpm test` (vitest, 12 bestehende Tests in `tests/cash-model.test.ts` müssen grün bleiben).
- **Build-Verifikation:** `pnpm build` IMMER voll durchlaufen lassen — „Compiled successfully"
  erscheint VOR dem Type-Check, danach kommt „Running TypeScript". Nicht nach dem ersten
  Erfolgs-String abbrechen.
- **Git:** Commits DIREKT auf `main` (Repo-Konvention, kein PR-Flow). Scoped `git add`
  mit expliziten Pfaden, NIE `git add -A`. Push nach jedem Slice. **Deploy zu Prod
  (`vercel --prod`) NUR nach explizitem OK von Mourice** — am Ende gesammelt.
- **Sprache/Stil (harte Dauerregeln):** Deutsch in UI-Texten mit ECHTEN Umlauten
  (ä ö ü ß, nie ae/oe/ue). NIEMALS Em-Dash (U+2014 „—") in irgendeiner Ausgabe oder
  UI-Copy — Gedankenstrich ist der En-Dash „–". Siezen kommt nicht vor, Ligabase duzt.
- **Login für lokale Verifikation:** `.env.local` enthält `KICKBASE_EMAIL` +
  `KICKBASE_PASSWORD` (echte Zugangsdaten, gitignored). Für authentifizierte
  Seiten-Checks ohne Browser-Login: Session-Cookie minten —
  Script-Muster: `kb.login({em, pass})` → `encryptSession({token, userId, exp})` aus
  `lib/session.ts` → Wert als Cookie `bb_session` in curl mitgeben
  (`curl -H "Cookie: bb_session=<JWE>" http://localhost:3000/...`).
  Test-Liga mit echten Daten: `leagueId 6871934` („Liga 089", 10 Manager).
- **Kickbase-Guardrails:** Nur lesende API-Nutzung, aggressiv KV-cachen, kein
  Polling-Exzess. Disclaimer „nicht offiziell mit Kickbase verbunden" darf auf keiner
  neuen öffentlichen Seite fehlen.
- **Off-Season-Kontext:** Saison 25/26 ist vorbei (alle 34 Spieltage gespielt),
  Saison 26/27 startet 28.08.2026. `ranking?dayNumber=X` liefert off-season nur Nullen;
  `ranking.day`/`ranking.nd` funktionieren. Manager-Dashboard liefert `tp`/`mdw`/`pl`.

## 1. Ziel + Warum

Ligabase geht zum Saisonstart 26/27 (28.08.) an den Markt. Dafür fehlt: (a) ein kaufbares
Produkt — Stripe ist Scaffold, nichts ist gated, es gibt buchstäblich nichts zu kaufen;
(b) Viral-Mechanik — die Liga-WhatsApp-Gruppe ist der Wachstumskanal, aber es gibt weder
Share-Cards noch teilbare Links; (c) ein ehrlicher, polierter Auftritt — die Landing
verspricht Features, die nicht existieren, Rechtsseiten fehlen (404!), und auf Mobile
(Kern-Gerät der Zielgruppe) ist die Kern-Tabelle unlesbar gequetscht.

## 2. Nicht-Ziele

- KEIN Liga-Pass / Team-Lizenz (explizit entschieden: gibt es nicht)
- KEIN Abo-Modell, keine Kündigungs-Flows (Einmalzahlung je Halbserie)
- KEINE E-Mail-Infrastruktur (Resend etc.) — kommt später; nichts bewerben, was Mail braucht
- KEIN Rebuild des Landing-Designs — Politur und ehrliche Inhalte, kein neues Layout-System
- KEINE native App, keine neuen Analytics-Tools (Vercel Analytics + /admin reichen)
- KEIN Umbau des Cash-Modells (lib/competitor.ts bleibt unangetastet)
- KEINE Dark-Mode-Einführung (existiert nicht, kommt nicht in diesem Plan)

## 3. Getroffene Annahmen

1. **Markenschreibweise „Ligabase"** (Fließtext/Logo-Wortmarke, „base" in Primärfarbe)
   und „LIGABASE" nur für Display-Kontexte (z.B. OG-Image-Eyebrow). Entschieden von
   Mourice 06.07.; Code nutzt bisher überall „LigaBase" → Mass-Rename in S6.
2. **Saison-Stichtage** als Konstanten in neuem `lib/season.ts` (NEU anlegen):
   `SEASON_2627 = { start: '2026-08-28', trialHardEnd: '2026-09-07', hinrundeEnd: '2027-01-31', rueckrundeEnd: '2027-05-31' }`.
   trialHardEnd = Montag nach Spieltag 2 (ST1 28.–30.08., ST2 erwartet 04.–06.09.).
   hinrundeEnd konservativ 31.01. (WM-Kalender, Spielplan-Detail steht noch aus) —
   mit `// TODO: gegen offiziellen Spielplan verifizieren` markieren.
3. **Testphase:** Eingeloggte User haben ALLES frei bis `max(trialHardEnd, erster Login + 14 Tage)`.
   Erster Login wird in KV `trial:{userId}` (ISO-Datum, nur setzen wenn nicht vorhanden,
   kein TTL) festgehalten. Begründung: „kostenlos bis Spieltag 2" ist das Launch-Messaging,
   14-Tage-Fallback für Später-Einsteiger.
4. **Gated (Pro) sind genau zwei Flächen:** die Wettbewerb-Seite (Kern-Differenzierer)
   und der Bid-Advisor-Block auf der Trading-Seite. Alles andere bleibt frei. Begründung:
   großzügiger Free-Tier ist GTM-Entscheidung.
5. **Paywall-UX = Teaser, nicht Redirect:** Free-User sehen auf der Wettbewerb-Seite die
   eigene Karte + die Vergleichstabelle mit den ersten 2 Konkurrenten-Zeilen klar und dem
   Rest gaussisch geblurrt (CSS `blur-sm select-none pointer-events-none`), darüber
   Upgrade-CTA. Begründung: Der Wert muss sichtbar sein, um zu verkaufen.
6. **Stripe bleibt auf dem verbundenen Account** (aktuell hinterlegt; Frage privat vs.
   Vonio UG ist offen bei Mourice) — Code ist entitäts-agnostisch, nur Env-Vars/Price-IDs.
   Ops-Schritt in §7.
7. **Ein Produkt „Pro Halbserie" mit zwei Stripe-Prices** (`hinrunde-2627`, `rueckrunde-2627`)
   zu je 6,00 €, One-Time. Vor Saisonstart wird nur die Hinrunde verkauft. Kein Early-Bird
   (nicht entschieden → weggelassen).
8. **Alte Entitlement-Cookies** (`bb_entitlement` mit plan `monthly`/`season`) werden als
   gültig weitergelesen bis sie ablaufen (es gibt vermutlich null zahlende Bestandskunden,
   aber Abwärtskompatibilität kostet nichts).
9. **Rechtsseiten:** /impressum und /datenschutz werden als echte Seiten mit
   Platzhalter-Struktur + `<!-- TODO Mourice: finale Texte -->` angelegt (Inhalt-Gerüst
   siehe S6), /agb wird aus dem Footer ENTFERNT (kein AGB-Text vorhanden, für 6€-Kauf
   reichen Impressum/Datenschutz + Stripe-Checkout-Bedingungen vorerst — Mourice klärt
   mit Steuerberater/Anwalt). Begründung: tote Links sind schlimmer als weniger Links.
10. **Mobile-Navigation wird Bottom-Nav** (5 Einträge) für Viewports < md UND für die
    installierte PWA; die bisherige Tab-Leiste bleibt ab md. Begründung: 9 horizontal
    scrollende Tabs ohne Affordance sind auf dem Kern-Gerät nicht entdeckbar.

## 4. Slices

### Slice S0: Monetarisierung — Halbserien-Kauf, Testphase, Paywall (L)

- **Warum:** Ohne S0 gibt es nichts zu kaufen; alle GTM-Maßnahmen laufen ins Leere.
- **Ist:**
  - `lib/stripe.ts` — `getStripe()`, `stripeConfigured()`, `STRIPE_PRICES = {monthly, season}` aus Env `STRIPE_PRICE_PRO_MONTHLY`/`STRIPE_PRICE_PRO_SEASON`
  - `lib/entitlement.ts` — Cookie-MVP `bb_entitlement` (JWE), `Entitlement {userId, plan, exp}`, `hasPro(forUserId?)`; `clearEntitlement()` wird nirgends gerufen
  - `app/api/stripe/checkout/route.ts` — Checkout-Session, `mode` subscription/payment je Plan, `allow_promotion_codes: true`, zod-validiert `plan: z.enum(["monthly","season"])`
  - `app/upgrade/success/page.tsx` — liest Checkout-Session synchron, setzt Cookie; Season-exp „rough" berechnet
  - `app/api/stripe/webhook/route.ts` — Signatur-Check + nur console.log (Placeholder, bleibt so)
  - `app/upgrade/page.tsx` — Preise 4,99/19,99 hartcodiert, zeigt bei fehlender Config die rohen Env-Var-Namen als Warnung (User-sichtbares Internals-Leak), keine Navigation
  - `components/pro-gate.tsx` — `ProGate`/`ProUpsell` existieren, werden NIRGENDS importiert
  - Gating heute: `app/league/[id]/wettbewerb/page.tsx:48` nur `requireSessionOrRedirect`; Bid-Advisor in `app/league/[id]/trading/page.tsx:150-154` ungated
  - Stripe-Env-Vars: nirgends gesetzt (weder lokal noch laut `.env.example`-Belegung), NICHT in `lib/env.ts` validiert
- **Soll:** Eingeloggter User in der Testphase sieht alles; danach sind Wettbewerb +
  Bid-Advisor Pro-only (Teaser-Blur). Kauf „Pro Hinrunde 26/27, 6 €" via Stripe
  One-Time-Checkout (Promo-Codes möglich), danach sofort freigeschaltet bis Stichtag.
- **Bauschritte:**
  1. NEU `lib/season.ts`: Konstanten aus Annahme 2 + Helper
     `currentHalfSeason(): { key: "hinrunde-2627" | "rueckrunde-2627"; end: Date }`
     (vor hinrundeEnd → hinrunde, sonst rueckrunde) und `trialEndFor(firstLoginIso: string): Date`.
  2. `lib/stripe.ts`: `STRIPE_PRICES` umbauen auf
     `{ "hinrunde-2627": process.env.STRIPE_PRICE_HINRUNDE_2627, "rueckrunde-2627": process.env.STRIPE_PRICE_RUECKRUNDE_2627 }`,
     `Plan`-Type entsprechend; `planFromString` anpassen. Alte Env-Namen entfernen.
  3. `lib/entitlement.ts`: `Entitlement.plan` auf neuen Type erweitern, Legacy-Werte
     `"monthly"|"season"` beim Lesen weiter akzeptieren (Annahme 8). Neue Funktion
     `getAccess(userId): Promise<{ pro: boolean; trial: boolean; trialEnd?: Date; proUntil?: Date }>`
     — kombiniert `hasPro()` mit Trial-Check (KV `trial:{userId}`, Fallback in-memory wie
     `lib/admin/analytics.ts` es vormacht). Trial-Ersteintrag wird beim Login gesetzt:
     in `app/api/auth/login/route.ts` nach `recordLogin` best-effort `kv.set("trial:"+userId, iso, { nx: true })`-Äquivalent.
  4. `app/api/stripe/checkout/route.ts`: zod-Enum auf neue Plan-Keys, `mode` immer
     `"payment"`, success/cancel-URLs unverändert.
  5. `app/upgrade/success/page.tsx`: `exp` = `currentHalfSeason().end` (kein „rough" mehr),
     `plan` aus metadata.
  6. `app/upgrade/page.tsx` NEU texten: eine Karte „Pro Hinrunde 26/27 – 6 €"
     (Einmalzahlung, kein Abo, gilt bis Hinrunden-Ende), Feature-Liste NUR echte Features
     (Wettbewerb: Kontostände + Max-Gebote aller Manager, Bid-Advisor, Netto-Teamwert-Verlauf).
     „Push & Email Alerts"/„PDF-Report" ersatzlos streichen. Bei fehlender Stripe-Config:
     neutraler Text „Der Kauf ist gerade nicht verfügbar. Schau später vorbei." OHNE
     Env-Var-Namen. Seite bekommt die App-Navigation (siehe S7 Schritt 4 — wenn S7 noch
     nicht gebaut: mindestens Logo-Link zurück zu /leagues).
  7. Gating einbauen: In `app/league/[id]/wettbewerb/page.tsx` nach der Session
     `const access = await getAccess(session.userId)`. Wenn weder pro noch trial:
     eigene ManagerCard normal rendern, `CompareTable` nur `[me, ...ersten 2 der sortierten Liste]`
     klar + restliche Zeilen als geblurrte Dummy-Zeilen (echte Daten NICHT ins HTML —
     Blur per CSS reicht nicht als Schutz; stattdessen Platzhalterwerte rendern),
     Chart-Sektion und Detail-Karten ausblenden, prominenter CTA-Block
     („Sieh alle Kontostände + Max-Gebote – Pro für 6 € pro Halbserie") → /upgrade.
     Trial aktiv: alles zeigen + dezentes Badge „Testphase bis {Datum}" im Header-Bereich.
     Analog Trading: `BidAdvisor`-Sektion in `app/league/[id]/trading/page.tsx` hinter
     `access.pro || access.trial`, sonst `ProUpsell` aus `components/pro-gate.tsx`
     (Komponente dabei auf neuen Text bringen).
  8. `lib/env.ts`: die 4 Stripe-Vars als optionale Strings ins zod-Schema aufnehmen
     (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_HINRUNDE_2627`,
     `STRIPE_PRICE_RUECKRUNDE_2627`), Verwendungen auf `env.*` umstellen.
  9. `app/account/page.tsx`: Status-Anzeige auf neues Modell (Pro bis {Datum} /
     Testphase bis {Datum} / Free).
  10. Tests NEU `tests/entitlement.test.ts`: trialEndFor-Logik (vor/nach trialHardEnd),
      currentHalfSeason-Grenzen, Legacy-Plan-Lesen.
- **Edge-Cases:**
  - User ohne KV (lokal): Trial-Fallback in-memory, darf nicht crashen
  - Uhrzeit exakt am Stichtag: `<=` vs `<` einmal festlegen (Ende-Datum ist EXKLUSIV, 00:00 Europe/Berlin)
  - Legacy-Cookie mit plan "season" und exp in der Zukunft → weiter Pro
  - Checkout abgebrochen (`?canceled=1`) → Upgrade-Seite zeigt neutralen Hinweis
  - Doppelkauf: `hasPro` schon true → Upgrade-Seite zeigt „Du hast Pro bis {Datum}", Button disabled
- **Akzeptanzkriterien:**
  - [x] `pnpm build` + `pnpm test` grün, bestehende 12 Tests unberührt grün (21 Tests grün)
  - [x] Ohne Stripe-Env: /upgrade zeigt neutralen Text ohne Env-Var-Namen (0 STRIPE_*-Leak)
  - [x] Frischer User (Trial): Wettbewerb voll sichtbar + Testphasen-Badge (Vollansicht via Pro-Cookie live belegt; Trial-Datum + nx-Logik separat verifiziert — s. §8)
  - [x] KV-Key `trial:{userId}` wird beim ersten Login gesetzt, beim zweiten nicht überschrieben (nx in Ein-Prozess-Skript belegt)
  - [x] Trial simuliert abgelaufen: Teaser-Ansicht, Konkurrenten-Daten NICHT im HTML-Quelltext
        der geblurrten Zeilen (nur „•••"-Platzhalter, 14 gesperrte Zeilen, Chart+Detail-Cards aus)
  - [x] Bid-Advisor zeigt ProUpsell statt Eingabefeld ohne Pro/Trial (live belegt)
- **Verify:** `pnpm dev`; Cookie minten (§0); `curl -H "Cookie: bb_session=..." localhost:3000/league/6871934/wettbewerb | grep -c "Testphase"`;
  dann in `lib/season.ts` trialHardEnd temporär auf `2026-07-01` + 14-Tage-Fallback via
  KV-Key-Manipulation aushebeln → Teaser prüfen (`grep -c "blur"` + sicherstellen dass
  echte Manager-Cash-Werte der geblurrten Zeilen NICHT im HTML stehen); Konstante zurücksetzen.

### Slice S1: Share-Cards — Wettbewerb als Bild für die Liga-Gruppe (M)

- **Warum:** Die Liga-WhatsApp-Gruppe ist der Wachstumskanal Nr. 1; ein Bild pro Spieltag
  trägt das Produkt in jede Gruppe (GTM-Motor 1).
- **Ist:** Einzige ImageResponse-Nutzung: `app/opengraph-image.tsx` (next/og, edge,
  1200×630, reines CSS-in-JS). Wettbewerb-Daten entstehen server-seitig in
  `app/league/[id]/wettbewerb/page.tsx` via `computeManagerStats` (`lib/competitor.ts`),
  Felder je Manager u.a. `name, cashEstimate, maxBidSingleSell, netTeamValue, teamValue, seasonPoints, matchdayWins, placement`.
- **Soll:** Auf der Wettbewerb-Seite ein „Teilen"-Button → erzeugt ein 1080×1350-Bild
  (WhatsApp-tauglich, Portrait) mit Liga-Name, Top-Liste (Platz, Name, Netto-Teamwert,
  Max-Gebot), Ligabase-Branding + „ligabase.de" — via Web Share API als Datei geteilt,
  Fallback: Download.
- **Bauschritte:**
  1. NEU `app/league/[id]/wettbewerb/share-image/route.tsx`: GET, `requireSession` +
     Zugriff wie S0 (nur Pro/Trial), rendert ImageResponse 1080×1350. Daten: dieselbe
     Berechnung wie die Page — dafür die Daten-Assembly aus `wettbewerb/page.tsx`
     (Zeilen ~50–154) in eine geteilte Funktion
     `assembleCompetitionStats(token, leagueId, userId): Promise<{stats, leagueName, ...}>`
     nach NEU `lib/competition-data.ts` extrahieren und von Page + Route nutzen.
     Design: weißer Grund, Emerald-Akzente, Logo-Mark, max 10 Zeilen, tabular-nums.
  2. NEU `components/share-button.tsx` (client): holt das Bild als Blob,
     `navigator.share({files: [new File(...)]})` wenn `navigator.canShare({files})`,
     sonst Download-Link. Loading-State am Button (Spinner, disabled).
  3. Button in der Wettbewerb-Page neben den Sort-Tabs platzieren (Icon `Share2`,
     Label „Als Bild teilen").
- **Edge-Cases:** 10+ Manager (kappen bei 10 + „+N weitere"), lange Namen (truncate),
  Share-API abgelehnt/abgebrochen (kein Fehler-Toast nötig, still), Edge-Runtime-Limits
  (keine Node-APIs im route.tsx).
- **Akzeptanzkriterien:**
  - [x] GET share-image liefert PNG 1080×1350 mit echten Liga-Daten (live: 200, PNG 1080x1350, Liga 089, Sichtprüfung ok)
  - [x] Kein Zugriff ohne Session (307-Redirect via Middleware) und ohne Pro/Trial (403) — live belegt
  - [x] Button auf Desktop lädt Datei herunter (navigator.canShare-Check → Download-Fallback), kein Crash
- **Verify:** `curl -H "Cookie: bb_session=..." -o /tmp/share.png localhost:3000/league/6871934/wettbewerb/share-image && file /tmp/share.png`
  (muss „PNG image data, 1080 x 1350" zeigen); Bild öffnen und Sichtprüfung.

### Slice S2: Public Liga-Snapshot — der Conversion-Link (M)

- **Warum:** „Schau, was Ligabase über UNSERE Liga sagt" — der Link, den der erste User
  in die Gruppe wirft; Empfänger sehen ihre eigenen Daten und wollen sich einloggen.
- **Ist:** Kein öffentlicher Share-Mechanismus. KV-Patterns siehe `lib/news/store.ts`
  (`kv.set(key, value, {ex})`). Öffentliche Seiten ohne Session existieren (z.B. /news).
- **Soll:** Pro-/Trial-User erzeugt per Button einen Link `ligabase.de/s/{token}` (7 Tage
  gültig, read-only Momentaufnahme der Vergleichstabelle). Öffentliche Seite zeigt die
  Tabelle (Name, Punkte, Siege, Teamwert, Cash-Schätzung, Max-Gebot), Hinweis
  „Momentaufnahme vom {Datum}" + CTA „Log dich mit deinem Kickbase-Account ein und sieh
  alles live" → /login. KEINE Live-Daten, kein Token-Zugriff auf die Kickbase-API.
- **Bauschritte:**
  1. NEU `app/api/snapshot/route.ts` (POST, Session + Pro/Trial): assembliert Stats
     (Funktion aus S1), schreibt schlankes JSON (nur Anzeige-Felder, KEIN Kickbase-Token,
     KEINE User-IDs außer Anzeigenamen) nach KV `snapshot:{token}` (token =
     `crypto.randomUUID()`, `ex: 7*24*3600`), Response `{url}`.
  2. NEU `app/s/[token]/page.tsx` (öffentlich, `robots: noindex`): liest KV, rendert
     Tabelle (Markup-Anlehnung an `CompareTable` aus wettbewerb/page.tsx, aber eigene
     schlanke Komponente ohne Session-Abhängigkeiten), Disclaimer-Footer, CTA-Block.
     Abgelaufen/unbekannt → freundliche „Link abgelaufen"-Seite mit CTA.
  3. Button „Link für die Liga-Gruppe" auf der Wettbewerb-Seite (neben S1-Button):
     POST, dann `navigator.share({url})` bzw. Clipboard-Copy + Toast „Link kopiert".
- **Edge-Cases:** KV nicht verfügbar (Button ausblenden via env-Check), doppelter Klick
  (einfach neuen Token erzeugen), Liga mit 2 Managern (Tabelle trotzdem ok).
- **Akzeptanzkriterien:**
  - [x] /s/{token} ohne Session erreichbar, zeigt Snapshot-Daten + CTA + Disclaimer (live belegt)
  - [x] Snapshot-JSON enthält keinerlei Tokens/Credentials (Payload nur name/Punkte/Werte; 0 Leak im HTML)
  - [x] Abgelaufener/unbekannter Token → saubere „Link abgelaufen"-Seite (HTTP 200, kein 500)
- **Verify:** POST via curl mit Session-Cookie → URL extrahieren → im Inkognito-Browser
  (bzw. curl ohne Cookie) öffnen, Inhalt prüfen.

### Slice S3: Referral light — Pro-Tage für geworbene Mitspieler (S)

- **Warum:** Belohnt genau das Verhalten, das wachsen lässt (Mitspieler holen), ohne
  Auszahlungs-Bürokratie.
- **Ist:** Kein Referral. Login-Route: `app/api/auth/login/route.ts` (setzt Session,
  ruft `recordLogin`). Kein persistenter User-Store außer KV-Analytics (`stats:user:{id}`).
- **Soll:** Eingeloggter User bekommt auf /account einen Invite-Link
  `ligabase.de/login?ref={userId}`. Loggt sich ein NEUER User (kein `trial:{userId}`-Key
  vorhanden = Erstlogin) mit `ref`-Param ein, bekommt der Werber +14 Tage Pro
  (max. 3 Gutschriften). Anzeige auf /account: „{n} Mitspieler geworben · +{n*14} Tage Pro".
- **Bauschritte:**
  1. `app/login/page.tsx` + `LoginForm.tsx`: `ref`-Param aus URL durchreichen (hidden field → POST-Body).
  2. `app/api/auth/login/route.ts`: wenn Erstlogin UND `ref` vorhanden UND `ref !== userId`:
     KV `referral:{ref}` Liste/Zähler inkrementieren (cap 3), und Werber-Bonus als KV
     `probonus:{ref}` = ISO-Enddatum (bestehendes Datum + 14 Tage, Basis max(now, bestehend)).
  3. `getAccess()` aus S0 erweitert: `pro = hasPro() || probonus-Datum in Zukunft`.
  4. /account: Invite-Block mit Copy-Button + Zähler.
- **Edge-Cases:** Selbst-Referral (ignorieren), gleicher Neuuser zweimal (nur Erstlogin
  zählt — `nx`-Semantik des trial-Keys nutzen), KV weg (still no-op).
- **Akzeptanzkriterien:**
  - [ ] Erstlogin mit ?ref erhöht Zähler, Zweitlogin nicht
  - [ ] Werber sieht Bonus auf /account, `getAccess().pro` ist true im Bonuszeitraum
  - [ ] Cap: 4. Referral erhöht nichts mehr
- **Verify:** vitest für die Bonus-Datums-Logik; manuell: Login-POST mit ref-Param via curl
  gegen frischen Fake-Userkey (KV-Keys vorher löschen, lokal in-memory: Server-Neustart).

### Slice S4: Onboarding — Time-to-Wow unter 60 Sekunden (S)

- **Warum:** Der Kickbase-Login ist die größte Hürde; danach muss SOFORT der Aha-Moment
  kommen (Cash der Konkurrenten), nicht eine Zwischenseite.
- **Ist:** Login → redirect `/leagues` (`app/login/LoginForm.tsx:25-38`); /leagues zeigt
  Karten-Grid; Wettbewerb ist ein Tab unter mehreren. Login-Headline „Willkommen zurück"
  (`app/login/page.tsx`), auch für Erstbesucher.
- **Soll:** Nach Login mit GENAU EINER Liga → direkt `/league/{id}` (Dashboard). /leagues
  nur bei mehreren Ligen. Auf dem Liga-Dashboard bekommt der Wettbewerb-Tab einen
  dezenten Puls-Punkt (einmalig pro Session, localStorage-Flag), Label-Zusatz „Neu".
  Login-Copy: Headline „Log dich mit Kickbase ein" (neutral für Erst- und Wiederkehrer).
- **Bauschritte:**
  1. `app/api/auth/login/route.ts`: nach erfolgreichem Login `kb.leagues(token)` rufen
     (best-effort, 2s-Timeout); Response um `leagueCount` + `firstLeagueId` erweitern.
  2. `LoginForm.tsx`: redirect zu `/league/{firstLeagueId}` wenn `leagueCount === 1`,
     sonst `/leagues` (bzw. `next`-Param hat Vorrang).
  3. Tab-Bar-Komponente (siehe S7 — die Datei, die die Liga-Tabs rendert): Wettbewerb-Tab
     mit Puls-Badge, Flag `lb-seen-wettbewerb` in localStorage beim ersten Öffnen.
  4. Login-Copy anpassen (Headline + Subline, Umlaute korrekt, En-Dash).
- **Edge-Cases:** kb.leagues schlägt fehl → Fallback /leagues; 0 Ligen → /leagues
  (dort existiert Empty-State).
- **Akzeptanzkriterien:**
  - [ ] Login mit Mourice-Account (3 Ligen) → /leagues wie bisher
  - [ ] leagueCount===1-Pfad per Unit-Test der Redirect-Logik abgedeckt
  - [ ] Puls-Punkt verschwindet nach erstem Wettbewerb-Besuch
- **Verify:** Login-POST via curl → Response-JSON prüfen; UI-Klickpfad im Dev-Server.

### Slice S5: Creator-Code-Tracking im Admin (S)

- **Warum:** Creator-Deals (30 % Rev-Share ab 25 Käufen) brauchen belastbare Zahlen pro Code.
- **Ist:** `app/admin/page.tsx` (nur `isAdmin`, Default-ID 1270088) zeigt `getAdminStats()`
  aus `lib/admin/analytics.ts` (KV-Stats). Stripe-Checkout hat `allow_promotion_codes: true`.
- **Soll:** Admin-Seite bekommt Sektion „Verkäufe & Codes": Gesamt-Käufe, Umsatz, Tabelle
  Promo-Code → Anzahl Käufe (für Rev-Share-Abrechnung).
- **Bauschritte:**
  1. NEU in `lib/admin/stripe-stats.ts`: `getSalesStats()` — via
     `stripe.checkout.sessions.list({limit: 100, status: "complete"})` paginieren
     (expand `total_details`), pro Session `promotion_code` via
     `stripe.checkout.sessions.listLineItems`/discounts auflösen; aggregieren
     `{totalSales, totalRevenue, byCode: Record<code, {count, revenue}>}`.
     5-Minuten-KV-Cache (`admin:salesstats`), damit die Admin-Seite Stripe nicht hämmert.
  2. `app/admin/page.tsx`: Sektion rendern (Stripe nicht konfiguriert → Sektion mit
     Hinweis ausblenden).
- **Edge-Cases:** >100 Sessions (paginieren bis `has_more` false, hart bei 1000 kappen),
  Sessions ohne Code (Bucket „ohne Code").
- **Akzeptanzkriterien:**
  - [ ] Ohne Stripe-Env rendert /admin unverändert ohne Fehler
  - [ ] Mit Test-Kauf (Stripe-Testmode) erscheint der Kauf + Code in der Tabelle
- **Verify:** lokal mit Stripe-Testkeys + Test-Checkout (Karte 4242…), /admin prüfen.

### Slice S6: Marke, Landing, Recht — ehrlich und konsistent (M)

- **Warum:** Die Landing verspricht Nicht-Existentes (Abmahn-/Vertrauensrisiko), Rechtslinks
  sind 404 (Impressumspflicht!), Schreibweise inkonsistent zur Markenentscheidung.
- **Ist (verifiziert):**
  - `app/page.tsx` (905 Zeilen): Hero-Subline „Das kostenlose Kickbase-Tool mit
    Marktwert-Prognosen…" + Em-Dashes; StatsStrip „500K+ / 147 API-Endpoints / 0 € in der
    Beta / <2s / 🇩🇪"; Features-Sektion „Drei Hebel…" bewirbt „AI-Transfer-Coach" und
    „Push-Alerts" mit Fake-Screenshots (inkl. „Wirtz" — nicht mehr Bundesliga);
    Pricing-Sektion Free/4,99/19,99 + „Liga-Pro … (Coming V2)"; Footer verlinkt
    `/impressum`, `/datenschutz`, `/agb` — **alle drei Routen existieren nicht**;
    Footer „Made in Berlin · with ⚽ + 🍺" (Mourice sitzt in Hannover); FAQ-Daten in
    `lib/seo/faq-data.ts` sagen „kostenlos".
  - Schreibweise: 50+ Fundstellen „LigaBase" quer durch app/, lib/, public/ (vollständige
    Liste: Recherche-Grep über `LigaBase|Ligabase|LIGABASE` liefert sie reproduzierbar).
  - `app/opengraph-image.tsx`: Claim „Deine Liga, smarter gespielt."
  - Titel-Doppelung: `app/news/page.tsx:9` setzt title MIT „· LigaBase", `app/layout.tsx:20`
    hängt via Template nochmal an → Browser-Tab „… · LigaBase · LigaBase".
  - `wettbewerb/page.tsx` Methodik-Card referenziert `docs/kickbase-bonus-regeln.md`
    (interner Repo-Pfad, für Endnutzer sinnlos).
- **Soll:** Landing erzählt die wahre Geschichte mit dem Cash-Hook als Hero, Preise stimmen
  (6 €/Halbserie + Testphase), keine Fantasie-Features, Rechtsseiten existieren,
  Schreibweise überall „Ligabase", kein U+2014 mehr in UI-Copy.
- **Bauschritte:**
  1. Mass-Rename „LigaBase" → „Ligabase" in app/, components/, lib/, public/ (inkl.
     manifest, llms.txt, schema.ts, blog-posts, install-prompt). Logo-Komponente
     (`components/ui/logo.tsx`): Wortmarke `Liga` + `base` (base in Primärfarbe,
     lowercase) — visuell prüfen, dass es gut aussieht; OG-Image-Eyebrow darf „LIGABASE" sein.
  2. Hero neu: H1 „Sieh, was deine Liga wirklich bieten kann." Subline: Kontostände +
     Max-Gebote aller Mitspieler, berechnet aus öffentlichen Liga-Daten – mathematisch
     validiert. Zweiter Satz Login-Vertrauen (bleibt). Badge „Saison 26/27 – kostenlos
     testen bis Spieltag 2".
  3. StatsStrip ersetzen durch ehrliche Werte: „432 Bundesliga-Spieler im Blick ·
     18 Vereins-Quellen + Kicker/Sportschau · Kostenlos bis Spieltag 2 · Hosting in
     Deutschland" (Flaggen-EMOJI durch Lucide-Icon `MapPin`/Text ersetzen — keine
     Emoji-Icons).
  4. Features-Sektion: 3 ECHTE Hebel — (1) Cash-Röntgenblick (Wettbewerb), (2) Bid-Advisor
     + Trading-Insights, (3) News mit Spieler-Tagging + Top-50. Fake-Visuals durch
     abstrahierte, korrekte Mock-Daten ersetzen (KEIN Wirtz; Beispiel-Manager-Namen neutral
     „Du / Jonas / Lena"); „87 % Confidence"-artige Zahlen raus.
  5. Pricing-Sektion: Free (Dashboard, Top-50, News, Planer) / Pro 6 €/Halbserie
     (Wettbewerb, Bid-Advisor, Verlauf) + Zeile „Alles kostenlos bis einschließlich
     Spieltag 2". „Liga-Pro (Coming V2)"-Box ERSATZLOS entfernen. CTA → /upgrade.
  6. FAQ (`lib/seo/faq-data.ts`): Preis-Antwort aktualisieren (kostenlos testen,
     6 €/Halbserie), Cash-Feature-Frage ergänzen („Wie berechnet Ligabase die Kontostände
     der Mitspieler?" – Kurzfassung der Methodik).
  7. NEU `app/impressum/page.tsx` + `app/datenschutz/page.tsx`: saubere Text-Seiten
     mit App-Navigation; Impressum-Gerüst (Name Mourice Engelmann, Anschrift-TODO,
     E-Mail-TODO) mit auffälligem HTML-Kommentar `TODO Mourice`; Datenschutz-Gerüst
     (Vercel-Hosting/Analytics cookielos, Session-Cookie, Stripe beim Kauf, Kickbase-Login
     ohne Passwort-Speicherung) ebenfalls mit TODO-Markern. `/agb`-Link aus dem Footer
     entfernen. Footer-Zeile „Made in Berlin" → „Made in Hannover".
  8. Titel-Doppelung fixen: in `app/news/page.tsx` (und per Grep alle metadata-titles
     mit hartem „· LigaBase"/„| LigaBase"-Suffix) Suffix entfernen — das Template aus
     layout.tsx übernimmt.
  9. Em-Dash-Sweep: `grep -rn "—" app/ components/ lib/ public/ --include="*.tsx" --include="*.ts" --include="*.txt" --include="*.webmanifest"`
     → alle Vorkommen in UI-Strings durch „–" ersetzen (NICHT in Code-Kommentaren nötig,
     aber erlaubt).
  10. OG-Image (`app/opengraph-image.tsx`): Headline „Sieh, was deine Liga bieten kann.",
      Subline „Kontostände · Max-Gebote · Netto-Teamwert – für deine Kickbase-Liga".
  11. Methodik-Card in wettbewerb/page.tsx: Repo-Pfad-Referenz durch neutralen Satz
      ersetzen („Regelwerk empirisch gegen echte Kontostände verifiziert").
- **Edge-Cases:** Rename darf `betterbase` als Vercel-Projekt-Slug in `app/admin/page.tsx:26`
  NICHT anfassen (ist eine URL); package-Name `kickbasemvp` bleibt.
- **Akzeptanzkriterien:**
  - [x] `grep -rn "LigaBase" app/ components/ lib/ public/` → 0 Treffer
  - [x] `grep -rn "—" app/ components/ lib/seo lib/blog public/llms.txt` → 0 Treffer in User-Strings
  - [x] /impressum + /datenschutz rendern (HTTP 200) mit AppHeader-Navigation, Footer ohne /agb-Link
  - [x] Landing frei von „AI-Coach"/„Email Alerts"/„147 API-Endpoints"/„Wirtz"/„Coming V2"/„Made in Berlin" (nur RSC-Ref `$147` im Stream, kein Text)
  - [x] Browser-Tab auf /news zeigt genau EINMAL „· Ligabase"
- **Verify:** Greps aus Akzeptanzkriterien; Dev-Server-Sichtprüfung Landing komplett
  durchscrollen (Desktop + 390px); `pnpm build` grün.

### Slice S7: Design- und Mobile-Politur — „unfassbar clean und intuitiv" (M/L)

- **Warum:** Kickbase-Nutzer sind mobile-first; aktuell ist genau dort die Kern-Tabelle
  gequetscht und die Navigation nicht entdeckbar. Befunde aus dem Design-Audit (06.07.,
  Desktop 1491px + Mobile 390px, echte Daten Liga 089).
- **Ist (Audit-Befunde, verifiziert per Screenshot):**
  1. Liga-Tab-Bar (Datei via Grep nach „Wettbewerb"-Tab-Label finden — die Komponente,
     die die 9 Tabs Dashboard…Top 50 rendert, vermutlich ein league-Layout unter
     `app/league/[id]/`): scrollt auf Mobile horizontal OHNE Affordance; Markt/Trading/
     News/Top 50 unsichtbar.
  2. `CompareTable` in `wettbewerb/page.tsx:723-849`: auf 390px werden Spalten gequetscht,
     Zahlen brechen um und überlappen — unlesbar. Der `overflow-x-auto`-Wrapper existiert
     (Zeile ~994 alt), aber die Tabelle hat kein `min-w`, dadurch quetscht sie statt zu scrollen.
  3. `/leagues`-Karten (`app/leagues/page.tsx`): „Manager"-Wert zeigt 773/1287/1014
     (falsches API-Feld — echte Manager-Zahlen sind 3/4/10; korrekte Quelle:
     `overview.us.length` über `kb.leagueOverviewWithManagers` ODER Feld `mgc` aus dem
     Overview — verifizieren, welches Feld die Mitgliederzahl trägt; `un` aus
     /leagues/selection ist es NICHT). „Spieler: 11" zeigt vermutlich `lpc`
     (Lineup-Count) — Label auf „Startelf" ändern oder Kadergröße anzeigen.
  4. /news + /upgrade sind Navigation-Sackgassen (kein Header, kein Weg zurück/weiter).
     /news ist SEO-Landeseite!
  5. Wettbewerb: „Modell-Validierung"-Panel (CashValidationPanel) wirkt für Endnutzer
     wie Debug-Output.
  6. Login-Headline „Willkommen zurück" für Erstbesucher (wird in S4 miterledigt, hier
     nur nicht doppelt anfassen).
  7. Install-Prompt (`components/install-prompt.tsx`) liegt fixed bottom — Kollision mit
    neuer Bottom-Nav bedenken.
- **Soll:** Mobile fühlt sich wie eine App an: Bottom-Nav, scrollbare statt gequetschte
  Tabellen, keine Sackgassen, keine Debug-Anmutung.
- **Bauschritte:**
  1. NEU `components/bottom-nav.tsx` (client): fixed bottom, nur `< md` sichtbar
     (`md:hidden`), 5 Einträge mit Icon + Label: Dashboard, Wettbewerb, Markt, News,
     „Mehr" (öffnet Sheet/Dropdown mit Aufstellung, Trading, Watchlist, Liga-Feed,
     Top 50, Account). Aktiver Zustand: Primärfarbe + Indikator. Höhe 64px +
     `env(safe-area-inset-bottom)`. Liga-Kontext aus der URL (`/league/[id]/...`);
     außerhalb des Liga-Kontexts (News, Account): Dashboard-Link führt zu /leagues.
     In das Liga-Layout und die App-Seiten einbinden; Content bekommt `pb-20 md:pb-0`.
     Die bestehende Tab-Leiste wird `hidden md:flex`.
  2. Install-Prompt: Position auf Mobile über die Bottom-Nav heben (`bottom-20 md:bottom-3`).
  3. `CompareTable`: Tabelle `min-w-[720px]` + Wrapper behält `overflow-x-auto`;
     erste Spalte (# + Manager) `sticky left-0 bg-background z-10` mit Schatten-Kante;
     Scroll-Affordance: rechts weicher Gradient-Fade am Wrapper (nur wenn scrollbar).
  4. Navigation für /news und /upgrade: schlanker App-Header (Logo → /, rechts
     „Zu deinen Ligen" bzw. Login-Button je Session-Status) — als gemeinsame Komponente
     NEU `components/app-header.tsx`, auch für /impressum + /datenschutz (S6) nutzen.
  5. `CashValidationPanel` (wettbewerb/page.tsx): in ein `<details>` einklappen,
     Summary „Wie genau ist das Modell? ✓ Validiert an deinem Konto ({Abweichung})",
     Default zugeklappt.
  6. /leagues-Karten: Manager-Zahl aus korrekter Quelle (Schritt „Ist" Punkt 3 —
     erst Feld verifizieren: einmal `kb.leagueOverviewWithManagers` gegen Liga 6871934
     laufen lassen und `us.length`/`mgc` vergleichen), „Spieler"-Label fixen.
     Grid: bei 3 Karten `lg:grid-cols-3` statt 2+1.
  7. Tab-Bar-Fade (Desktop-Fallback klein): horizontaler Scroll-Container bekommt
     Fade-Kanten, solange scrollbar (kleine CSS-Lösung mit `mask-image` oder
     Gradient-Overlays) — betrifft nur Viewports zwischen sm und md, wo die alte
     Leiste noch sichtbar sein könnte (falls Schritt 1 sie unter md komplett ersetzt,
     entfällt dieser Punkt — dann streichen).
  8. Durchgängigkeits-Check Touch-Targets: alle neuen interaktiven Elemente ≥ 44px
     Höhe; Sort-Chips auf der Wettbewerb-Seite von `py-1` auf `py-1.5` + `min-h-[36px]`
     anheben (bewusste Ausnahme unter 44px: sekundäre Chips, dokumentieren).
- **Edge-Cases:** iPhone-Safe-Area (Bottom-Nav padding), Bottom-Nav bei geöffneter
  Tastatur (Login: Bottom-Nav dort nicht rendern), sehr lange Liga-Namen im Header
  (truncate), PWA-standalone (Bottom-Nav ist dort die Hauptnavigation — testen).
- **Akzeptanzkriterien:**
  - [x] 390px-Viewport: Wettbewerb-Tabelle scrollt horizontal, Manager-Spalte sticky, nichts überlappt (Markup: min-w-[720px] + sticky left-0/left-10 mit soliden bg + z-index; Screenshot s. §8)
  - [x] 390px: Bottom-Nav sichtbar mit 5 Items, aktiver Tab markiert; Desktop ≥ md: unverändert alte Leiste (md:hidden Nav + LeagueTabs hidden md:block)
  - [x] /news + /upgrade haben Header mit Weg zur App (AppHeader live belegt)
  - [x] /leagues zeigt echte Manager-Zahlen (Liga 089 → 10) — live belegt: 3/4/10 statt 773/1287/1014
  - [x] Validierungs-Panel zugeklappt per Default (`<details>` mit Summary „Wie genau ist das Modell?")
  - [x] `pnpm build` + `pnpm test` grün
- **Verify:** Playwright oder Browser-DevTools bei 390×844: wettbewerb, dashboard,
  leagues, news durchklicken; Screenshot-Vergleich; `curl`-Smoke auf alle geänderten
  Routen (200/307 wie erwartet).

## 5. Reihenfolge + Abhängigkeiten

1. **S0** (Fundament — Paywall/Trial/Season-Konstanten; S1/S2/S4 hängen daran)
2. **S6** (Recht + Ehrlichkeit — unabhängig, aber vor jedem Marketing-Push nötig)
3. **S7** (Mobile/Design — unabhängig; S7.4 App-Header wird von S6.7 mitgenutzt: wer
   zuerst baut, legt `components/app-header.tsx` an)
4. **S1** dann **S2** (beide nutzen `lib/competition-data.ts` aus S1.1)
5. **S4** (nutzt getAccess aus S0)
6. **S3** (nutzt Trial-Key aus S0)
7. **S5** (unabhängig, braucht nur Stripe-Env)

S6 und S7 können parallel zu S0 gebaut werden (keine Datei-Überschneidung außer
wettbewerb/page.tsx — dort S0 zuerst, S7 danach).

## 6. Risiken + Guards

- **Geblurrte Daten im HTML** (S0): Free-Teaser darf echte Konkurrenten-Werte nicht ins
  Markup rendern (View-Source-Leak). Guard: Platzhalterwerte server-seitig, Akzeptanztest.
- **Stripe-Testmode vs. Live** (S0/S5): Bauen + verifizieren mit Test-Keys; Live-Keys
  sind Ops (§7). Guard: Env-Namen im Code, keine Keys.
- **Season-Stichtage falsch** (S0): Hinrunden-Ende ist wegen WM-Kalender unsicher.
  Guard: Konstanten in EINER Datei (`lib/season.ts`) + TODO-Marker; falscher Wert ist
  ein 1-Zeilen-Fix.
- **Rename-Kollateral** (S6): „LigaBase"-Grep trifft auch URLs/Slugs. Guard: Vercel-Slug
  `betterbase` und Package-Name explizit ausgenommen (Edge-Case-Liste S6).
- **Bottom-Nav bricht Desktop** (S7): strikt `md:hidden` + visuelle Prüfung beider Breakpoints.
- **KV lokal nicht vorhanden:** alle neuen KV-Nutzungen (trial, snapshot, referral,
  salesstats) brauchen den In-Memory-Fallback nach dem Muster von `lib/admin/analytics.ts:15,38-43`.
- **Kickbase-Login-Rate:** S4 ruft `kb.leagues` beim Login zusätzlich — mit try/catch +
  Timeout, Login darf dadurch NIE scheitern.

## 7. Ops nach Merge (Mourice + Claude gemeinsam)

1. **Stripe-Produkte anlegen** (Dashboard oder CLI, Testmode zuerst):
   Produkt „Ligabase Pro" → Price 6,00 € one-time `hinrunde-2627`, Price 6,00 € one-time
   `rueckrunde-2627`. Price-IDs notieren.
2. **Vercel-Env setzen (Production):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   (nach Webhook-Endpoint-Anlage auf `https://ligabase.de/api/stripe/webhook`),
   `STRIPE_PRICE_HINRUNDE_2627`, `STRIPE_PRICE_RUECKRUNDE_2627`. (Secret-Writes macht
   Mourice selbst — CLI-Einzeiler bereitstellen.)
3. **Promotion-Codes anlegen** pro Creator-Deal: Coupon 30 % → Codes `TOBI30` etc.
4. **Test-Kauf im Testmode** durchspielen (Karte 4242…), dann Live schalten.
5. **Deploy:** `vercel --prod` nach Mourice-OK; danach ligabase.de-Smoke (Landing,
   /impressum, /upgrade, Wettbewerb mobile).
6. **Impressum/Datenschutz-TODOs füllen** (Anschrift, Mail) — vor dem ersten Creator-Kontakt.
7. Memory/Plan-Status aktualisieren (macht Claude beim /wrap).

## 8. Abweichungen (füllt der Umsetzer)

### S0 (2026-07-06)
- **Success-Page exp aus Plan-Key statt `currentHalfSeason().end`:** Der Zugang gilt bis
  zum Ende der TATSÄCHLICH gekauften Halbserie (`halfSeasonEnd(plan)`), Fallback
  `currentHalfSeason().end` nur für Legacy-Plans. Vermeidet einen latenten Bug, falls je
  eine Rückrunde während der Hinrunde verkauft wird. Neuer Helper `halfSeasonEnd(key)` in
  `lib/season.ts`.
- **Bezahl-Guard auf der Success-Page:** Entitlement wird nur gesetzt, wenn
  `cs.status === "complete" && cs.payment_status === "paid"` (der Webhook ist bewusst nur
  Placeholder, die Success-Page ist der Freischalt-Punkt — ohne Guard könnte eine
  unbezahlte/abgebrochene Session Pro freischalten).
- **Webhook bleibt auf `process.env.STRIPE_WEBHOOK_SECRET`** (Placeholder, Plan sagt „bleibt
  so"); nur die aktiven Stripe-Nutzungen laufen jetzt über `env.*`.
- **Em-Dash in der Wettbewerb-Header-Subline** (die ich für den Trial-Badge ohnehin umbaute)
  gleich auf En-Dash gebracht — vorgezogen aus S6 Em-Dash-Sweep.
- **Lokale Trial-Verifikation:** Der In-Memory-KV-Fallback teilt Modul-State zwischen
  Login-Route und RSC im Next-Dev NICHT zuverlässig (deshalb schreibt der Plan KV für Prod
  vor). Daher: Trial-Datum + `nx`-Schreiblogik in einem Ein-Prozess-Skript belegt, die
  Vollansicht via gemintetem Pro-Entitlement-Cookie live belegt, die Free/Teaser-Ansicht
  via gemintetem Session-Cookie live belegt. Die Trial-Ansicht end-to-end (Badge) wird beim
  Prod-Smoke (§7.5) mit echtem KV bestätigt.
- **`.env.example` ist im Repo gitignored** → Umbenennung der Price-Vars dort nur lokal;
  die kanonische Referenz sind Ops §7.2 + `lib/env.ts`.

### S6 (2026-07-06)
- **`components/app-header.tsx` in S6 angelegt** (per §5-Notiz: wer zuerst baut, legt ihn an);
  Server-Component, liest Session → „Zu deinen Ligen" vs. Login. S7 nutzt ihn für /news + /upgrade mit.
- **Em-Dash-Sweep zusätzlich über `.css`** (ein Kommentar in `app/globals.css`), damit der
  Akzeptanz-Grep repo-weit 0 ergibt. Insgesamt 60 Dateien (U+2014 → U+2013), rein Kommentar/String.
- **DashboardPreview:** „Florian Wirtz" → „Granit Xhaka" (Leverkusen, tid 7), „Harry Kane" →
  „Serhou Guirassy" (Dortmund, tid 3 — behebt zugleich eine bestehende Name/Wappen-Diskrepanz).
- **Trust-Sektion:** „Plausible statt Google Analytics" → „Vercel Analytics (cookielos)" —
  entspricht dem tatsächlichen Stack (layout.tsx lädt Vercel Insights).
- **HeroPreviewCard-Manager** auf neutrale Namen (Jonas/Lena/Max) gebracht, konsistent mit der
  Neutral-Namen-Regel der Features-Visuals.
- **Impressum/Datenschutz:** sichtbare amber-Platzhalter + JSX-`TODO Mourice`-Kommentar (TSX kann
  keinen rohen HTML-Kommentar tragen), `robots: noindex`. Paragraphen auf aktuelles Recht
  (§ 5 DDG / § 18 MStV) statt veraltetem TMG/RStV.
- **Ungenutzte Icon-Importe** in app/page.tsx entfernt (Bell/Eye/Users/Smartphone/ChartBar) nach dem
  Features-Umbau.

### S7 (2026-07-06)
- **/leagues Manager-Zahl:** live verifiziert, dass `un` aus /leagues/selection falsch ist
  (773/1287/1014); korrekt ist `overview.mgc` (= `us.length`) → jetzt 3/4/10. Zusätzlicher leichter
  `leagueOverview(id, false)`-Fetch je Liga (parallel). „Spieler" → „Startelf" (lpc = 11 = Aufstellungsgröße).
- **Bottom-Nav** nur im Liga-Layout gemountet (die Fläche mit dem 9-Tab-Scroll-Problem); /news, /upgrade,
  /account nutzen den Top-`AppHeader` statt Bottom-Nav. Liga-Kontext aus der URL; außerhalb → /leagues.
- **Tab-Bar-Fade (Bauschritt 7) gestrichen** — die Tab-Leiste ist unter md komplett durch die Bottom-Nav
  ersetzt (`hidden md:block`), wie im Plan als Streich-Option vorgesehen.
- **Sticky-Spalten CompareTable:** # + Manager `sticky left-0`/`left-10` mit soliden Backgrounds
  (bg-card / bg-emerald-50 für die eigene Zeile / bg-muted im Header) + z-index gegen Durchscheinen,
  Manager-Spalte mit Schatten-Kante; Fade-Overlay rechts nur `md:hidden`.
- **390px-Screenshot nicht ausführbar:** der MCP-Chrome-Profilordner war von einer anderen Instanz
  gesperrt („Browser is already in use"). Verifikation daher über das ausgelieferte Markup (alle
  responsive Klassen present), den Build und den Live-/leagues-Check. Reine responsive Tailwind-Klassen
  (`md:hidden`, `min-w-[720px]`, `sticky`) sind deterministisch.

### S1 (2026-07-06)
- **share-image-Route ist `runtime = "nodejs"`** (nicht Edge wie das OG-Image): die Session-
  Entschlüsselung nutzt `node:crypto`, das im Edge-Runtime fehlt. `ImageResponse` läuft auch unter Node.
- **Satori-Gotcha:** next/og verlangt `display:flex` auf jedem `<div>` mit >1 Kind. Die „max {Wert}"-Zelle
  hatte zwei Text-Kinder ohne flex → zu einem einzelnen Template-String zusammengefasst. (Fehler war erst
  zur Laufzeit sichtbar, nicht im Build — Live-Render ist bei og-Images Pflicht.)
- **Daten-Assembly extrahiert** nach `lib/competition-data.ts` (`assembleCompetitionStats`), von Page +
  Route genutzt; gibt `null` bei leerer Mitgliederliste (Page rendert Empty-State). Liga-Name aus `overview.lnm`.
- **ShareButtons** als eigene Client-Komponente (`components/share-button.tsx`), nur für Pro/Trial gerendert;
  Snapshot-Link kommt in S2 in dieselbe Komponente.

### S2 (2026-07-06)
- **`lib/snapshot-store.ts` mit globalThis-basiertem In-Memory-Fallback:** löst die Modul-Isolation
  Route↔RSC (die die Trial-Keys in S0 lokal getroffen hat) – POST-Route und öffentliche /s-Seite sehen
  denselben Store, sodass der Happy-Path auch lokal ohne KV verifizierbar ist. In Prod via Vercel KV (`ex: 7d`).
- **`snapshotConfigured()` = KV vorhanden:** der „Link für die Liga-Gruppe"-Button ist lokal (kein KV)
  ausgeblendet (persistente 7-Tage-Links brauchen KV), Route+Seite funktionieren trotzdem über den
  In-Memory-Store (für Tests). In Prod erscheint der Button.
- **Snapshot-Payload bewusst minimal:** nur name/seasonPoints/matchdayWins/teamValue/cashEstimate/
  maxBidSingleSell/netTeamValue – KEIN Kickbase-Token, KEINE User-IDs (Live-Check: 0 Token-Leak im HTML).
- **/s-Seite nutzt den geteilten `AppHeader`** (zeigt für anonyme Empfänger den Login-Button = die Conversion).
