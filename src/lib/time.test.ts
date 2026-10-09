import { describe, expect, it } from "vitest";
import { dateOnlyValue, formatDateOnly, formatNewYorkDateTime, fromNewYorkTime, isSameTradingDay, newYorkDateKey, newYorkDateTimeValue, newYorkTimeValue } from "./time";

describe("New York time policy", () => {
  it("interprets winter and summer wall-clock times with DST", () => {
    expect(fromNewYorkTime("2026-01-15T09:30").toISOString()).toBe("2026-01-15T14:30:00.000Z");
    expect(fromNewYorkTime("2026-07-15T09:30").toISOString()).toBe("2026-07-15T13:30:00.000Z");
  });

  it("formats instants back into New York values", () => {
    const instant = new Date("2026-10-02T02:30:00.000Z");
    expect(newYorkDateKey(instant)).toBe("2026-10-01");
    expect(newYorkDateTimeValue(instant)).toBe("2026-10-01T22:30");
  });

  it("compares trading days in the account timezone", () => {
    const now = new Date("2026-10-02T02:30:00.000Z");
    expect(isSameTradingDay(new Date("2026-10-01T14:00:00.000Z"), now, "America/New_York")).toBe(true);
    expect(isSameTradingDay(new Date("2026-10-02T05:00:00.000Z"), now, "America/New_York")).toBe(false);
  });

  it("renders recorded timestamps in New York instead of the server timezone", () => {
    const instant = new Date("2026-07-15T13:30:00.000Z");
    expect(newYorkTimeValue(instant)).toBe("09:30");
    expect(formatNewYorkDateTime(instant)).toContain("9:30 AM");
  });

  it("keeps date-only fields unchanged", () => {
    const date = new Date("2026-10-01T00:00:00.000Z");
    expect(dateOnlyValue(date)).toBe("2026-10-01");
    expect(formatDateOnly(date)).toBe("10/1/26");
  });
});
