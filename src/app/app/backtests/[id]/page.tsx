import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { BacktestTradeCard } from "@/components/backtest-trade-card";
import { db } from "@/lib/db";
import { viewer } from "@/lib/data";
import { money, pct } from "@/lib/format";
import { pageNumber } from "@/lib/pagination";
import { formatNewYorkDateTime } from "@/lib/time";
import { calculateMetrics } from "@/lib/trades";
import { deleteBacktestSession } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default async function BacktestSessionPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{page?:string}>}){
  const user=await viewer(),{id}=await params,requested=pageNumber((await searchParams).page);
  const session=await db.backtestSession.findFirst({where:{id,userId:user.id},include:{account:true}});if(!session)notFound();
  const where={backtestSessionId:id,deletedAt:null};
  const [metricTrades,total]=await Promise.all([db.trade.findMany({where,select:{netPnl:true,grossPnl:true,fees:true,closedAt:true},orderBy:{openedAt:"asc"}}),db.trade.count({where})]);
  const page=Math.min(requested,Math.max(1,total)),trades=await db.trade.findMany({where,include:{instrument:true,playbook:true,attachments:{orderBy:{createdAt:"asc"}}},orderBy:[{openedAt:"asc"},{id:"asc"}],skip:page-1,take:1});
  const metrics=calculateMetrics(metricTrades.map(t=>({netPnl:t.netPnl.toString(),grossPnl:t.grossPnl.toString(),fees:t.fees.toString(),closedAt:t.closedAt})));
  return <div className="content"><Link className="back-link" href="/app/backtests"><ArrowLeft size={14}/>All backtests</Link><div className="page-head"><div><span className="eyebrow">Historical market session</span><h1>{session.name}</h1><p>Market time: {formatNewYorkDateTime(session.marketStartedAt)}{session.marketEndedAt?` – ${formatNewYorkDateTime(session.marketEndedAt)}`:""} · Recorded {formatNewYorkDateTime(session.createdAt)}</p></div><div className="actions"><Link className="btn secondary" href={`/app/backtests/${session.id}/edit`}><Pencil size={16}/>Edit session</Link><Link className="btn" href={`/app/backtests/${session.id}/trades/new`}><Plus size={16}/>Record replay trade</Link></div></div>
    <section className="report-kpis"><Metric label="Net P&L" value={money(metrics.netPnl.toString(),session.account.currency)} tone={metrics.netPnl.gte(0)?"positive":"negative"}/><Metric label="Trades" value={String(metrics.totalTrades)}/><Metric label="Win rate" value={pct(metrics.winRate.toString())}/><Metric label="Profit factor" value={metrics.profitFactor?.toFixed(2)||(metrics.wins?"∞":"0.00")}/><Metric label="Expectancy" value={money(metrics.expectancy.toString(),session.account.currency)}/><Metric label="Max drawdown" value={money(metrics.maxDrawdown.toString(),session.account.currency)}/></section>
    {session.notes?<section className="card section"><span className="stat-label">Session notes</span><p>{session.notes}</p></section>:null}
    <section className="card section backtest-carousel" aria-label="Backtest trades" aria-roledescription="carousel">
      {trades.length ? <>
        <nav className="backtest-carousel-nav" aria-label="Trade navigation">
          {page > 1 ? <Link className="btn secondary" href={`?page=${page-1}`} scroll={false}><ChevronLeft size={16}/>Previous trade</Link> : <button className="btn secondary" disabled><ChevronLeft size={16}/>Previous trade</button>}
          <span role="status" aria-live="polite">Trade {page} of {total}</span>
          {page < total ? <Link className="btn secondary" href={`?page=${page+1}`} scroll={false}>Next trade<ChevronRight size={16}/></Link> : <button className="btn secondary" disabled>Next trade<ChevronRight size={16}/></button>}
        </nav>
        <div role="group" aria-roledescription="slide" aria-label={`Trade ${page} of ${total}`}><BacktestTradeCard trade={trades[0]} currency={session.account.currency}/></div>
      </> : <div className="empty">No trades recorded in this session yet.</div>}
    </section>
    <section className="card danger-zone section"><span className="stat-label">Danger zone</span><h2>Delete this session</h2><p>This removes the session and its {total} replay {total===1?"trade":"trades"} from backtesting reports.</p><form action={deleteBacktestSession}><input type="hidden" name="id" value={session.id}/><ConfirmSubmitButton className="btn danger" message={`Delete “${session.name}” and its ${total} replay ${total===1?"trade":"trades"}?`}><Trash2 size={15}/>Delete session</ConfirmSubmitButton></form></section>
  </div>
}
function Metric({label,value,tone}:{label:string;value:string;tone?:string}){return <div className="report-metric"><span>{label}</span><strong className={tone}>{value}</strong></div>}
