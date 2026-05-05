/**
 * Typed wrappers around the Kickbase v4 endpoints we actually use.
 * Source of truth: /docs/kickbase-openapi.json (147 endpoints, v4.5.0).
 */

import { kbFetch } from "./client";
import type {
  KbLoginRequest,
  KbLoginResponse,
  KbLeagueSelection,
  KbLeaguesResponse,
  KbLeagueOverview,
  KbMeInLeague,
  KbRankingResponse,
  KbSquadResponse,
  KbMarketResponse,
  KbActivitiesFeed,
  KbPlayerDetails,
  KbMarketValueHistory,
  KbPerformanceResponse,
} from "./types";

export const kb = {
  // ── Auth ───────────────────────────────────────────────
  async login(creds: KbLoginRequest) {
    return kbFetch<KbLoginResponse>("/v4/user/login", { body: creds });
  },

  async me(token: string) {
    return kbFetch<unknown>("/v4/user/me", { token });
  },

  // ── Leagues ────────────────────────────────────────────
  /**
   * List the user's leagues. The API returns the same shape from /leagues
   * and /leagues/selection — we hit /selection because it's the one that
   * returns featured + joined leagues for the auth'd user.
   */
  async leagues(token: string) {
    return kbFetch<KbLeagueSelection>("/v4/leagues/selection", { token });
  },

  async leaguesList(token: string) {
    return kbFetch<KbLeaguesResponse>("/v4/leagues", { token });
  },

  async leagueOverview(token: string, leagueId: string, includeManagers = true) {
    return kbFetch<KbLeagueOverview>(`/v4/leagues/${leagueId}/overview`, {
      token,
      query: { includeManagersAndBattles: includeManagers },
    });
  },

  async meInLeague(token: string, leagueId: string) {
    return kbFetch<KbMeInLeague>(`/v4/leagues/${leagueId}/me`, { token });
  },

  async ranking(token: string, leagueId: string, dayNumber?: number) {
    return kbFetch<KbRankingResponse>(`/v4/leagues/${leagueId}/ranking`, {
      token,
      query: { dayNumber },
    });
  },

  // ── Squad / Lineup ─────────────────────────────────────
  async squad(token: string, leagueId: string) {
    return kbFetch<KbSquadResponse>(`/v4/leagues/${leagueId}/squad`, { token });
  },

  async lineup(token: string, leagueId: string) {
    return kbFetch<unknown>(`/v4/leagues/${leagueId}/lineup`, { token });
  },

  async lineupOverview(token: string, leagueId: string) {
    return kbFetch<import("./types").KbLineupOverview>(
      `/v4/leagues/${leagueId}/lineup/overview`,
      { token }
    );
  },

  // ── Market ─────────────────────────────────────────────
  async market(token: string, leagueId: string) {
    return kbFetch<KbMarketResponse>(`/v4/leagues/${leagueId}/market`, { token });
  },

  // ── Activity feed ──────────────────────────────────────
  async activities(
    token: string,
    leagueId: string,
    opts?: { start?: number; max?: number; filter?: string }
  ) {
    return kbFetch<KbActivitiesFeed>(`/v4/leagues/${leagueId}/activitiesFeed`, {
      token,
      query: {
        start: opts?.start ?? 0,
        max: opts?.max ?? 50,
        filter: opts?.filter,
        // Cache-bust: force a fresh round-trip every time, ignoring any CDN/edge cache
        _t: Date.now(),
      },
    });
  },

  /**
   * Paginated fetch of ALL activities since league start.
   *
   * IMPORTANT: Kickbase ignoriert `max` und liefert eine fixe Page-Size
   * (typischerweise 25). Wir paginieren anhand der ECHTEN batch-Größe,
   * nicht anhand unseres requested `max`. Stop-Bedingung: leeres batch
   * ODER zwei Seiten in Folge mit identischen IDs (API gibt das Ende zurück).
   */
  async activitiesAll(
    token: string,
    leagueId: string,
    opts?: { filter?: string; maxIterations?: number }
  ): Promise<import("./types").KbActivity[]> {
    const maxIterations = opts?.maxIterations ?? 200; // 200 × ~25 = 5000 events safety
    const all: import("./types").KbActivity[] = [];
    const seenIds = new Set<string>();
    let start = 0;

    for (let i = 0; i < maxIterations; i++) {
      let resp;
      try {
        resp = await kbFetch<KbActivitiesFeed>(
          `/v4/leagues/${leagueId}/activitiesFeed`,
          {
            token,
            query: {
              start,
              max: 100,
              filter: opts?.filter,
              _t: Date.now(),
            },
          }
        );
      } catch {
        break;
      }
      const batch = resp.af ?? resp.it ?? [];
      if (batch.length === 0) break;

      // Add only new entries (defensive against API quirks)
      let newCount = 0;
      for (const a of batch) {
        if (!seenIds.has(a.i)) {
          seenIds.add(a.i);
          all.push(a);
          newCount++;
        }
      }
      // If the API returned no new items, we're at the end
      if (newCount === 0) break;
      // Advance start by the actual batch size (not our requested max)
      start += batch.length;
    }

    return all;
  },

  // ── Player ─────────────────────────────────────────────
  async player(token: string, leagueId: string, playerId: string) {
    return kbFetch<KbPlayerDetails>(`/v4/leagues/${leagueId}/players/${playerId}`, { token });
  },

  async marketValue(token: string, leagueId: string, playerId: string, days = 92) {
    // Some deployments accept lower-case `marketvalue`, others camelCase.
    return kbFetch<KbMarketValueHistory>(
      `/v4/leagues/${leagueId}/players/${playerId}/marketvalue/${days}`,
      { token }
    );
  },

  async performance(token: string, leagueId: string, playerId: string) {
    return kbFetch<KbPerformanceResponse>(
      `/v4/leagues/${leagueId}/players/${playerId}/performance`,
      { token }
    );
  },

  // ── Manager (other players in the league) ──────────────
  // ── Competition (Bundesliga-wide) ──────────────────────
  async competitionTable(token: string, competitionId = "1") {
    return kbFetch<import("./types").KbCompetitionTable>(
      `/v4/competitions/${competitionId}/table`,
      { token }
    );
  },

  async competitionPlayers(
    token: string,
    competitionId = "1",
    opts?: { position?: number | string; sorting?: string }
  ) {
    return kbFetch<import("./types").KbCompetitionPlayersResponse>(
      `/v4/competitions/${competitionId}/players`,
      {
        token,
        query: {
          position: opts?.position,
          sorting: opts?.sorting,
        },
      }
    );
  },

  async managerSquad(token: string, leagueId: string, managerId: string) {
    return kbFetch<import("./types").KbManagerSquadResponse>(
      `/v4/leagues/${leagueId}/managers/${managerId}/squad`,
      { token }
    );
  },

  async managerTransfer(token: string, leagueId: string, managerId: string, opts?: { start?: number; max?: number }) {
    return kbFetch<import("./types").KbManagerTransferResponse>(
      `/v4/leagues/${leagueId}/managers/${managerId}/transfer`,
      {
        token,
        query: {
          start: opts?.start,
          max: opts?.max,
        },
      }
    );
  },

  /**
   * Paginated fetch of ALL transfers for a manager since league start.
   *
   * IMPORTANT: Endpoint nimmt nur `start`, NICHT `max`. Liefert fix 25
   * Einträge pro Page. Wir incrementen `start` um die ECHTE batch-Größe
   * und stoppen wenn ein batch keine neuen IDs bringt oder leer ist.
   */
  async managerTransferAll(
    token: string,
    leagueId: string,
    managerId: string,
    opts?: { maxIterations?: number }
  ): Promise<import("./types").KbManagerTransfer[]> {
    const maxIterations = opts?.maxIterations ?? 100; // 100 × ~25 = 2500 transfers
    const all: import("./types").KbManagerTransfer[] = [];
    const seen = new Set<string>();
    let start = 0;

    for (let i = 0; i < maxIterations; i++) {
      let resp;
      try {
        resp = await kbFetch<import("./types").KbManagerTransferResponse>(
          `/v4/leagues/${leagueId}/managers/${managerId}/transfer`,
          { token, query: { start } }
        );
      } catch {
        break;
      }
      const batch = resp.it ?? [];
      if (batch.length === 0) break;

      let newCount = 0;
      for (const t of batch) {
        const key = `${t.pi}|${t.dt}|${t.tty}`;
        if (!seen.has(key)) {
          seen.add(key);
          all.push(t);
          newCount++;
        }
      }
      if (newCount === 0) break;
      start += batch.length;
    }

    return all;
  },

  async managerDashboard(token: string, leagueId: string, managerId: string) {
    return kbFetch<import("./types").KbManagerDashboard>(
      `/v4/leagues/${leagueId}/managers/${managerId}/dashboard`,
      { token }
    );
  },

  async leagueOverviewWithManagers(token: string, leagueId: string) {
    return kbFetch<KbLeagueOverview>(`/v4/leagues/${leagueId}/overview`, {
      token,
      query: { includeManagersAndBattles: true },
    });
  },
};
