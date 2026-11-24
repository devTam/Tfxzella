import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QuickTradeForm } from "./quick-trade-form";

vi.mock("@/app/actions", () => ({ createTrade: vi.fn() }));
vi.mock("@/components/trade-screenshots", () => ({ TradeScreenshots: () => createElement("div", null, "Higher & lower timeframe charts") }));
vi.mock("@/components/confirm-submit-button", () => ({ SubmitButton: () => createElement("button", null, "Save trade") }));

describe("journal entry form priorities", () => {
  it("keeps required fields visible and moves instrument settings below the media", () => {
    const html = renderToStaticMarkup(createElement(QuickTradeForm, { accounts: [{ id: "a", name: "Practice", currency: "USD" }], playbooks: [], plans: [], tags: [], initialDate: "2026-11-06", initialEntryTime: "09:30", initialExitTime: "10:00" }));
    for (const name of ["accountId", "symbol", "quantity", "entry", "exit", "stopPrice", "targetPrice", "openedAt", "closedAt", "fees", "planId", "playbookId", "qualityGrade", "followedPlan", "mistakes", "newsOnDay", "lesson", "entryConditions", "stopPlan", "targetPlan", "videoUrl"]) expect(html).toContain(`name="${name}"`);
    for (const name of ["confidence", "emotion", "marketCondition", "initialRisk", "plannedEntry", "plannedStop", "plannedTarget", "maximumFavorablePrice", "maximumAdversePrice", "notes", "setup", "tagIds"]) expect(html).not.toContain(`name="${name}"`);
    expect(html.indexOf('name="planId"')).toBeLessThan(html.indexOf('name="entryConditions"'));
    expect(html.indexOf('name="qualityGrade"')).toBeLessThan(html.indexOf('name="videoUrl"'));
    expect(html.indexOf("Higher &amp; lower timeframe charts")).toBeLessThan(html.indexOf('name="multiplier"'));
    expect(html).toContain("Risk to reward");
    expect(html).toContain("Hold time: 30m");
  });
});
