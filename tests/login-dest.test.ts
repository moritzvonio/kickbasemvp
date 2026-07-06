import { describe, expect, it } from "vitest";
import { loginDest } from "../lib/login-dest";

describe("loginDest", () => {
  it("next-Param hat immer Vorrang", () => {
    expect(loginDest("/league/42/wettbewerb", 1, "7")).toBe("/league/42/wettbewerb");
    expect(loginDest("/account", 3, "7")).toBe("/account");
  });
  it("genau eine Liga → direkt ins Dashboard", () => {
    expect(loginDest(undefined, 1, "6871934")).toBe("/league/6871934");
  });
  it("mehrere Ligen → Übersicht", () => {
    expect(loginDest(undefined, 3, "6871934")).toBe("/leagues");
  });
  it("0 Ligen oder unbekannt → Übersicht", () => {
    expect(loginDest(undefined, 0, undefined)).toBe("/leagues");
    expect(loginDest(undefined, undefined, undefined)).toBe("/leagues");
  });
  it("eine Liga aber keine firstLeagueId → Übersicht (defensiv)", () => {
    expect(loginDest(undefined, 1, undefined)).toBe("/leagues");
  });
});
