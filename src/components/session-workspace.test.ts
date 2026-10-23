import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SessionWorkspace } from "./session-workspace";

const mocks = vi.hoisted(() => ({ plan: vi.fn(), trades: vi.fn(), reviews: vi.fn(), goal: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { tradePlan: { findFirst: mocks.plan }, trade: { findMany: mocks.trades }, review: { findMany: mocks.reviews, findFirst: mocks.goal } } }));
const props = { userId: "user-1", accounts: [{ id: "account-1", name: "Practice" }], accountId: "account-1", date: "2026-10-23" };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.plan.mockResolvedValue(null);
  mocks.trades.mockResolvedValue([]);
  mocks.reviews.mockResolvedValue([]);
  mocks.goal.mockResolvedValue(null);
});

describe("session workspace", () => {
  it("guides an empty account without treating no trades as success", async () => {
    const html = renderToStaticMarkup(await SessionWorkspace(props));
    expect(html).toContain("Prepare daily bias");
    expect(html).toContain("Write daily review");
    expect(html).toContain("Missing records do not mean mistake-free trading.");
    expect(html).not.toContain("100%");
    expect(mocks.trades.mock.calls[0][0].where).toMatchObject({accountId:"account-1",account:{userId:"user-1"},source:"LIVE",deletedAt:null});
    expect(mocks.trades.mock.calls[1][0]).toMatchObject({take:40,where:{accountId:"account-1",account:{userId:"user-1"},source:"LIVE"}});
  });
  it("connects saved preparation, unfinished reflection, and prior goals", async () => {
    mocks.plan.mockResolvedValue({id:"plan-1",marketBias:"Bullish",thesis:"Wait for confirmation",_count:{attachments:1}});
    mocks.goal.mockResolvedValue({id:"review-prior",goals:"Record confirmation before entering",period:"DAILY",accountId:"account-1"});
    mocks.trades.mockResolvedValueOnce([{id:"trade-1",openedAt:new Date("2026-10-22T15:00:00Z"),closedAt:new Date("2026-10-23T16:00:00Z"),followedPlan:null,lesson:null}]).mockResolvedValueOnce([]);
    const html=renderToStaticMarkup(await SessionWorkspace(props));
    expect(html).toContain("0 opened · 1 closed");
    expect(html).toContain("1 closed trade needs");
    expect(html).toContain("Record confirmation before entering");
    expect(html).toContain('/app/plans/plan-1');
    expect(html).toContain('account=account-1&amp;date=2026-10-23&amp;status=needs-review&amp;basis=closed');
  });
  it("offers the saved daily review and an account setup path", async () => {
    mocks.reviews.mockResolvedValue([{id:"review-today"}]);
    expect(renderToStaticMarkup(await SessionWorkspace(props))).toContain('/app/reviews/review-today');
    vi.clearAllMocks();
    const html=renderToStaticMarkup(await SessionWorkspace({...props,accounts:[],accountId:undefined}));
    expect(html).toContain("Set up account");
    expect(mocks.trades).not.toHaveBeenCalled();
  });
});
