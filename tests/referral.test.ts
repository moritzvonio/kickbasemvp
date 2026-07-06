import { describe, expect, it } from "vitest";
import {
  extendReferralBonus,
  creditReferral,
  getReferral,
  REFERRAL_CAP,
} from "../lib/referral";

const DAY = 86_400_000;

describe("extendReferralBonus", () => {
  it("ohne bestehenden Bonus → now + 14 Tage", () => {
    const now = new Date("2026-09-01T12:00:00.000Z");
    expect(extendReferralBonus(null, now)).toBe(
      new Date(now.getTime() + 14 * DAY).toISOString()
    );
  });
  it("bestehender Bonus in Zukunft → um 14 Tage verlängert", () => {
    const now = new Date("2026-09-01T12:00:00.000Z");
    const existing = new Date(now.getTime() + 5 * DAY).toISOString();
    expect(extendReferralBonus(existing, now)).toBe(
      new Date(now.getTime() + 19 * DAY).toISOString()
    );
  });
  it("abgelaufener Bonus → zählt ab jetzt neu (now + 14 Tage)", () => {
    const now = new Date("2026-09-01T12:00:00.000Z");
    const existing = new Date(now.getTime() - 5 * DAY).toISOString();
    expect(extendReferralBonus(existing, now)).toBe(
      new Date(now.getTime() + 14 * DAY).toISOString()
    );
  });
});

describe("creditReferral (Cap)", () => {
  it("erste Gutschrift setzt Zähler auf 1 + Bonus", async () => {
    const ref = "reftest-one";
    await creditReferral(ref);
    const info = await getReferral(ref);
    expect(info.count).toBe(1);
    expect(info.bonusUntil).toBeInstanceOf(Date);
  });
  it("deckelt bei 3 – die 4. Gutschrift ändert nichts", async () => {
    const ref = "reftest-cap";
    for (let i = 0; i < REFERRAL_CAP + 1; i++) await creditReferral(ref);
    const info = await getReferral(ref);
    expect(info.count).toBe(REFERRAL_CAP);
  });
});
