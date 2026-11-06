import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ReviewTrades, type ReviewTrade } from "./review-trades";
import { newYorkDateKey } from "@/lib/time";

const trade = (id: string, closedAt: string, accountId = "account-1"): ReviewTrade => ({ id, symbol: id, accountId, direction: "LONG", dayKey: newYorkDateKey(new Date(closedAt)), tradeTime: "09:45", netPnl: "20", currency: "USD", lesson: "Wait for confirmation", checkedRules: [] });
const trades = [
  trade("Prior-Sunday", "2026-11-02T04:59:59Z"),
  trade("Monday", "2026-11-02T05:00:00Z"),
  trade("Friday", "2026-11-07T04:59:59Z"),
  trade("Saturday", "2026-11-07T05:00:00Z"),
  trade("Other-account", "2026-11-06T19:00:00Z", "account-2"),
];
const render = (startsAt: string, endsAt: string, accountId = "account-1") => renderToStaticMarkup(createElement(ReviewTrades, { trades, startsAt, endsAt, accountId }));

describe("review trade preview", () => {
  it("includes Monday through the end of Friday in the New York week", () => {
    const html = render("2026-11-02", "2026-11-06");
    expect(html).toContain("Monday");
    expect(html).toContain("Friday");
    expect(html).toContain("Closed 2026-11-06 · Entry time 09:45 New York");
    expect(html).not.toContain("Prior-Sunday");
    expect(html).not.toContain("Saturday");
    expect(html).not.toContain("Other-account");
  });
  it("keeps daily reviews limited to one day and supports all accounts", () => {
    const html = render("2026-11-06", "2026-11-06", "");
    expect(html).toContain("Friday");
    expect(html).toContain("Other-account");
    expect(html).not.toContain("Monday");
  });
  it("shows the full monthly range and an empty state outside available dates", () => {
    expect(render("2026-11-01", "2026-11-30")).toContain("Saturday");
    expect(render("2026-12-01", "2026-12-31")).toContain("No closed trades found for this period and account.");
  });
});
