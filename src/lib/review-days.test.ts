import { describe, expect, it } from "vitest";
import { reviewDays } from "./review-days";

const session = { accountId: "account-1", accountName: "Practice", day: "2026-11-06", images: [{ id: "chart-1", url: "https://example.com/chart-1" }] };

describe("review session chart access", () => {
  it("includes chart days without a bias and links to comparison by account and day", () => {
    const [day] = reviewDays([], [session]);
    expect(day.hasBias).toBe(false);
    expect(day.images).toEqual(session.images);
    expect(day.comparisonHref).toBe("/app/plans/compare?account=account-1&date=2026-11-06");
  });
  it("merges trade and hindsight charts for the same session without duplicating charts", () => {
    const result = reviewDays([], [session, { ...session, images: [...session.images, { id: "hindsight", url: "https://example.com/hindsight" }] }]);
    expect(result).toHaveLength(1);
    expect(result[0].images).toHaveLength(2);
    expect(session.images).toHaveLength(1);
  });
  it("preserves the original expectation and plan link for days with a bias", () => {
    const [day] = reviewDays([{ ...session, id: "plan-1", bias: "Bullish", thesis: "Wait", drawOnLiquidity: null }], [session]);
    expect(day.hasBias).toBe(true);
    expect(day.comparisonHref).toBe("/app/plans/plan-1");
    expect(day.bias).toBe("Bullish");
  });
  it("keeps accounts and dates separate and includes sessions without screenshots", () => {
    const result = reviewDays([], [session, { ...session, accountId: "account-2" }, { ...session, day: "2026-11-05", images: [] }]);
    expect(result).toHaveLength(3);
    expect(result[2].day).toBe("2026-11-05");
    expect(new Set(result.map(day => day.id)).size).toBe(3);
  });
});
