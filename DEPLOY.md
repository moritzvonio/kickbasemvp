# KickbaseMVP — Deploy & Setup-Anleitung

Mourice, das hier ist deine Klick-Anleitung. Was **du machst** ist mit 👉 markiert.
Was **automatisch läuft**, ist mit ⚙️ markiert.

---

## Schritt 1 — Lokal ausprobieren (5 Min)

Du kannst die App gleich lokal testen, bevor sie online geht.

👉 **Du machst:**

1. Terminal aufmachen
2. Dieses Kommando reinkopieren und Enter drücken:
   ```
   cd ~/kickbasemvp && pnpm dev
   ```
3. Browser öffnen: <http://localhost:3000>
4. Auf "Jetzt mit Kickbase einloggen" klicken
5. Mit deinen echten Kickbase-Zugangsdaten einloggen

⚙️ **Automatisch:**
- Die App tauscht dein Passwort gegen einen Token bei Kickbase
- Token landet verschlüsselt in einem Cookie
- Du landest auf `/leagues` und siehst deine echten Ligen

Wenn das funktioniert → weiter mit Schritt 2.

---

## Schritt 2 — Auf Vercel deployen (10 Min)

👉 **Du machst:**

1. **GitHub-Repo erstellen.** Auf <https://github.com/new>:
   - Repository name: `kickbasemvp`
   - Private oder Public — egal
   - **Kein** README, **kein** .gitignore (haben wir schon)
   - Auf "Create repository" klicken
2. GitHub zeigt dir Befehle — kopier nur den `git remote add` und die `git push`-Zeile.
   Im Terminal:
   ```
   cd ~/kickbasemvp
   git remote add origin https://github.com/DEIN-USERNAME/kickbasemvp.git
   git branch -M main
   git push -u origin main
   ```
3. **Vercel-Projekt anlegen.** Auf <https://vercel.com/new>:
   - "Import Git Repository" → dein `kickbasemvp`-Repo wählen
   - Framework: **Next.js** (wird auto-erkannt)
   - **NICHT auf "Deploy" klicken — erst Env-Vars setzen!**
4. Bei "Environment Variables" diese drei eintragen:
   | Name | Wert |
   |------|------|
   | `SESSION_SECRET` | (im Terminal: `openssl rand -hex 32` ausführen, Output kopieren) |
   | `NEXT_PUBLIC_APP_URL` | `https://DEIN-PROJEKT.vercel.app` (kennst du noch nicht — erstmal `https://kickbasemvp.vercel.app` eintragen, später korrigieren) |
   | `KICKBASE_API_BASE` | `https://api.kickbase.com` |
5. Jetzt "Deploy" klicken.

⚙️ **Automatisch:**
- Vercel baut die App (~2 Min)
- Du bekommst eine Live-URL wie `https://kickbasemvp-xyz.vercel.app`

👉 **Danach:**
- Im Vercel-Dashboard → Settings → Environment Variables: `NEXT_PUBLIC_APP_URL` auf die echte Vercel-URL korrigieren
- Settings → Deployments → "Redeploy" klicken

---

## Schritt 3 — Eigene Domain verbinden (optional, 5 Min)

Wenn du `kickbasemvp.app` o.ä. besitzt:

👉 **Du machst:**
1. Vercel-Projekt → Settings → Domains
2. Domain eingeben → "Add"
3. Vercel zeigt dir 1–2 DNS-Records (A oder CNAME)
4. Bei deinem Domain-Anbieter (Namecheap, Cloudflare, GoDaddy …) diese Records eintragen
5. Warten (5 Min – 24h, meistens unter 1h)
6. Vercel-Env-Var `NEXT_PUBLIC_APP_URL` auf die neue Domain umstellen + Redeploy

---

## Schritt 4 — Stripe einrichten (15 Min, optional bis Pro live geht)

Damit du Pro-Käufe entgegennehmen kannst.

👉 **Du machst:**

1. **Stripe-Account erstellen** auf <https://dashboard.stripe.com/register>
   - Erstmal **Testmodus** aktiviert lassen (oben rechts: "Test mode")
2. **API-Keys holen:** Dashboard → Developers → API keys
   - "Secret key" kopieren (beginnt mit `sk_test_…`)
3. **Produkt anlegen:** Dashboard → Catalog → Products → "+ Add product"
   - Name: `KickbaseMVP Pro Monatlich`
   - Pricing: Recurring · 4,99 € · Monthly · EUR
   - Speichern → "API ID" der Price kopieren (beginnt mit `price_…`)
4. **Zweites Produkt:** "+ Add product"
   - Name: `KickbaseMVP Pro Saison`
   - Pricing: One-time · 19,99 € · EUR
   - Speichern → Price-ID kopieren
5. **Webhook anlegen:** Developers → Webhooks → "Add endpoint"
   - Endpoint URL: `https://DEINE-VERCEL-URL/api/stripe/webhook`
   - Events to send (mindestens): `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Speichern → "Signing secret" kopieren (beginnt mit `whsec_…`)
6. **Vercel-Env-Vars eintragen:**
   - `STRIPE_SECRET_KEY` = der `sk_test_…`-Key
   - `STRIPE_PRICE_PRO_MONTHLY` = die `price_…`-ID vom Monatsprodukt
   - `STRIPE_PRICE_PRO_SEASON` = die `price_…`-ID vom Saisonprodukt
   - `STRIPE_WEBHOOK_SECRET` = der `whsec_…`-Secret
7. Vercel → Redeploy

⚙️ **Automatisch:**
- Auf `/upgrade` werden die "Pro starten"-Buttons jetzt aktiv
- Klick → Stripe-Checkout → nach Zahlung Redirect auf `/upgrade/success`
- Dort wird der User automatisch als Pro markiert

**Test:** Stripe-Testkarte `4242 4242 4242 4242` mit beliebigem Datum/CVC.

**Wenn alles klappt:** Im Stripe-Dashboard von Test- auf **Live-Mode** umschalten,
dort dieselben Schritte nochmal mit Live-Keys → in Vercel die Test-Keys durch
Live-Keys ersetzen.

---

## Schritt 5 — Push-Notifications (10 Min, optional)

👉 **Du machst:**

1. Im Terminal:
   ```
   cd ~/kickbasemvp
   pnpm dlx web-push generate-vapid-keys
   ```
2. Du bekommst zwei Strings: **Public Key** und **Private Key**
3. Vercel-Env-Vars:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = der Public Key
   - `VAPID_PRIVATE_KEY` = der Private Key
   - `VAPID_SUBJECT` = `mailto:deine@email.de`
4. Vercel → Redeploy

⚙️ **Automatisch:**
- Auf `/account` erscheint jetzt "Push aktivieren"
- Browser fragt nach Berechtigung → User klickt "Erlauben"
- Subscription wird im Cookie gespeichert

> Push-**Senden** ist noch nicht eingebaut (kommt mit Cron + DB in V2).
> Subscription-Empfang funktioniert aber schon — wir sammeln Endpoints.

---

## Schritt 6 — Was als Nächstes? (Roadmap)

Nach Launch sinnvoll zu bauen:

- **Supabase anbinden** (Postgres + Auth) — damit Pro-Status, Watchlist, Push-Subscriptions
  über Geräte hinweg synchronisieren statt im Cookie zu leben.
- **AI-Transfer-Coach** — Marktwert-Modell + Spielplan + Form → konkrete Action-Items.
- **Liga-Pro B2B-Tier** — 9,99 €/Saison für ganze Liga.
- **Cron für Push-Versand** — Vercel Cron oder ähnliches, das Marktwert-Drops detektiert
  und Subscribers anpingt.
- **Public SEO-Routes** — `/spieler/[slug]`, `/team/[slug]` für Long-Tail-Traffic.

---

## Troubleshooting

**"Build failed" auf Vercel.**
→ Check ob du `SESSION_SECRET` mit ≥ 32 Zeichen gesetzt hast. Sonst crasht Zod beim Boot.

**Login schlägt fehl mit "Kickbase-API antwortet nicht".**
→ Vercel-Logs checken. Vielleicht hat Kickbase grad einen Outage. Nach 5 Min nochmal.

**Stripe-Checkout-Buttons grau.**
→ `STRIPE_SECRET_KEY` und beide `STRIPE_PRICE_…` Env-Vars in Vercel gesetzt? Redeployt?

**Push-Toggle sagt "VAPID_PUBLIC_KEY fehlt".**
→ `NEXT_PUBLIC_VAPID_PUBLIC_KEY` in Vercel gesetzt? Diese Env-Var **muss** mit
`NEXT_PUBLIC_` anfangen, sonst kommt sie nicht im Browser an.

**OG-Image leer.**
→ Erstmal egal — Vercel cached OG-Images. Nach paar Stunden nochmal testen.

---

## Was läuft schon

- ✅ Login mit Kickbase, Passwort wird **nie** gespeichert
- ✅ Liga-Auswahl + Dashboard mit Squad/Tabelle/Activities
- ✅ Spieler-Detail mit Marktwert-Chart 92 Tage
- ✅ Transfermarkt-Tab
- ✅ Watchlist (Cookie-basiert)
- ✅ Liga-Aktivitätsfeed mit Filter (Transfers / Achievements / Mitspieler)
- ✅ MV-Gewinner/Verlierer 24h auf Dashboard
- ✅ Pricing-Seite mit Stripe-Checkout
- ✅ PWA: installierbar, Service Worker registriert sich
- ✅ Push-Subscribe (VAPID-Keys nötig zum Aktivieren)
- ✅ DSGVO-Footer, Security-Header, robots.txt, sitemap.xml, OG-Image

## Was noch fehlt (V2)

- 🔜 AI-Transfer-Coach mit konkreten Action-Items
- 🔜 Liga-Pro B2B-Tier
- 🔜 Push-Senden via Cron
- 🔜 Supabase für persistente Pro/Watchlist/Push-Subs
- 🔜 Public SEO-Routes für Spieler & Teams
- 🔜 Saison-PDF-Report
