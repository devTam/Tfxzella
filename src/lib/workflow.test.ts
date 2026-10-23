import { describe, expect, it } from "vitest";
import { learningSummary, workflowDate, workflowHref } from "./workflow";
import { newYorkDateKey } from "./time";

describe("session navigation", () => {
  it("keeps account and date safely encoded across steps", () => {
    expect(workflowHref("/app/reviews", "account&other", "2026-10-23")).toBe("/app/reviews?account=account%26other&date=2026-10-23");
    expect(workflowHref("/app")).toBe("/app");
  });
  it("accepts valid days and rejects impossible dates", () => {
    expect(workflowDate("2024-02-29")).toBe("2024-02-29");
    for (const value of ["2025-02-29", "2026-13-01", "bad", undefined]) expect(workflowDate(value)).toBe(newYorkDateKey());
  });
});
describe("learning progress", () => {
  it("does not treat unreviewed trades as either adherence or success", () => {
    const summary = learningSummary([
      { followedPlan: true, lesson: "Waited for confirmation", mistakes: [] },
      { followedPlan: false, lesson: "", mistakes: ["Early entry", "Early entry"] },
      { followedPlan: null, lesson: "Chased price", mistakes: ["Early entry"] },
    ]);
    expect(summary).toEqual({ total: 3, assessed: 2, reflected: 1, adherence: 50, coverage: 33, topMistake: {name:"Early entry",count:2} });
  });
  it("distinguishes no data from a zero rate", () => {
    expect(learningSummary([])).toMatchObject({adherence:null,coverage:null,topMistake:null});
    expect(learningSummary([{followedPlan:false,lesson:" ",mistakes:[]}])).toMatchObject({adherence:0,coverage:0,reflected:0});
  });
});
