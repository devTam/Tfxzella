import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/pagination";
import { db } from "@/lib/db";
import { viewer } from "@/lib/data";
import { duration, money, pct } from "@/lib/format";
import { PAGE_SIZE, pageCount, pageNumber } from "@/lib/pagination";
import { calculateMetrics } from "@/lib/trades";
import { deleteBacktestSession } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ClickableTableRow } from "@/components/clickable-table-row";

export default async function BacktestSessionPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{page?:string}>}){
  const user=await viewer(),{id}=await params,requested=pageNumber((await searchParams).page);
  const session=await db.backtestSession.findFirst({where:{id,userId:user.id},include:{account:true}});if(!session)notFound();
  const where={backtestSessionId:id,deletedAt:null};
  const [metricTrades,total]=await Promise.all([db.trade.findMany({where,select:{netPnl:true,grossPnl:true,fees:true,closedAt:true},orderBy:{openedAt:"asc"}}),db.trade.count({where})]);
  const page=Math.min(requested,pageCount(total)),trades=await db.trade.findMany({where,include:{instrument:true,playbook:true},orderBy:[{openedAt:"asc"},{id:"asc"}],skip:(page-1)*PAGE_SIZE,take:PAGE_SIZE});
  const metrics=calculateMetrics(metricTrades.map(t=>({netPnl:t.netPnl.toString(),grossPnl:t.grossPnl.toString(),fees:t.fees.toString(),closedAt:t.closedAt})));
  return <div className="content"><Link className="back-link" href="/app/backtests"><ArrowLeft size={14}/>All backtests</Link><div className="page-head"><div><span className="eyebrow">Historical market session</span><h1>{session.name}</h1><p>Market time: {session.marketStartedAt.toLocaleString()}{session.marketEndedAt?` – ${session.marketEndedAt.toLocaleString()}`:""} · Recorded {session.createdAt.toLocaleString()}</p></div><div className="actions"><Link className="btn secondary" href={`/app/backtests/${session.id}/edit`}><Pencil size={16}/>Edit session</Link><Link className="btn" href={`/app/backtests/${session.id}/trades/new`}><Plus size={16}/>Record replay trade</Link></div></div>
    <section className="report-kpis"><Metric label="Net P&L" value={money(metrics.netPnl.toString(),session.account.currency)} tone={metrics.netPnl.gte(0)?"positive":"negative"}/><Metric label="Trades" value={String(metrics.totalTrades)}/><Metric label="Win rate" value={pct(metrics.winRate.toString())}/><Metric label="Profit factor" value={metrics.profitFactor?.toFixed(2)||(metrics.wins?"∞":"0.00")}/><Metric label="Expectancy" value={money(metrics.expectancy.toString(),session.account.currency)}/><Metric label="Max drawdown" value={money(metrics.maxDrawdown.toString(),session.account.currency)}/></section>
    {session.notes?<section className="card section"><span className="stat-label">Session notes</span><p>{session.notes}</p></section>:null}
    <section className="card section">{trades.length?<><div className="table-wrap"><table className="table"><thead><tr><th>Market date & time</th><th>Symbol</th><th>Strategy</th><th>Direction</th><th>SL / TP</th><th>Duration</th><th>Result</th><th>Recorded</th></tr></thead><tbody>{trades.map(trade=><ClickableTableRow href={`/app/journal/${trade.id}`} label={`Review ${trade.instrument.symbol} backtest trade`} key={trade.id}><td>{trade.openedAt.toLocaleString()}</td><td><b>{trade.instrument.symbol}</b></td><td>{trade.playbook?.name||trade.setup||"Unassigned"}</td><td>{trade.direction}</td><td><span className="negative">{trade.stopLossPoints?`${trade.stopLossPoints.toString()} pts`:"—"}</span><div className="help positive">{trade.takeProfitPoints?`${trade.takeProfitPoints.toString()} pts`:"—"}</div></td><td>{trade.closedAt?duration(trade.closedAt.getTime()-trade.openedAt.getTime()):"Open"}</td><td className={Number(trade.netPnl)>=0?"positive":"negative"}>{money(trade.netPnl.toString(),session.account.currency)}</td><td>{trade.createdAt.toLocaleString()}</td></ClickableTableRow>)}</tbody></table></div><Pagination page={page} total={total}/></>:<div className="empty">No trades recorded in this session yet.</div>}</section>
    <section className="card danger-zone section"><span className="stat-label">Danger zone</span><h2>Delete this session</h2><p>This removes the session and its {total} replay {total===1?"trade":"trades"} from backtesting reports.</p><form action={deleteBacktestSession}><input type="hidden" name="id" value={session.id}/><ConfirmSubmitButton className="btn danger" message={`Delete “${session.name}” and its ${total} replay ${total===1?"trade":"trades"}?`}><Trash2 size={15}/>Delete session</ConfirmSubmitButton></form></section>
  </div>
}
function Metric({label,value,tone}:{label:string;value:string;tone?:string}){return <div className="report-metric"><span>{label}</span><strong className={tone}>{value}</strong></div>}
