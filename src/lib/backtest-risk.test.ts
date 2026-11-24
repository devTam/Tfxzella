import { describe, expect, it } from "vitest";
import { backtestRiskReward } from "./backtest-risk";

describe("backtestRiskReward", () => {
  it.each([
    { direction: "LONG" as const, entry: 100, stop: 95, target: 115, exit: 105 },
    { direction: "SHORT" as const, entry: 100, stop: 105, target: 85, exit: 95 },
  ])("uses the take profit for $direction trades", trade => {
    const result = backtestRiskReward(trade);
    expect(result?.ratio.toNumber()).toBe(3);
    expect(result?.basis).toBe("Take profit");
  });

  it.each([
    { direction: "LONG" as const, exit: 110, expected: 2 },
    { direction: "LONG" as const, exit: 95, expected: -1 },
    { direction: "LONG" as const, exit: 100, expected: 0 },
    { direction: "SHORT" as const, exit: 90, expected: 2 },
    { direction: "SHORT" as const, exit: 105, expected: -1 },
  ])("falls back to signed exit reward for $direction at $exit", ({ direction, exit, expected }) => {
    const result = backtestRiskReward({ direction, entry: 100, stop: direction === "LONG" ? 95 : 105, target: null, exit });
    expect(result?.ratio.toNumber()).toBe(expected);
    expect(result?.basis).toBe("Exit");
  });

  it("handles missing levels and invalid stops without dividing by zero", () => {
    const trade = { direction: "LONG" as const, entry: "100", stop: "95", target: null, exit: "110" };
    for (const values of [{ stop: null }, { stop: "100" }, { stop: "105" }, { exit: null }]) {
      expect(backtestRiskReward({ ...trade, ...values })).toBeNull();
    }
  });
});
