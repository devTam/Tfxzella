import { describe, expect, it } from "vitest";
import { adjacentTradeWhere, journalFilters, journalReviewHref, journalWhere } from "./journal-view";

describe("journal review scope", () => {
  it("keeps owner, live source, account and closing-day reflection filters together", () => {
    const where = journalWhere("owner", { account: "account-1", date: "2026-11-06", status: "needs-review", basis: "closed" });
    expect(where).toMatchObject({ account: { userId: "owner" }, accountId: "account-1", source: "LIVE", deletedAt: null, closedAt: { gte: new Date("2026-11-06T05:00:00Z"), lte: new Date("2026-11-07T04:59:59.999Z") }, OR: [{ followedPlan: null }, { lesson: null }, { lesson: "" }] });
  });
  it("filters open trades by entry date even if closed basis was requested", () => {
    expect(journalFilters({ status: "open", basis: "closed" }).basis).toBe("opened");
    expect(journalWhere("owner", { status: "open" })).toMatchObject({ closedAt: null });
  });
  it("preserves filters in navigation links", () => {
    expect(journalReviewHref("trade-1", { account: "a", date: "2026-11-06", status: "needs-review", basis: "closed" })).toBe("/app/journal/trade-1?account=a&date=2026-11-06&status=needs-review&basis=closed");
  });
  it("uses IDs to distinguish trades opened at exactly the same time", () => {
    const trade = { id: "trade-b", openedAt: new Date("2026-11-06T14:30:00Z") };
    expect(adjacentTradeWhere(trade, true)).toEqual({ OR: [{ openedAt: { lt: trade.openedAt } }, { openedAt: trade.openedAt, id: { lt: "trade-b" } }] });
    expect(adjacentTradeWhere(trade, false)).toEqual({ OR: [{ openedAt: { gt: trade.openedAt } }, { openedAt: trade.openedAt, id: { gt: "trade-b" } }] });
  });
});
