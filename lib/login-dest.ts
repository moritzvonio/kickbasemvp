/**
 * Nur interne absolute Pfade als Redirect-Ziel zulassen (Open-Redirect-Schutz).
 * Blockt externe URLs (`https://…`), protokoll-relative (`//evil`) und
 * Backslash-Tricks (`/\evil`). Ungültig → undefined.
 */
export function safeNext(next: string | undefined): string | undefined {
  if (!next) return undefined;
  if (!next.startsWith("/")) return undefined;
  if (next.startsWith("//") || next.startsWith("/\\")) return undefined;
  return next;
}

/**
 * Ziel-Route nach erfolgreichem Login.
 * - `next`-Param hat Vorrang, aber nur wenn interner Pfad (safeNext).
 * - Genau eine Liga → direkt ins Liga-Dashboard (Time-to-Wow).
 * - Sonst (0, mehrere oder unbekannt) → Liga-Übersicht.
 */
export function loginDest(
  next: string | undefined,
  leagueCount: number | undefined,
  firstLeagueId: string | undefined
): string {
  const safe = safeNext(next);
  if (safe) return safe;
  if (leagueCount === 1 && firstLeagueId) return `/league/${firstLeagueId}`;
  return "/leagues";
}
