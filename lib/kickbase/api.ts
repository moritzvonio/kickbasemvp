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
        start: opts?.start,
        max: opts?.max,
        filter: opts?.filter,
      },
    });
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
  async managerSquad(token: string, leagueId: string, managerId: string) {
    return kbFetch<KbSquadResponse>(
      `/v4/leagues/${leagueId}/managers/${managerId}/squad`,
      { token }
    );
  },

  async managerTransfer(token: string, leagueId: string, managerId: string) {
    return kbFetch<unknown>(
      `/v4/leagues/${leagueId}/managers/${managerId}/transfer`,
      { token }
    );
  },
};
