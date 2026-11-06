import Link from "next/link";
import { money } from "@/lib/format";

export type ReviewTrade = { id: string; symbol: string; accountId: string; direction: string; dayKey: string; tradeTime: string; netPnl: string; currency: string; lesson: string | null; checkedRules: string[] };

export function ReviewTrades({ trades, accountId, startsAt, endsAt }: { trades: ReviewTrade[]; accountId: string; startsAt: string; endsAt: string }) {
  const matchingTrades = trades.filter(trade => trade.dayKey >= startsAt && trade.dayKey <= endsAt && (!accountId || trade.accountId === accountId));
  return (
      <div className="field full"><span className="stat-label">Trades closed {startsAt === endsAt ? `on ${startsAt}` : `from ${startsAt} through ${endsAt}`}</span>{matchingTrades.length ? <div className="review-trade-list">{matchingTrades.map((trade) => { const pnl = Number(trade.netPnl); return <article key={trade.id}><div><Link href={`/app/journal/${trade.id}`} target="_blank" rel="noreferrer"><b>{trade.symbol} · {trade.direction === "LONG" ? "Long" : "Short"}</b> ↗</Link><small>Closed {trade.dayKey} · Entry time {trade.tradeTime} New York</small>{trade.lesson ? <small>Lesson: {trade.lesson}</small> : null}{trade.checkedRules.length ? <div className="review-trade-rules">{trade.checkedRules.map((rule) => <span className="badge" key={rule}>{rule}</span>)}</div> : null}</div><strong className={pnl >= 0 ? "positive" : "negative"}>{money(trade.netPnl, trade.currency)}</strong></article>; })}</div> : <div className="empty review-trades-empty">No closed trades found for this period and account.</div>}<span className="help">Review metrics use trades closed during the selected New York dates, including the end date. Trades appear whether or not their daily review is complete. Bias comparison uses trades opened that day, so overnight trades may appear on different days.</span></div>
  );
}
