# News-Layer Phase 2 + Audit-Fixes — Status & Mourice-TODOs

**Stand:** 2026-05-06 · Code-Stand kompiliert grün, läuft mit In-Memory-Fallback
sofort lokal. Damit der Cron in Production echte News einsammelt brauchen wir
2 UI-Klicks (KV-Store + GitHub-Secrets) und 1 ENV-var.

## Bonus diese Session — Audit-Fixes
- ✅ **I5** SHA-256-Key-Derivation in `lib/session.ts` + `lib/entitlement.ts` (vorher byte-modulo padding — schwächer)
- ✅ **I7** User-Agent in `lib/kickbase/client.ts` aus env (`NEXT_PUBLIC_APP_NAME`/`URL`) statt hardcoded
- ✅ **I6** Patch-Files in `~/Documents/Claude/Projects/Venture Machine/.kickbasemvp-patch/` gediffed: **alle 4 sind outdated** (Patch sagt "KickbaseMVP", Repo bereits "KickbaseMVP"). **Mourice kann den Ordner gefahrlos löschen.**
- ❌ **C1** „Middleware tot" war FALSE POSITIVE — `proxy.ts` ist Next.js 16 Standard (Middleware wurde umbenannt zu Proxy, siehe `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`). Auth läuft.
- ✅ **C3** SESSION_SECRET-Default in production crashed jetzt (vorher: stiller Fallback)

## Bonus — Local-Test-Script
`scripts/test-news-pipeline.ts` lässt dich News-Pipeline lokal triggern ohne
auf den 30-min-Cron zu warten:

```
cd ~/kickbasemvp
npx tsx scripts/test-news-pipeline.ts
```

Output: alle 18 Sources werden gefetched, getaggt, gespeichert; Top 10 Items
werden ausgegeben. Lokal ohne KV → Memory-Mode (geht weg bei Restart).

---

## Was direkt funktioniert (ohne weitere Schritte)

- ✅ **News-Tab** zwischen „Markt" und „Top 50" sichtbar in Liga-Navigation
- ✅ Public Page `/news` (SEO-optimiert, ohne Login)
- ✅ Liga-gefilterte Page `/league/[id]/news` mit Filter „Mein Team / Mein Verein / Trends"
- ✅ News-Sektion auf Spieler-Detail-Page (am Bottom)
- ✅ Eigener RSS-Feed `/news/feed.xml`
- ✅ `/api/news`, `/api/news/player/[id]`, `/api/news/discord-ingest`, `/api/news/refresh-player-index`
- ✅ Cron-Endpoint `/api/cron/news-refresh` mit Bearer-Auth
- ✅ Player-Tagger via Regex (Vor+Nachname, eindeutige Nachnamen)
- ✅ Mock-Twitter-Source mit 30 [MOCK-DEMO]-Tweets der 6 wichtigsten Reporter
- ✅ 12 Vereins-RSS-Sources (BL, plus Kicker.de) — die fehlenden 6 sind als
  `null` markiert, Mourice trägt URLs nach wenn er welche findet

---

## Mourice-TODOs (UI-Aktionen, kann ich nicht selbst)

### 1. Vercel KV / Upstash-Redis-Store anlegen ⚠️ KRITISCH
Ohne dieses Storage läuft der News-Layer in Production mit In-Memory-Fallback,
d.h. bei jedem Server-Restart sind die News weg. Fix:

1. Vercel-Dashboard → `kickbasemvp` Projekt → **Storage** Tab
2. „Browse Marketplace" → **Upstash Redis** auswählen → „Add Integration"
3. Plan: **Free** (10k commands/Tag = ~300k/Monat reicht easy)
4. Vercel injiziert automatisch:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
5. Nach Anlegen: Project muss neu deployed werden (`npx vercel --prod`)

Verify: `https://kickbasemvp.vercel.app/api/news` → leere Liste statt Fehler

### 2. CRON_SECRET setzen ⚠️ KRITISCH
Sonst kann der GitHub-Action-Cron den Refresh-Endpoint nicht hitten.

```
# Random 32-char Hex generieren:
openssl rand -hex 32
# Beispiel-Output: 3f8a... (kopieren)
```

**In Vercel:**
1. Project Settings → Environment Variables
2. Name: `CRON_SECRET`, Value: <der gerade generierte Hex>
3. Environment: nur **Production**
4. Save

**In GitHub:**
1. Repo `moritzvonio/kickbasemvp` → Settings → Secrets and variables → Actions
2. „New repository secret":
   - `CRON_SECRET` = derselbe Wert wie in Vercel
   - `APP_URL` = `https://kickbasemvp.vercel.app`
3. Speichern

Nach dem Setzen: GitHub → Actions Tab → „News Refresh" → „Run workflow"
manuell triggern. Sollte 200 zurückgeben mit `{ ok: true, fetched: N, stored: M }`.

### 3. Player-Index initial bauen (5 sec)
Erste-Mal-Setup. Nachdem du auf der News-Tab eingeloggt warst, läuft das
automatisch. Falls nicht:

```
curl -X POST https://kickbasemvp.vercel.app/api/news/refresh-player-index \
  -H "Cookie: bb_session=<dein-cookie>"
```

(oder einfach `/league/[id]/news` einmal aufrufen — index wird lazy gebaut.)

### 4. Fehlende Vereins-RSS-Feeds suchen (optional)
In `lib/news/sources/club-rss-source.ts` sind 6 Vereine als `null` markiert:
- RB Leipzig, Mainz, Augsburg, Hoffenheim, Union Berlin, Heidenheim

Wenn du auf der jeweiligen Vereins-Website ein RSS findest (z.B. unter
`/news/rss` oder `/news.rss`), URL eintragen + redeploy.

### 5. Discord-Server (V3, später)
Endpoint `/api/news/discord-ingest` ist fertig, wartet auf Discord-Webhook.
Wenn du mal Lust hast einen Mod-Channel aufzusetzen:
1. `DISCORD_INGEST_SECRET` = random Hex (`openssl rand -hex 32`)
2. In Vercel als Env-Var setzen
3. Im Discord-Channel: Settings → Integrations → Webhooks → Create
   - URL: `https://kickbasemvp.vercel.app/api/news/discord-ingest`
   - Headers: `x-discord-secret: <der Wert>`

---

## Was später ausgetauscht wird (Migration-Pfad)

Im Code sind klare PLATZHALTER-Markierungen:

| Was | Wann sinnvoll | Wie ersetzen |
|---|---|---|
| `MockTwitterSource` (~30 Demo-Tweets) | Wenn Audience da | rss.app abonnieren ($20/Mo), 50 Reporter-Feeds anlegen, neue `RssAppTwitterSource` Klasse die das gleiche Interface implementiert. `mock-twitter-source.ts` einfach durch neuen Import in `sources/index.ts` ersetzen. |
| `tagger.ts` Regex-Tagger | Wenn 30+ News/Tag | OpenAI-API-Key in env setzen, GPT-Fallback aktivieren (Code-Stelle: `// PLATZHALTER für GPT-Fallback`) |
| GitHub-Action-Cron | Wenn Vercel-Pro-Upgrade | `vercel.json` mit `crons`-Section ersetzt GH-Action |

Mock-Twitter-Source via `NEWS_DISABLE_MOCKS=1` deaktivieren sobald echte
Twitter-Source da ist.

---

## Lokales Testen

```
cd ~/kickbasemvp
npm run dev
# → http://localhost:3000/news (public)
# → http://localhost:3000/league/<dein-leagueId>/news (gefiltert)
```

In-Memory-Mode aktiv (KV nicht configured) — News verschwinden bei Restart.
News werden auch lokal nicht automatisch gefetched, du musst manuell triggern:

```
curl -X POST http://localhost:3000/api/cron/news-refresh \
  -H "Authorization: Bearer dev-cron-secret"
# (vorher in .env.local: CRON_SECRET=dev-cron-secret)
```

---

## Quality-Gates die der Store automatisch macht

- Title < 10 Zeichen → skip (Spam-Schutz)
- Item älter als 14 Tage → skip
- Title/Body enthält "Werbung", "Anzeige", "Newsletter abonnieren" → skip
- Kein Player-Tag UND keine Club-Tag → skip (uninteressant)
- Dedup über externalId (md5 der URL)

---

## Storage-Schema (KV / Memory-Fallback identisch)

```
news:item:{externalId}    → StoredNewsItem (TTL 30 Tage)
news:bytime               → ZSet, score=publishedAt-ms
news:byplayer:{playerId}  → ZSet
news:byclub:{clubSlug}    → ZSet
news:lastfetch:{sourceId} → status (TTL 7 Tage)
news:playerindex          → cached PlayerIndex (TTL 25h)
```

KV-Cost-Estimate: ~50 neue Items/Tag × 5 Writes = 250 Writes/Tag = 7,5k/Monat.
Plus ~500 Reads/Tag = 15k/Monat. Gesamt < 25k/Monat → Free-Tier reicht
mit komfortablem Puffer.
