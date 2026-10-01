import { describe, expect, it } from "vitest";
import { planForTradingDay } from "./plans";

describe("planForTradingDay", () => {
  const plans = [
    { id: "other-account", accountId: "account-2", planDate: "2026-09-10" },
    { id: "wrong-day", accountId: "account-1", planDate: "2026-09-11" },
    { id: "match", accountId: "account-1", planDate: "2026-09-10" },
  ];

  it("matches both the backtest account and selected trading date", () => {
    expect(planForTradingDay(plans, "account-1", "2026-09-10")?.id).toBe("match");
  });

  it("returns no plan when that account has no plan for the date", () => {
    expect(planForTradingDay(plans, "account-1", "2026-09-12")).toBeUndefined();
  });
});
