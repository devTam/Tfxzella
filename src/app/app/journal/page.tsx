import type { Prisma } from "@prisma/client";
import { WorkflowNav } from "@/components/workflow-nav";
import { workflowDate, workflowHref, type WorkflowQuery } from "@/lib/workflow";
import { newYorkDayStart, newYorkDayEnd } from "@/lib/time";
import Link from "next/link";
import { Eye, Pencil, Plus, Upload } from "lucide-react";
import { deleteTrade } from "@/app/actions";
import { Pagination } from "@/components/pagination";
import { ClickableTableRow } from "@/components/clickable-table-row";
import { db } from "@/lib/db";
import { viewer } from "@/lib/data";
import { duration, money } from "@/lib/format";
import { PAGE_SIZE, pageCount, pageNumber } from "@/lib/pagination";
import { SubmitButton } from "@/components/confirm-submit-button";
import { formatNewYorkDateTime } from "@/lib/time";

export const metadata = { title: "Journal" };

export default async function Journal({searchParams}:{searchParams:Promise<WorkflowQuery & {page?:string;status?:string;basis?:string}>}) {
  const user = await viewer(), query=await searchParams, requested=pageNumber(query.page);
  const accountList=await db.tradingAccount.findMany({where:{userId:user.id},orderBy:{name:"asc"}});
  const account=accountList.some(item=>item.id===query.account)?query.account:undefined,date=query.date?workflowDate(query.date):undefined;
  const status=["needs-review","open"].includes(query.status||"")?query.status:"",basis=status!=="open"&&query.basis==="closed"?"closed":"opened";
  const where:Prisma.TradeWhereInput={account:{userId:user.id},accountId:account,source:"LIVE",deletedAt:null,
    ...(date?{[basis==="closed"?"closedAt":"openedAt"]:{gte:newYorkDayStart(date),lte:newYorkDayEnd(date)}}:{}),
    ...(status==="open"?{closedAt:null}:status==="needs-review"?{closedAt:date&&basis==="closed"?{gte:newYorkDayStart(date),lte:newYorkDayEnd(date)}:{not:null},OR:[{followedPlan:null},{lesson:null},{lesson:""}]}:{})};
  const filters={...(account?{account}:{}),...(date?{date}:{}),...(status?{status}:{}),basis};
  const total=await db.trade.count({where}),page=Math.min(requested,pageCount(total));
  const trades = await db.trade.findMany({ where, include: { instrument: true, account: true, playbook: true }, orderBy: [{openedAt:"desc"},{id:"desc"}], skip:(page-1)*PAGE_SIZE, take:PAGE_SIZE });
  return <div className="content"><WorkflowNav current="trade" account={account} date={date}/>
    <div className="page-head"><div><span className="eyebrow">Execution and behavior</span><h1>Trade journal</h1><p>Open any trade to review its execution, screenshots, process and lesson.</p></div><div className="actions"><Link className="btn secondary" href="/app/import"><Upload size={16}/>Import CSV</Link><Link className="btn" href={workflowHref("/app/journal/new",account,date)}><Plus size={16}/>Log trade</Link></div></div>
    <form className="card journal-filters section" action="/app/journal"><label>Account<select name="account" defaultValue={account||""}><option value="">All accounts</option>{accountList.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Trading day<input type="date" name="date" defaultValue={date}/></label><label>Date applies to<select name="basis" defaultValue={basis}><option value="opened">Opened on day</option><option value="closed">Closed on day</option></select></label><label>Show<select name="status" defaultValue={status}><option value="">All trades</option><option value="needs-review">Needs reflection</option><option value="open">Open trades</option></select></label><button className="btn secondary">Apply</button><Link className="btn secondary" href="/app/journal">Clear</Link></form>
    {status==="needs-review"?<p className="help">Closed trades missing plan adherence or a lesson. Review these to build useful evidence over time.</p>:null}
    <section className="card section">{trades.length ? <><div className="table-wrap"><table className="table journal-table"><thead><tr><th>Date</th><th>Symbol</th><th>Strategy</th><th>SL / TP</th><th>Duration</th><th>Quality</th><th>Discipline</th><th>Result</th><th>Actions</th></tr></thead><tbody>{trades.map((trade) => <ClickableTableRow href={`/app/journal/${trade.id}`} label={`Review ${trade.instrument.symbol} trade from ${formatNewYorkDateTime(trade.openedAt)}`} key={trade.id}>
      <td>{formatNewYorkDateTime(trade.openedAt)}</td>
      <td><b>{trade.instrument.symbol}</b><div className="help">{trade.direction} · {trade.quantity.toString()}</div></td>
      <td>{trade.playbook?.name || trade.setup || "Unassigned"}</td>
      <td><span className="negative">{trade.stopLossPoints ? `${trade.stopLossPoints.toString()} pts` : "—"}</span><div className="help positive">{trade.takeProfitPoints ? `${trade.takeProfitPoints.toString()} pts` : "—"}</div></td>
      <td>{trade.closedAt ? duration(trade.closedAt.getTime() - trade.openedAt.getTime()) : "Open"}</td>
      <td>{trade.qualityGrade ? <span className={`grade grade-${trade.qualityGrade.toLowerCase()}`}>{trade.qualityGrade}</span> : "—"}</td>
      <td>{trade.followedPlan === true ? <span className="positive">On-plan</span> : trade.followedPlan === false ? <span className="negative">Off-plan</span> : "Not reviewed"}</td>
      <td className={Number(trade.netPnl) >= 0 ? "positive" : "negative"}><b>{money(trade.netPnl.toString(), trade.account.currency)}</b></td>
      <td><div className="actions"><Link className="icon-btn" aria-label={`Review ${trade.instrument.symbol}`} href={`/app/journal/${trade.id}`}><Eye size={16}/></Link><Link className="icon-btn" aria-label={`Edit ${trade.instrument.symbol}`} href={`/app/journal/${trade.id}/edit`}><Pencil size={15}/></Link><form action={deleteTrade}><input type="hidden" name="id" value={trade.id}/><SubmitButton className="btn danger" pendingLabel="Deleting…" successMessage="Trade deleted">Delete</SubmitButton></form></div></td>
    </ClickableTableRow>)}</tbody></table></div><Pagination page={page} total={total} query={filters}/></> : <div className="empty">No trades match this view. Clear filters to see the full journal, or log a trade.</div>}</section>
  </div>;
}
