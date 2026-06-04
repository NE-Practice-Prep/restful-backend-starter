import { describe, expect, it } from "vitest";

import { addDays, getExpiryWindowDates } from "./expiry-windows.util";

describe("expiry-windows.util", () => {
  it("computes 30- and 90-day windows from a reference date", () => {
    const now = new Date("2026-06-01T08:00:00Z");
    const { in30Days, in90Days } = getExpiryWindowDates(now);

    expect(in30Days).toEqual(addDays(now, 30));
    expect(in90Days).toEqual(addDays(now, 90));
  });
});
