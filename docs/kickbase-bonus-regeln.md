# Kickbase Bonus-Regeln — verifiziertes Wissen (Stand 2026-07-06)

Grundlage der Konkurrenten-Cash-Schätzung (`lib/competitor.ts` + `lib/kickbase/bonus-catalog.ts`).
Zwei Quellen, in dieser Prioritätsreihenfolge:

1. **Empirie (maßgeblich):** Live-Snapshots vom 2026-07-06 (3 Ligen, eigener Account,
   echter Cash aus `/me/budget` als Wahrheits-Anker). Validierung: Σ ac×er der
   45 Achievement-Typen == API-Total (Liga 089: 42,85M ✓, Liga 23/24: 66,65M ✓).
2. **Offizielle Doku** (help.kickbase.com, Recherche 2026-07): bestätigt Mechanik,
   ist aber bei Beträgen teils VERALTET (z.B. Spieltagspunkte Gold: Doku 500k,
   API-er 1M). Bei Widerspruch gilt die API.

## Einkommensquellen eines Managers (Saison-Liga, Modus "Zufall/50M")

| Quelle | Betrag | Beobachtbarkeit für Konkurrenten |
|---|---|---|
| Startbudget | 50M (Admin-wählbar: 30/50/80M mit Zufallskader; 150/200/250M ohne) | Liga-Setting |
| Startkader | ~100M MV, 15 zugeloste Spieler | egal für Cash |
| Transfers | ±trp je Kauf/Verkauf | EXAKT (`/managers/{id}/transfer`, paginiert; nur nach Liga-Start zählen) |
| Punkteprämie | 1.000 € × Saisonpunkt (still, keine Feed-Events) | EXAKT (`tp` aus Dashboard) |
| Spieltagssieger | 1M pro Spieltagssieg (zahlt NICHT als Achievement — t=5 bleibt ac=0) | EXAKT (`mdw` aus Dashboard) |
| Tagesbonus | Streak: Tag 1–10 = 10k→100k, dann 100k/Tag; Reset auf Tag 1 bei Aussetzer; pro Liga gutgeschrieben (t=22-Feed-Event, nur eigener User sichtbar) | GESCHÄTZT (Aktivitäts-Heuristik) |
| Achievements | er-Katalog siehe `bonus-catalog.ts` (45 Typen) | teils exakt, teils kalibriert |
| Meister/Vize | 2M / 1M (Saisonende, als Achievement) | EXAKT (Platzierung) |

## Empirisch gesicherte Mechanik-Details

- **Spieltagspunkte-Tiers sind EXKLUSIV** — nur der höchste erreichte Tier pro
  Spieltag zahlt: ≥500 Bronze 100k · ≥1000 Silber 250k · ≥1500 Gold 1M · ≥2000
  Jahrhundert 2M. (Eigene Counts 1/24/5/0 bei avg 1165 über 34 Spieltage.)
  Die Doku listet kein Bronze und andere Beträge — API gewinnt.
- **Händchen** (realisierter Trading-Profit pro Spieler): zählt nur für
  Transfermarkt-Käufe (nicht Manager-zu-Manager), NICHT für zugeloste
  Draft-Spieler, Kauf muss in der laufenden Saison liegen. Erklärt: Dōan
  (Draft, +33,8M) → kein Königstransfer. Tiers (Glück/Bronze/Silber/Gold/König
  = 100k/250k/500k/1M/2M) wirken exklusiv-höchster pro Spieler.
- **Tagesbonus global ein Streak**, wird aber in jeder Liga gutgeschrieben
  (identische t=22-Events in allen drei Liga-Feeds).
- **`ranking?dayNumber=X` ist nach Saisonende kaputt** (mdp/mdpl/sp/tv = 0) —
  Spieltags-Detaildaten MÜSSEN während der Saison gesammelt werden (KV-Collector).
- **Dashboard (`/managers/{id}/dashboard`)** liefert für ALLE Manager die
  Saisonwerte `tp`, `mdw`, `pl` (Saison = `ranking.sn`).
- **Feed** (`activitiesFeed`): trunkiert (~3 Monate), Boni nur für eigenen User
  (t=22 Tagesbonus, t=26 Achievement-Unlocks); league-wide: t=15 Verkäufe,
  t=17 Spieltagssieger (data.i, data.pl=1).
- **Negativ-Konto zu Spieltagsbeginn** ⇒ 0 Punkte für den Spieltag (steckt
  bereits in tp — keine Modellkorrektur nötig).
- **33%-Regel:** Verkauf an Liga = 67 % MV.
- **Saisonwechsel, Option "Liga fortsetzen":** Kader + Budget + MV bleiben,
  Punkte → 0. Kader punktet passiv weiter (Alt-Ligen: Meister×2/×3!). Cash
  persistiert über Saisons. Option "Neu starten": Spieler zurück in den Pool,
  neues einheitliches Startbudget.

## Bilanz-Identität Liga 089 (Referenz-Validierung, Snapshot 2026-07-06)

```
Echter Cash (API)               50.888.168
= 50M Start
− 129.033.xxx TransferNetto     (380 Transfers, exakt)
+ 42.850.000  Achievements      (API, exakt)
+ 39.641.000  Punkteprämie      (39.641 tp × 1.000, exakt)
+ 28.440.000  Tagesbonus        (Feed-Rekonstruktion, exakt: Streak ab 01.08.)
+ 13.000.000  Spieltagssieger   (13 × 1M, offiziell)
= Rest ~6,0M  → kalibrierter residualPerPoint (~151 €/Pkt), Quelle unklar
              (Kandidaten: Prämien-Rundung, unbekanntes Event, Doku-Lücke)
```

Der Rest wird pro Liga aus dem eigenen Account kalibriert und über
Saisonpunkte auf Konkurrenten verteilt → Fehlerbeitrag ±2M statt ±20M.

## Offene Punkte

- Herkunft der ~6M Rest (Beobachtung nächste Saison: KV-Collector + tägliche
  Cash-Snapshots des eigenen Accounts machen die Zuordnung trivial)
- Mannschaftswert-Meilenstein-Schwellen (Annahme 100/150/200/250/300M)
- Händchen: exakte Pair-Semantik (FIFO vs. Aggregat) — für Konkurrenten
  ohnehin nur kalibrierte Rate
- Multi-Season-Ligen: Vorsaison-Terme unbekannt → Modell nur für die laufende
  Saison einer frisch gestarteten Liga scharf (unser Use-Case)
