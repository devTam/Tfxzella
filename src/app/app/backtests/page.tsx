import Link from "next/link";
import { ArrowRight, FlaskConical, Plus } from "lucide-react";
import { createBacktestSession } from "@/app/actions";
import { db } from "@/lib/db";
import { viewer } from "@/lib/data";
import { money, pct } from "@/lib/format";
import { calculateMetrics } from "@/lib/trades";
import { SubmitButton } from "@/components/confirm-submit-button";
import { formatNewYorkDateTime, newYorkDateTimeValue } from "@/lib/time";

export const metadata={title:"Backtesting"};

export default async function Backtests(){
  const user=await viewer();
  const [accounts,sessions,liveTrades,backtestTrades]=await Promise.all([
    db.tradingAccount.findMany({where:{userId:user.id,archivedAt:null},orderBy:{name:"asc"}}),
    db.backtestSession.findMany({where:{userId:user.id},include:{account:true,trades:{where:{deletedAt:null},select:{netPnl:true,grossPnl:true,fees:true,closedAt:true}}},orderBy:{marketStartedAt:"desc"}}),
    db.trade.findMany({where:{account:{userId:user.id},source:"LIVE",deletedAt:null,closedAt:{not:null}},select:{netPnl:true,grossPnl:true,fees:true,closedAt:true}}),
    db.trade.findMany({where:{account:{userId:user.id},source:"BACKTEST",deletedAt:null,closedAt:{not:null}},select:{netPnl:true,grossPnl:true,fees:true,closedAt:true}})
  ]);
  const live=calculateMetrics(liveTrades.map(t=>({...t,netPnl:t.netPnl.toString(),grossPnl:t.grossPnl.toString(),fees:t.fees.toString()}))),backtest=calculateMetrics(backtestTrades.map(t=>({...t,netPnl:t.netPnl.toString(),grossPnl:t.grossPnl.toString(),fees:t.fees.toString()}))),currency=accounts[0]?.currency||"USD",now=new Date();
  return <div className="content">
    <div className="page-head"><div><span className="eyebrow">Replay the market</span><h1>Backtesting</h1><p>Record simulated sessions at their historical market time, then compare the evidence with live execution.</p></div></div>
    <section className="comparison-grid">
      <Comparison title="Backtest" metrics={backtest} currency={currency}/><Comparison title="Live" metrics={live} currency={currency}/>
    </section>
    <div className="two section backtest-layout">
      <section className="card"><div className="widget-head"><div><span className="stat-label">History</span><h2>Backtest sessions</h2></div></div>{sessions.length?<div className="session-list">{sessions.map(session=>{const metrics=calculateMetrics(session.trades.map(t=>({...t,netPnl:t.netPnl.toString(),grossPnl:t.grossPnl.toString(),fees:t.fees.toString()})));return <Link key={session.id} href={`/app/backtests/${session.id}`}><FlaskConical size={18}/><div><b>{session.name}</b><small>Market: {formatNewYorkDateTime(session.marketStartedAt)} · Recorded: {formatNewYorkDateTime(session.createdAt)}</small></div><span>{metrics.totalTrades} trades</span><strong className={metrics.netPnl.gte(0)?"positive":"negative"}>{money(metrics.netPnl.toString(),session.account.currency)}</strong><ArrowRight size={16}/></Link>})}</div>:<div className="empty">Create a session to start recording replay trades.</div>}</section>
      <form action={createBacktestSession} className="card form-grid backtest-form"><div className="full"><span className="stat-label">New replay</span><h2>Create a session</h2></div><Field label="Session name"><input name="name" placeholder="NQ London open — Jan 15" required/></Field><Field label="Account"><select name="accountId" required>{accounts.map(account=><option value={account.id} key={account.id}>{account.name}</option>)}</select></Field><Field label="Historical start (New York)"><input name="marketStartedAt" type="datetime-local" defaultValue={newYorkDateTimeValue(now)} required/></Field><Field label="Historical end (New York, optional)"><input name="marketEndedAt" type="datetime-local"/></Field><div className="field full"><label>Session notes</label><textarea name="notes" placeholder="Dataset, replay speed, market regime, or hypothesis…"/></div><SubmitButton className="btn full" pendingLabel="Starting session…" successMessage="Backtest session created"><Plus size={16}/>Start session</SubmitButton></form>
    </div>
  </div>;
}

function Comparison({title,metrics,currency}:{title:string;metrics:ReturnType<typeof calculateMetrics>;currency:string}){return <article className="card comparison-card"><div><span className="badge">{title}</span><strong className={metrics.netPnl.gte(0)?"positive":"negative"}>{money(metrics.netPnl.toString(),currency)}</strong></div><dl><div><dt>Trades</dt><dd>{metrics.totalTrades}</dd></div><div><dt>Win rate</dt><dd>{pct(metrics.winRate.toString())}</dd></div><div><dt>Profit factor</dt><dd>{metrics.profitFactor?.toFixed(2)||(metrics.wins?"∞":"0.00")}</dd></div><div><dt>Expectancy</dt><dd>{money(metrics.expectancy.toString(),currency)}</dd></div></dl></article>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <div className="field"><label>{label}</label>{children}</div>}
