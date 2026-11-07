import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CompareDay from "@/app/app/plans/compare/page";
import PlanComparison from "@/app/app/plans/[id]/page";
import { newYorkDayEnd, newYorkDayStart } from "./time";

const mocks = vi.hoisted(() => ({ plan: vi.fn(), account: vi.fn(), reviews: vi.fn(), trades: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { tradingAccount: { findFirst: mocks.account }, tradePlan: { findFirst: mocks.plan }, review: { findMany: mocks.reviews }, trade: { findMany: mocks.trades } } }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("Not found"); } }));
vi.mock("@/lib/data", () => ({ viewer: async () => ({ id: "user-1" }) }));
vi.mock("@/lib/chart-images", () => ({ chartImageUrl: (key: string) => `https://example.com/${key}` }));
const hindsight = { symbol: "NQ", direction: "SHORT", entryTime: "09:45", rationale: "Wait for the liquidity sweep.", images: [{ objectKey: "chart-1" }, { objectKey: "chart-2" }] };
const render = async () => renderToStaticMarkup(await PlanComparison({ params: Promise.resolve({ id: "plan-1" }) }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.plan.mockResolvedValue({ id: "plan-1", accountId: "account-1", planDate: new Date("2026-11-01T00:00:00Z"), account: { id: "account-1", name: "Practice", currency: "USD" }, marketBias: "Bearish", thesis: "Bias thesis", watchlist: [], attachments: [] });
  mocks.account.mockResolvedValue({ id: "account-1", name: "Practice", currency: "USD" });
  mocks.trades.mockResolvedValue([]);
  mocks.reviews.mockResolvedValue([]);
});

describe("daily bias comparison", () => {
  it("shows saved hindsight below bias and before actual trades, scoped to the user's account and NY day", async () => {
    mocks.reviews.mockResolvedValue([{ id: "review-1", accountId: "account-1", metrics: { hindsightTrade: hindsight } }]);
    const html = await render();
    expect(html).not.toContain("Write daily review");
    expect(mocks.reviews).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "user-1", period: "DAILY", OR: [{ accountId: "account-1" }, { accountId: null }], startsAt: newYorkDayStart("2026-11-01"), endsAt: newYorkDayEnd("2026-11-01") } }));
    expect(html.indexOf("Bias thesis")).toBeLessThan(html.indexOf("Correct trade in hindsight"));
    expect(html.indexOf("Correct trade in hindsight")).toBeLessThan(html.indexOf("Actual trades taken"));
    for (const text of ["NQ", "SHORT", "09:45 New York", hindsight.rationale, "chart-1", "chart-2", "/app/reviews/review-1"]) expect(html).toContain(text);
  });
  it("omits hindsight when no review or hindsight was saved", async () => {
    const withoutReview = await render();
    expect(withoutReview).not.toContain("Correct trade in hindsight");
    expect(withoutReview).toContain("Write daily review");
    mocks.reviews.mockResolvedValue([{ id: "review-1", metrics: {} }]);
    const withReview = await render();
    expect(withReview).not.toContain("Correct trade in hindsight");
    expect(withReview).not.toContain("Write daily review");
  });
  it("supports a no-trade decision and legacy chart in an all-accounts review", async () => {
    mocks.reviews.mockResolvedValue([{ id: "review-1", accountId: null, metrics: { hindsightTrade: { ...hindsight, direction: "NO_TRADE", images: undefined, image: { objectKey: "legacy-chart" } } } }]);
    const html = await render();
    expect(html).toContain("No trade</b>");
    expect(html).toContain("All accounts");
    expect(html).not.toContain("Write daily review");
    expect(html).toContain("legacy-chart");
  });
});

describe("comparison without a daily bias", () => {
  const compare = () => CompareDay({ searchParams: Promise.resolve({ account: "account-1", date: "2026-11-06" }) });
  it("shows saved hindsight charts without requiring or creating a plan", async () => {
    mocks.plan.mockResolvedValue(null);
    mocks.reviews.mockResolvedValue([{ id: "review-1", accountId: "account-1", metrics: { hindsightTrade: hindsight } }]);
    const html = renderToStaticMarkup(await compare());
    expect(html).toContain("No daily bias recorded");
    expect(html).toContain("chart-1");
    expect(html).toContain("Actual trades taken");
    expect(html).toContain("Add daily bias");
    expect(html).not.toContain("Write daily review");
    expect(mocks.account).toHaveBeenCalledWith({ where: { id: "account-1", userId: "user-1" } });
    expect(mocks.trades.mock.calls[0][0].where).toMatchObject({ accountId: "account-1", account: { userId: "user-1" }, source: "LIVE", deletedAt: null });
  });
  it("shows trade screenshots even when neither bias nor review exists", async () => {
    mocks.plan.mockResolvedValue(null);
    mocks.trades.mockResolvedValue([{ id: "trade-1", instrument: { symbol: "NQ" }, direction: "SHORT", openedAt: new Date("2026-11-06T15:00:00Z"), status: "OPEN", averageEntry: "22000", netPnl: "0", followedPlan: null, attachments: [{ id: "image-1", objectKey: "trade-chart", timeframe: null }] }]);
    const html = renderToStaticMarkup(await compare());
    expect(html).toContain("trade-chart");
    expect(html).toContain("Actual trades taken · 1");
    expect(html).toContain("Write daily review");
  });
  it("rejects inaccessible accounts and invalid dates", async () => {
    mocks.account.mockResolvedValue(null);
    await expect(compare()).rejects.toThrow("Not found");
    expect(mocks.trades).not.toHaveBeenCalled();
    await expect(CompareDay({ searchParams: Promise.resolve({ account: "account-1", date: "2026-02-30" }) })).rejects.toThrow("Not found");
  });
});
