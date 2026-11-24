import type { Prisma } from "@prisma/client";
import { newYorkDayStart, newYorkDayEnd } from "@/lib/time";
import { workflowDate } from "@/lib/workflow";

export type JournalQuery = { account?: string; date?: string; status?: string; basis?: string };

export function journalFilters(query: JournalQuery) {
  const status = ["needs-review", "open"].includes(query.status || "") ? query.status! : "";
  return {
    ...(query.account ? { account: query.account } : {}),
    ...(query.date ? { date: workflowDate(query.date) } : {}),
    ...(status ? { status } : {}),
    basis: status !== "open" && query.basis === "closed" ? "closed" : "opened",
  };
}

export function journalWhere(userId: string, query: JournalQuery): Prisma.TradeWhereInput {
  const { account, date, status, basis } = journalFilters(query);
  return { account: { userId }, accountId: account, source: "LIVE", deletedAt: null,
    ...(date ? { [basis === "closed" ? "closedAt" : "openedAt"]: { gte: newYorkDayStart(date), lte: newYorkDayEnd(date) } } : {}),
    ...(status === "open" ? { closedAt: null } : status === "needs-review" ? {
      closedAt: date && basis === "closed" ? { gte: newYorkDayStart(date), lte: newYorkDayEnd(date) } : { not: null },
      OR: [{ followedPlan: null }, { lesson: null }, { lesson: "" }],
    } : {}),
  };
}

export function journalReviewHref(id: string, query: JournalQuery) {
  return `/app/journal/${id}?${new URLSearchParams(journalFilters(query))}`;
}

// Match the journal's newest-first ordering, including trades with equal entry times.
export function adjacentTradeWhere(trade: { id: string; openedAt: Date }, next: boolean): Prisma.TradeWhereInput {
  const comparison = next ? "lt" : "gt";
  return { OR: [{ openedAt: { [comparison]: trade.openedAt } }, { openedAt: trade.openedAt, id: { [comparison]: trade.id } }] };
}
