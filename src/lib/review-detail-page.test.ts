import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Decimal from "decimal.js";
import ReviewDetail from "@/app/app/reviews/[id]/page";

const mocks = vi.hoisted(() => ({ review: vi.fn(), trades: vi.fn(), plans: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { review: { findFirst: mocks.review }, trade: { findMany: mocks.trades }, tradePlan: { findMany: mocks.plans } } }));
vi.mock("@/lib/data", () => ({ viewer: async () => ({ id: "owner" }) }));
vi.mock("@/lib/chart-images", () => ({ chartImageUrl: (key: string) => `https://example.com/${key}` }));
vi.mock("@/components/trade-chart-gallery", () => ({ TradeChartGallery: ({ attachments }: { attachments: { objectKey: string }[] }) => createElement("div", null, attachments.map(image => image.objectKey).join(",")) }));

const review = { id: "review-b", userId: "owner", accountId: "account-1", account: { name: "Practice", currency: "USD" }, period: "DAILY", startsAt: new Date("2026-11-06T05:00:00Z"), endsAt: new Date("2026-11-07T04:59:59.999Z"), rating: 4,
  wins: "Good patience", mistakes: "Late exit", lessons: "Take the planned target", goals: "Wait for a pullback", notes: "Session notes", attachments: [{ objectKey: "review-chart" }],
  metrics: { trades: 1, netPnl: "18.18", winRate: "100", hindsightTrade: { symbol: "NQ", direction: "LONG", entryTime: "09:45", rationale: "Clean pullback", images: [{ objectKey: "hindsight-chart", mimeType: "image/png", size: 100 }] } },
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.review.mockResolvedValueOnce(review);
  mocks.trades.mockResolvedValue([]);
  mocks.plans.mockResolvedValue([]);
});
const render = async () => renderToStaticMarkup(await ReviewDetail({ params: Promise.resolve({ id: "review-b" }) }));

describe("review detail carousel", () => {
  it("shows expected plans, actual charts, hindsight and lessons in one review", async () => {
    mocks.review.mockResolvedValueOnce({ id: "review-c" }).mockResolvedValueOnce({ id: "review-a" });
    mocks.plans.mockResolvedValue([{ id: "plan-1", account: { name: "Practice", currency: "USD" }, planDate: new Date("2026-11-06T00:00:00Z"), marketBias: "Bullish", playbook: { name: "Pullback" }, thesis: "Expect continuation", drawOnLiquidity: "Prior high", plannedEntry: new Decimal(100), plannedStop: new Decimal(95), plannedTarget: new Decimal(110), entryConditions: "Wait for confirmation", stopPlan: "Below low", targetPlan: "At high", attachments: [{ objectKey: "expected-chart" }] }]);
    mocks.trades.mockResolvedValue([{ id: "trade-1", instrument: { symbol: "MNQ" }, account: { name: "Practice", currency: "USD" }, direction: "LONG", openedAt: new Date("2026-11-06T14:30:00Z"), closedAt: new Date("2026-11-06T15:00:00Z"), netPnl: new Decimal(18.18), averageEntry: new Decimal(100), averageExit: new Decimal(110), stopPrice: new Decimal(95), targetPrice: new Decimal(115), followedPlan: true, qualityGrade: "A", mistakes: [], lesson: "Wait for close", attachments: [{ objectKey: "actual-chart" }] }]);
    const html = await render();
    for (const value of ["What was expected", "Expect continuation", "expected-chart", "What was gotten", "MNQ", "actual-chart", "Stop loss points", "5 pts", "15 pts", "10 pts", "Trade that should have been taken", "Clean pullback", "hindsight-chart", "review-chart", "Good patience", "Late exit", "Take the planned target", "Wait for a pullback", "Session notes"]) expect(html).toContain(value);
    expect(html.indexOf("What was expected")).toBeLessThan(html.indexOf("More performance details"));
    expect(html.match(/href="\/app\/reviews\/review-a"/g)).toHaveLength(2);
    expect(html.match(/href="\/app\/reviews\/review-c"/g)).toHaveLength(2);
    const [previous, next] = mocks.review.mock.calls.slice(1).map(call => call[0]);
    expect(previous.where).toEqual({ userId: "owner", OR: [{ startsAt: { gt: review.startsAt } }, { startsAt: review.startsAt, id: { gt: "review-b" } }] });
    expect(next.where).toEqual({ userId: "owner", OR: [{ startsAt: { lt: review.startsAt } }, { startsAt: review.startsAt, id: { lt: "review-b" } }] });
    expect(mocks.plans.mock.calls[0][0].where).toEqual({ userId: "owner", accountId: "account-1", planDate: { gte: new Date("2026-11-06T00:00:00Z"), lte: new Date("2026-11-06T00:00:00Z") } });
    expect(mocks.trades.mock.calls[0][0].where).toMatchObject({ account: { userId: "owner" }, accountId: "account-1", source: "LIVE", deletedAt: null, closedAt: { gte: review.startsAt, lte: review.endsAt } });
  });
  it("disables boundary navigation and explains missing plans/trades", async () => {
    mocks.review.mockResolvedValue(null);
    const html = await render();
    expect(html.match(/<button[^>]*disabled/g)).toHaveLength(4);
    expect(html).toContain("No daily plans recorded");
    expect(html).toContain("No closed trades recorded");
  });
});
