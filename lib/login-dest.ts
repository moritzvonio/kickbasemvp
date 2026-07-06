/**
 * Ziel-Route nach erfolgreichem Login.
 * - `next`-Param hat immer Vorrang.
 * - Genau eine Liga → direkt ins Liga-Dashboard (Time-to-Wow).
 * - Sonst (0, mehrere oder unbekannt) → Liga-Übersicht.
 */
export function loginDest(
  next: string | undefined,
  leagueCount: number | undefined,
  firstLeagueId: string | undefined
): string {
  if (next) return next;
  if (leagueCount === 1 && firstLeagueId) return `/league/${firstLeagueId}`;
  return "/leagues";
}
