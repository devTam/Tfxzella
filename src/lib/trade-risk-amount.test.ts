import { describe, expect, it } from "vitest";
import { tradeRiskAmount } from "./trade-risk-amount";

describe("trade risk amount", () => {
  it.each([{ entry: 100, stop: 95 }, { entry: 100, stop: 105 }])("calculates position risk for entry $entry and stop $stop", ({ entry, stop }) => {
    expect(tradeRiskAmount({ entry, stop, quantity: 5, multiplier: 2 })?.toString()).toBe("50");
  });
  it("preserves decimal precision for fractional positions", () => {
    expect(tradeRiskAmount({ entry: "100.3", stop: "100.1", quantity: "0.5", multiplier: "10" })?.toString()).toBe("1");
  });
  it("handles a breakeven stop without treating zero risk as missing", () => {
    expect(tradeRiskAmount({ entry: 100, stop: 100, quantity: 2, multiplier: 1 })?.toString()).toBe("0");
  });
  it("does not invent risk when the stop or position size is missing or invalid", () => {
    const values = { entry: 100, stop: 95, quantity: 1, multiplier: 2 };
    for (const overrides of [{ stop: null }, { quantity: null }, { quantity: 0 }, { multiplier: -1 }]) {
      expect(tradeRiskAmount({ ...values, ...overrides })).toBeNull();
    }
  });
});
