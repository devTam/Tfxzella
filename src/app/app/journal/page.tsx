import Link from "next/link";
import { Eye, Pencil, Plus, Upload } from "lucide-react";
import { deleteTrade } from "@/app/actions";
import { Pagination } from "@/components/pagination";
import { db } from "@/lib/db";
import { viewer } from "@/lib/data";
import { duration, money } from "@/lib/format";
import { PAGE_SIZE, pageCount, pageNumber } from "@/lib/pagination";

export const metadata = { title: "Journal" };

export default async function Journal({searchParams}:{searchParams:Promise<{page?:string}>}) {
  const user = await viewer(), requested=pageNumber((await searchParams).page);
  const where={account:{userId:user.id},source:"LIVE" as const,deletedAt:null};
  const total=await db.trade.count({where}),page=Math.min(requested,pageCount(total));
  const trades = await db.trade.findMany({ where, include: { instrument: true, account: true, playbook: true }, orderBy: [{openedAt:"desc"},{id:"desc"}], skip:(page-1)*PAGE_SIZE, take:PAGE_SIZE });
  return <div className="content">
    <div className="page-head"><div><span className="eyebrow">Execution and behavior</span><h1>Trade journal</h1><p>Open any trade to review its execution, screenshots, process and lesson.</p></div><div className="actions"><Link className="btn secondary" href="/app/import"><Upload size={16}/>Import CSV</Link><Link className="btn" href="/app/journal/new"><Plus size={16}/>Log trade</Link></div></div>
    <section className="card">{trades.length ? <><div className="table-wrap"><table className="table journal-table"><thead><tr><th>Date</th><th>Symbol</th><th>Strategy</th><th>SL / TP</th><th>Duration</th><th>Quality</th><th>Discipline</th><th>Result</th><th>Actions</th></tr></thead><tbody>{trades.map((trade) => <tr key={trade.id}>
      <td><Link href={`/app/journal/${trade.id}`}>{trade.openedAt.toLocaleString()}</Link></td>
      <td><Link href={`/app/journal/${trade.id}`}><b>{trade.instrument.symbol}</b><div className="help">{trade.direction} · {trade.quantity.toString()}</div></Link></td>
      <td>{trade.playbook?.name || trade.setup || "Unassigned"}</td>
      <td><span className="negative">{trade.stopLossPoints ? `${trade.stopLossPoints.toString()} pts` : "—"}</span><div className="help positive">{trade.takeProfitPoints ? `${trade.takeProfitPoints.toString()} pts` : "—"}</div></td>
      <td>{trade.closedAt ? duration(trade.closedAt.getTime() - trade.openedAt.getTime()) : "Open"}</td>
      <td>{trade.qualityGrade ? <span className={`grade grade-${trade.qualityGrade.toLowerCase()}`}>{trade.qualityGrade}</span> : "—"}</td>
      <td>{trade.followedPlan === true ? <span className="positive">On-plan</span> : trade.followedPlan === false ? <span className="negative">Off-plan</span> : "Not reviewed"}</td>
      <td className={Number(trade.netPnl) >= 0 ? "positive" : "negative"}><b>{money(trade.netPnl.toString(), trade.account.currency)}</b></td>
      <td><div className="actions"><Link className="icon-btn" aria-label={`Review ${trade.instrument.symbol}`} href={`/app/journal/${trade.id}`}><Eye size={16}/></Link><Link className="icon-btn" aria-label={`Edit ${trade.instrument.symbol}`} href={`/app/journal/${trade.id}/edit`}><Pencil size={15}/></Link><form action={deleteTrade}><input type="hidden" name="id" value={trade.id}/><button className="btn danger">Delete</button></form></div></td>
    </tr>)}</tbody></table></div><Pagination page={page} total={total}/></> : <div className="empty">Your journal is ready for its first trade.</div>}</section>
  </div>;
}
