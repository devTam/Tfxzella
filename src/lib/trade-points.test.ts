import { describe, expect, it } from "vitest";
import { formatPoints, tradePoints } from "./trade-points";

describe("trade point distances", () => {
  it.each([
    { direction: "LONG" as const, entry: "100.25", stop: "95", target: "115.5", exit: "110.75" },
    { direction: "SHORT" as const, entry: "100.25", stop: "105.5", target: "85", exit: "89.75" },
  ])("calculates stop, target and actual points for $direction", values => {
    const points = tradePoints(values);
    expect(formatPoints(points.stop)).toBe("5.25 pts");
    expect(formatPoints(points.target)).toBe("15.25 pts");
    expect(formatPoints(points.profit)).toBe("10.5 pts");
  });
  it.each([
    { direction: "LONG" as const, exit: 95 },
    { direction: "SHORT" as const, exit: 105 },
  ])("preserves losses instead of showing absolute profit for $direction", ({ direction, exit }) => {
    expect(formatPoints(tradePoints({ entry: 100, stop: null, target: null, exit, direction }).profit)).toBe("-5 pts");
  });
  it("shows breakeven and missing levels distinctly", () => {
    const points = tradePoints({ entry: 100, stop: 100, target: null, exit: 100, direction: "LONG" });
    expect(formatPoints(points.stop)).toBe("0 pts");
    expect(formatPoints(points.profit)).toBe("0 pts");
    expect(formatPoints(points.target)).toBe("Not recorded");
  });
});
