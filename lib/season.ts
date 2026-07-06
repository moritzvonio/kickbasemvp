/**
 * Saison-Stichtage 26/27 + Halbserien-Logik.
 *
 * Alle Konstanten sind Kalendertage (YYYY-MM-DD). Grenzen werden als
 * 00:00 Europe/Berlin interpretiert und sind EXKLUSIV: der Zugang endet
 * mit Beginn des Stichtags.
 */

export const SEASON_2627 = {
  /** Saisonstart (Spieltag 1), 28.08.2026 */
  start: "2026-08-28",
  /** Ende der kostenlosen Testphase: Montag nach Spieltag 2 (ST2 erwartet 04.–06.09.) */
  trialHardEnd: "2026-09-07",
  // TODO: gegen offiziellen Spielplan verifizieren (WM-Kalender, Detail steht noch aus)
  /** Ende der Hinrunde (konservativ) */
  hinrundeEnd: "2027-01-31",
  /** Ende der Rückrunde / Saisonende */
  rueckrundeEnd: "2027-05-31",
} as const;

export type HalfSeasonKey = "hinrunde-2627" | "rueckrunde-2627";

const DAY_MS = 86_400_000;

/**
 * UTC-Instant für 00:00 Europe/Berlin eines Kalendertags (YYYY-MM-DD).
 * Robust gegen Sommer-/Winterzeit (Intl-basiert; DST-Wechsel liegt nie um Mitternacht,
 * und unsere Stichtage liegen ohnehin weit von den Umstellungen entfernt).
 */
export function berlinMidnight(isoDate: string): Date {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  const utcGuess = Date.UTC(y, m - 1, d, 0, 0, 0);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(new Date(utcGuess))) map[p.type] = p.value;
  const hour = map.hour === "24" ? 0 : Number(map.hour);
  const asBerlin = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    hour,
    Number(map.minute),
    Number(map.second)
  );
  const offsetMs = asBerlin - utcGuess;
  return new Date(utcGuess - offsetMs);
}

/** Ende (exklusiv) der angegebenen Halbserie als Date. */
export function halfSeasonEnd(key: HalfSeasonKey): Date {
  return berlinMidnight(
    key === "rueckrunde-2627" ? SEASON_2627.rueckrundeEnd : SEASON_2627.hinrundeEnd
  );
}

/** Aktuell laufende (bzw. zu verkaufende) Halbserie samt Ende-Datum. */
export function currentHalfSeason(now: Date = new Date()): { key: HalfSeasonKey; end: Date } {
  const hinEnd = halfSeasonEnd("hinrunde-2627");
  if (now < hinEnd) return { key: "hinrunde-2627", end: hinEnd };
  return { key: "rueckrunde-2627", end: halfSeasonEnd("rueckrunde-2627") };
}

/**
 * Ende der Testphase für einen User: max(trialHardEnd, ersterLogin + 14 Tage).
 * „Kostenlos bis Spieltag 2" ist das Launch-Messaging, der 14-Tage-Fallback
 * greift für Später-Einsteiger.
 */
export function trialEndFor(firstLoginIso: string): Date {
  const hardEnd = berlinMidnight(SEASON_2627.trialHardEnd);
  const firstLoginMs = Date.parse(firstLoginIso);
  const plus14 = Number.isFinite(firstLoginMs)
    ? new Date(firstLoginMs + 14 * DAY_MS)
    : hardEnd;
  return plus14 > hardEnd ? plus14 : hardEnd;
}
