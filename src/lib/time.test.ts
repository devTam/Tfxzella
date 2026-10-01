import { describe, expect, it } from "vitest";
import { fromNewYorkTime, newYorkDateKey, newYorkDateTimeValue } from "./time";

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
});
