import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BacktestSessionPage from "@/app/app/backtests/[id]/page";

const mocks = vi.hoisted(() => ({ session: vi.fn(), trades: vi.fn(), count: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { backtestSession: { findFirst: mocks.session }, trade: { findMany: mocks.trades, count: mocks.count } } }));
vi.mock("@/lib/data", () => ({ viewer: async () => ({ id: "user-1" }) }));
vi.mock("@/app/actions", () => ({ deleteBacktestSession: vi.fn() }));
vi.mock("@/components/backtest-trade-card", () => ({ BacktestTradeCard: ({ trade }: { trade: { id: string } }) => createElement("div", null, trade.id) }));
vi.mock("@/components/confirm-submit-button", () => ({ ConfirmSubmitButton: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ id: "session-1", name: "Replay", marketStartedAt: new Date("2026-01-01"), createdAt: new Date("2026-01-02"), account: { currency: "USD" } });
  mocks.count.mockResolvedValue(30);
  mocks.trades.mockImplementation(async ({ take }: { take?: number }) => take ? [{ id: "selected-trade" }] : []);
});

const render = async (page: string) => renderToStaticMarkup(await BacktestSessionPage({ params: Promise.resolve({ id: "session-1" }), searchParams: Promise.resolve({ page }) }));

describe("backtest carousel navigation", () => {
  it("loads only one trade and navigates beyond the former table page size", async () => {
    const html = await render("26");
    expect(html).toContain("Trade 26 of 30");
    expect(html).toContain('href="?page=25"');
    expect(html).toContain('href="?page=27"');
    expect(mocks.trades).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 25, take: 1, orderBy: [{ openedAt: "asc" }, { id: "asc" }] }));
    expect(mocks.session).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "session-1", userId: "user-1" } }));
  });

  it("disables previous on the first trade and next on the last trade", async () => {
    expect(await render("-1")).not.toContain('href="?page=0"');
    const html = await render("999");
    expect(html).toContain("Trade 30 of 30");
    expect(html).not.toContain('href="?page=31"');
    expect(mocks.trades).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 29, take: 1 }));
  });

  it("shows an empty state without navigation for an empty session", async () => {
    mocks.count.mockResolvedValue(0);
    mocks.trades.mockResolvedValue([]);
    const html = await render("1");
    expect(html).toContain("No trades recorded in this session yet.");
    expect(html).not.toContain('aria-label="Trade navigation"');
  });
});
