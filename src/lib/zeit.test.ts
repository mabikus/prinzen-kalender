import { describe, expect, it } from "vitest";
import { uhrzeitLesen } from "./zeit";

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
