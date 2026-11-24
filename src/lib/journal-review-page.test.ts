import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Decimal from "decimal.js";
import TradeReview from "@/app/app/journal/[id]/page";

const mocks = vi.hoisted(() => ({ trade: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { trade: { findFirst: mocks.trade } } }));
vi.mock("@/lib/data", () => ({ viewer: async () => ({ id: "owner" }) }));
vi.mock("@/components/trade-chart-gallery", () => ({ TradeChartGallery: () => createElement("div", null, "Chart gallery") }));

const trade = {
  id: "trade-b", accountId: "account-1", source: "LIVE", backtestSessionId: null,
  account: { name: "Practice", currency: "USD" }, instrument: { symbol: "MNQ", pointValue: new Decimal(2) },
  openedAt: new Date("2026-11-06T14:30:00Z"), closedAt: new Date("2026-11-06T15:00:00Z"),
  direction: "LONG", averageEntry: new Decimal(100), averageExit: new Decimal(110), stopPrice: new Decimal(95), targetPrice: new Decimal(115),
  netPnl: new Decimal(38.18), fees: new Decimal(1.82), quantity: new Decimal(2), playbook: { name: "Breakout" }, plan: { id: "plan-1" },
  qualityGrade: "A", followedPlan: true, mistakes: ["Early entry"], newsOnDay: "Jobs report", lesson: "Wait for confirmation", entryConditions: "Break of structure", stopPlan: "Below the low", targetPlan: "Prior high", videoUrl: "https://example.com/trade-video", attachments: [],
};
beforeEach(() => { vi.clearAllMocks(); mocks.trade.mockResolvedValueOnce(trade); });
const render = async () => renderToStaticMarkup(await TradeReview({ params: Promise.resolve({ id: "trade-b" }), searchParams: Promise.resolve({ account: "account-1", date: "2026-11-06", basis: "closed" }) }));

describe("journal review", () => {
  it("shows all priority fields and keeps account and date filters on next/previous links", async () => {
    mocks.trade.mockResolvedValueOnce({ id: "trade-c" }).mockResolvedValueOnce({ id: "trade-a" });
    const html = await render();
    for (const value of ["Amount risked (before fees)", "$20.00", "Net P&amp;L (actual)", "$38.18", "Entry time (New York)", "Exit time (New York)", "Risk to reward", "1:3.00", "Stop loss points", "5 pts", "Take profit points", "15 pts", "Profit / loss points (actual)", "10 pts", "Hold time", "30m", "Quantity", "Commissions &amp; fees", "Trade quality", "Followed plan", "Early entry", "Jobs report", "Wait for confirmation", "Break of structure", "Below the low", "Prior high", "Chart gallery", "https://example.com/trade-video", "/app/plans/plan-1"]) expect(html).toContain(value);
    expect(html).toContain('/app/journal/trade-c?account=account-1&amp;date=2026-11-06&amp;basis=closed');
    expect(html).toContain('/app/journal/trade-a?account=account-1&amp;date=2026-11-06&amp;basis=closed');
    const [previous, next] = mocks.trade.mock.calls.slice(1).map(call => call[0]);
    for (const query of [previous, next]) expect(query.where.AND[0]).toMatchObject({ account: { userId: "owner" }, accountId: "account-1", source: "LIVE", deletedAt: null });
    expect(previous.orderBy).toEqual([{ openedAt: "asc" }, { id: "asc" }]);
    expect(next.orderBy).toEqual([{ openedAt: "desc" }, { id: "desc" }]);
  });
  it("disables both directions when there are no adjacent trades", async () => {
    mocks.trade.mockResolvedValue(null);
    const html = await render();
    expect(html.match(/<button[^>]*disabled/g)).toHaveLength(2);
    expect(html).not.toContain("/app/journal/trade-a");
  });
});
