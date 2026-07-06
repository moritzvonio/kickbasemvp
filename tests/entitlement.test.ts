/**
 * Tests für Saison-/Testphasen-Logik (lib/season.ts) und den Entitlement-Plan-Type.
 * Rein deterministisch — keine Cookies/KV nötig (currentHalfSeason nimmt `now`,
 * trialEndFor rechnet nur gegen fixe Stichtage).
 */
import { describe, expect, it } from "vitest";
import {
  SEASON_2627,
  berlinMidnight,
  currentHalfSeason,
  halfSeasonEnd,
  trialEndFor,
} from "../lib/season";
import type { Plan } from "../lib/entitlement";

const DAY = 86_400_000;

describe("berlinMidnight", () => {
  it("Sommerzeit: 28.08.2026 00:00 Berlin = 27.08.2026 22:00 UTC (+2h)", () => {
    expect(berlinMidnight("2026-08-28").toISOString()).toBe("2026-08-27T22:00:00.000Z");
  });
  it("Winterzeit: 31.01.2027 00:00 Berlin = 30.01.2027 23:00 UTC (+1h)", () => {
    expect(berlinMidnight("2027-01-31").toISOString()).toBe("2027-01-30T23:00:00.000Z");
  });
});

describe("trialEndFor", () => {
  it("Login weit vor Saisonstart → trialHardEnd (Spieltag 2)", () => {
    const end = trialEndFor("2026-07-06T10:00:00.000Z");
    expect(end.getTime()).toBe(berlinMidnight(SEASON_2627.trialHardEnd).getTime());
  });
  it("Später-Einsteiger → Login + 14 Tage, wenn das nach trialHardEnd liegt", () => {
    const login = "2026-10-01T12:00:00.000Z";
    expect(trialEndFor(login).getTime()).toBe(Date.parse(login) + 14 * DAY);
  });
  it("Grenzfall Login + 14 == trialHardEnd → trialHardEnd (max, nicht doppelt)", () => {
    const hardEnd = berlinMidnight(SEASON_2627.trialHardEnd).getTime();
    const login = new Date(hardEnd - 14 * DAY).toISOString();
    expect(trialEndFor(login).getTime()).toBe(hardEnd);
  });
});

describe("currentHalfSeason", () => {
  it("vor Hinrunden-Ende → hinrunde-2627", () => {
    const cs = currentHalfSeason(new Date("2026-09-01T00:00:00Z"));
    expect(cs.key).toBe("hinrunde-2627");
    expect(cs.end.getTime()).toBe(halfSeasonEnd("hinrunde-2627").getTime());
  });
  it("nach Hinrunden-Ende → rueckrunde-2627", () => {
    const cs = currentHalfSeason(new Date("2027-03-01T00:00:00Z"));
    expect(cs.key).toBe("rueckrunde-2627");
    expect(cs.end.getTime()).toBe(halfSeasonEnd("rueckrunde-2627").getTime());
  });
  it("exakt am Hinrunden-Ende ist das Ende EXKLUSIV → rueckrunde-2627", () => {
    const cs = currentHalfSeason(halfSeasonEnd("hinrunde-2627"));
    expect(cs.key).toBe("rueckrunde-2627");
  });
});

describe("Entitlement-Plan-Union", () => {
  it("akzeptiert neue Halbserien-Keys UND Legacy-Werte (Abwärtskompatibilität)", () => {
    const plans: Plan[] = ["hinrunde-2627", "rueckrunde-2627", "monthly", "season"];
    expect(plans).toHaveLength(4);
  });
});
