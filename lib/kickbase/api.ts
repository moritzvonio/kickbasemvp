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
   * Loops until the response returns fewer items than `pageSize`.
   * Safety cap to prevent infinite loops on broken APIs.
   */
  async activitiesAll(
    token: string,
    leagueId: string,
    opts?: { filter?: string; pageSize?: number; maxPages?: number }
  ): Promise<import("./types").KbActivity[]> {
    const pageSize = opts?.pageSize ?? 200;
    const maxPages = opts?.maxPages ?? 60; // 60 × 200 = 12k events safety cap
    const all: import("./types").KbActivity[] = [];

    for (let page = 0; page < maxPages; page++) {
      const start = page * pageSize;
      let resp;
      try {
        resp = await kbFetch<KbActivitiesFeed>(
          `/v4/leagues/${leagueId}/activitiesFeed`,
          {
            token,
            query: {
              start,
              max: pageSize,
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
      all.push(...batch);
      if (batch.length < pageSize) break;
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
   * managerTransfer typically returns the full list, but we paginate to be safe.
   */
  async managerTransferAll(
    token: string,
    leagueId: string,
    managerId: string,
    opts?: { pageSize?: number; maxPages?: number }
  ): Promise<import("./types").KbManagerTransfer[]> {
    const pageSize = opts?.pageSize ?? 100;
    const maxPages = opts?.maxPages ?? 30;
    const all: import("./types").KbManagerTransfer[] = [];

    for (let page = 0; page < maxPages; page++) {
      const start = page * pageSize;
      let resp;
      try {
        resp = await kbFetch<import("./types").KbManagerTransferResponse>(
          `/v4/leagues/${leagueId}/managers/${managerId}/transfer`,
          {
            token,
            query: { start, max: pageSize },
          }
        );
      } catch {
        break;
      }
      const batch = resp.it ?? [];
      if (batch.length === 0) break;
      all.push(...batch);
      if (batch.length < pageSize) break;
    }

    // Dedup just in case (some APIs return overlapping pages)
    const seen = new Set<string>();
    return all.filter((t) => {
      const key = `${t.pi}|${t.dt}|${t.tty}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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
