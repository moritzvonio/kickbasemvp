@AGENTS.md

# LB — Ligabase (ex Betterbase / KickbaseMVP)

Kickbase-Companion-Web-Tool: ligabase.de. Liga-Dashboard, Markt/Trading-Analysen,
Wettbewerbs-Analyse (Konkurrenten-Cash-Schätzung = Kern-Differenzierer), News, Blog.
Interner Package-Name noch `kickbasemvp`.

## Stack
Next.js 16 App Router · TypeScript strict · Tailwind 4 · Vercel · Vercel KV
· Stripe (Upgrade-Flow) · Session = verschlüsselter Cookie mit Kickbase-Bearer-Token

## Dev-Server
```bash
pnpm dev  # Port 3000
```

## Kickbase-API
- `lib/kickbase/api.ts` — typisierte v4-Endpoints (Login, Ligen, Ranking, Transfers, Achievements, Feed)
- `docs/kickbase-openapi.json` + `docs/kickbase-postman.json` — API-Referenz
- Feed (`activitiesFeed`) ist TRUNKIERT (~3 Monate) und zeigt Boni (t=22 Tagesbonus,
  t=26 Achievements) NUR für den eingeloggten User. t=17 = Spieltagssieger (league-wide),
  t=15 = Markt-Verkäufe (league-wide).
- `ranking?dayNumber=X` liefert NACH Saisonende keine mdp/mdpl mehr (alles 0) —
  Spieltags-Daten müssen während der Saison gesammelt werden (KV).
- Manager-Dashboard (`/managers/{id}/dashboard`) liefert für ALLE Manager: `tp`
  (Saisonpunkte), `mdw` (Spieltagssiege), `pl` — Saisonwerte der laufenden Saison (`sn`).

## Cash-Diagnose (Konkurrenten-Cash-Schätzung)
- `scripts/cash-snapshot.ts` — zieht ALLE Rohdaten aller Ligen nach `diag/snapshots/`
  (Login via `KICKBASE_EMAIL`/`KICKBASE_PASSWORD` aus `.env.local`)
- `scripts/cash-analyze.ts` — Offline-Analyse: Bilanz-Identität eigener Account,
  Feed-Forensik, Manager-Vergleich
- Bonus-Wissen (empirisch verifiziert, Stand 2026-07): siehe `docs/kickbase-bonus-regeln.md`
- Eigener Cash = Wahrheits-Anker: `/me/budget` (b) und `/leagues/selection` (b je Liga)

## Tests
```bash
pnpm vitest run
```

## Deploy
`bb-deploy "commit message"` (zsh-Funktion) — git add/commit/push + `vercel --prod`.
