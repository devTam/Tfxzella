import { NavigationLink } from "@/components/navigation-link";
import { WorkflowNav } from "@/components/workflow-nav";
import { BacktestTradeCard } from "@/components/backtest-trade-card";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { viewer } from "@/lib/data";
import { formatNewYorkDateTime, newYorkDateKey } from "@/lib/time";
import { adjacentTradeWhere, journalFilters, journalReviewHref, journalWhere, type JournalQuery } from "@/lib/journal-view";

export default async function TradeReview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<JournalQuery> }) {
  const user = await viewer(), { id } = await params;
  const filters = journalFilters(await searchParams || {});
  const trade = await db.trade.findFirst({ where: { id, account: { userId: user.id }, deletedAt: null }, include: { account: true, instrument: true, playbook: true, plan: true, attachments: { orderBy: { createdAt: "asc" } } } });
  if (!trade) notFound();
  const live = trade.source === "LIVE";
  const scope = live ? journalWhere(user.id, filters) : { account: { userId: user.id }, source: "BACKTEST" as const, backtestSessionId: trade.backtestSessionId, deletedAt: null };
  const [previous, next] = await Promise.all([
    db.trade.findFirst({ where: { AND: [scope, adjacentTradeWhere(trade, !live)] }, select: { id: true }, orderBy: [{ openedAt: live ? "asc" : "desc" }, { id: live ? "asc" : "desc" }] }),
    db.trade.findFirst({ where: { AND: [scope, adjacentTradeWhere(trade, live)] }, select: { id: true }, orderBy: [{ openedAt: live ? "desc" : "asc" }, { id: live ? "desc" : "asc" }] }),
  ]);
  const href = (tradeId: string) => live ? journalReviewHref(tradeId, filters) : `/app/journal/${tradeId}`;
  const back = trade.backtestSessionId ? `/app/backtests/${trade.backtestSessionId}` : `/app/journal?${new URLSearchParams(filters)}`;
  return <div className="content trade-review">
    {live ? <WorkflowNav current="trade" account={trade.accountId} date={newYorkDateKey(trade.openedAt)}/> : null}
    <div className="page-head"><div><Link className="back-link" href={back}><ArrowLeft size={15}/>{live ? "All trades" : "Back to session"}</Link><span className="eyebrow">Trade review</span><h1>{trade.instrument.symbol} · {trade.direction}</h1><p>{formatNewYorkDateTime(trade.openedAt)} · {trade.account.name}</p></div></div>
    <section className="card section" aria-label="Journal trade review">
      <nav className="backtest-carousel-nav" aria-label="Trade navigation">
        {previous ? <NavigationLink className="btn secondary" href={href(previous.id)} scroll={false}><ChevronLeft size={16}/>Previous trade</NavigationLink> : <button className="btn secondary" disabled><ChevronLeft size={16}/>Previous trade</button>}
        <span>{live ? "Newest trades first" : "Session trades"}</span>
        {next ? <NavigationLink className="btn secondary" href={href(next.id)} scroll={false}>Next trade<ChevronRight size={16}/></NavigationLink> : <button className="btn secondary" disabled>Next trade<ChevronRight size={16}/></button>}
      </nav>
      <BacktestTradeCard trade={trade} currency={trade.account.currency} journal={live}/>
    </section>
  </div>;
}
