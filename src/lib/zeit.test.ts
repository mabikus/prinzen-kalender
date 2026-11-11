import { describe, expect, it } from "vitest";
import { berlinZeitpunkt, uhrzeitLesen } from "./zeit";

describe("uhrzeitLesen", () => {
  it.each([
    ["17", "17:00"],
    ["9", "09:00"],
    ["1730", "17:30"],
    ["930", "09:30"],
    ["17:30", "17:30"],
    ["17.30", "17:30"],
    ["17,30", "17:30"],
    ["17h30", "17:30"],
    ["17 30", "17:30"],
    ["17:3", "17:30"],
    ["0", "00:00"],
    ["17:00 Uhr", "17:00"],
  ])("%s → %s", (ein, aus) => expect(uhrzeitLesen(ein)).toBe(aus));

  it.each(["", "24", "1760", "abc", "17:", "12345"])("%s ist ungültig", (ein) => expect(uhrzeitLesen(ein)).toBeNull());
});

describe("berlinZeitpunkt", () => {
  it("Winterzeit (UTC+1)", () => expect(berlinZeitpunkt("2026-11-13", "18:15").toISOString()).toBe("2026-11-13T17:15:00.000Z"));
  it("Sommerzeit (UTC+2)", () => expect(berlinZeitpunkt("2026-07-01", "18:15").toISOString()).toBe("2026-07-01T16:15:00.000Z"));
  it("Rosenmontag 2027", () => expect(berlinZeitpunkt("2027-02-08", "11:11").toISOString()).toBe("2027-02-08T10:11:00.000Z"));
});
