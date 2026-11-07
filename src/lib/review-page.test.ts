import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Reviews from "@/app/app/reviews/page";

const mocks = vi.hoisted(() => ({ reviews: vi.fn(), trades: vi.fn(), plans: vi.fn(), form: vi.fn(() => null) }));
vi.mock("@/lib/db", () => ({ db: { review: { findMany: mocks.reviews }, trade: { findMany: mocks.trades }, tradePlan: { findMany: mocks.plans } } }));
vi.mock("@/lib/data", () => ({ viewer: async () => ({ id: "user-1" }), accounts: async () => [{ id: "account-1", name: "Practice" }] }));
vi.mock("@/lib/chart-images", () => ({ chartImageUrl: (key: string) => `https://example.com/${key}` }));
vi.mock("@/app/actions", () => ({ deleteReview: vi.fn() }));
vi.mock("@/components/review-form", () => ({ ReviewForm: mocks.form }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.plans.mockResolvedValue([]);
  mocks.reviews.mockResolvedValue([]);
  mocks.trades.mockResolvedValue([]);
});

describe("review page session sources", () => {
  it("offers comparison for open trade charts and daily-review charts without any bias", async () => {
    mocks.trades.mockResolvedValue([{ id: "trade-1", accountId: "account-1", account: { name: "Practice", currency: "USD" }, instrument: { symbol: "NQ" }, direction: "LONG", openedAt: new Date("2026-11-06T15:00:00Z"), closedAt: null, attachments: [{ id: "image-1", objectKey: "trade-chart" }] }]);
    mocks.reviews.mockResolvedValue([{ id: "review-1", accountId: "account-1", account: { currency: "USD" }, period: "DAILY", startsAt: new Date("2026-11-05T05:00:00Z"), endsAt: new Date("2026-11-06T04:59:59.999Z"), metrics: { hindsightTrade: { images: [{ objectKey: "review-chart" }] } } }]);
    renderToStaticMarkup(await Reviews({ searchParams: Promise.resolve({ date: "2026-11-06" }) }));
    const props = (mocks.form.mock.calls[0] as unknown as [{ plans: { day: string; images: { url: string }[]; comparisonHref: string; hasBias: boolean }[]; trades: unknown[] }])[0];
    expect(props.trades).toEqual([]);
    expect(props.plans).toHaveLength(2);
    expect(props.plans[0]).toMatchObject({ day: "2026-11-06", hasBias: false, comparisonHref: "/app/plans/compare?account=account-1&date=2026-11-06", images: [{ url: "https://example.com/trade-chart" }] });
    expect(props.plans[1]).toMatchObject({ day: "2026-11-05", hasBias: false, images: [{ url: "https://example.com/review-chart" }] });
    expect(mocks.trades.mock.calls[0][0].where).toEqual({ account: { userId: "user-1" }, source: "LIVE", deletedAt: null });
  });
});
