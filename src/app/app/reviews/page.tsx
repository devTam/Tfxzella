import { WorkflowNav } from "@/components/workflow-nav";
import { workflowDate, type WorkflowQuery } from "@/lib/workflow";
import { chartImageUrl } from "@/lib/chart-images";
import { dateOnlyValue } from "@/lib/time";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { deleteReview } from "@/app/actions";
import { ReviewForm } from "@/components/review-form";
import { db } from "@/lib/db";
import { accounts, viewer } from "@/lib/data";
import { money, pct } from "@/lib/format";
import { formatNewYorkDate, newYorkDateKey, newYorkTimeValue } from "@/lib/time";

export const metadata = { title: "Reviews" };
type Snapshot = { trades?: number; netPnl?: string; winRate?: string; discipline?: number | null; topMistake?: string | null };

export default async function Reviews({searchParams}:{searchParams:Promise<WorkflowQuery>}) {
  const user = await viewer(),query=await searchParams,date=workflowDate(query.date);
  const [accountList, reviews, trades, plans] = await Promise.all([
    accounts(),
    db.review.findMany({ where: { userId: user.id }, include: { account: true }, orderBy: { startsAt: "desc" } }),
    db.trade.findMany({ where: { account: { userId: user.id }, source: "LIVE", deletedAt: null, closedAt: { not: null } }, include: { account: true, instrument: true }, orderBy: { openedAt: "desc" } }),
    db.tradePlan.findMany({where:{userId:user.id},include:{account:true,attachments:true},orderBy:{planDate:"desc"}}),
  ]);
  const reviewTrades = trades.map((trade) => ({ id: trade.id, symbol: trade.instrument.symbol, accountId: trade.accountId, direction: trade.direction, dayKey: newYorkDateKey(trade.closedAt!), tradeTime: newYorkTimeValue(trade.openedAt), netPnl: trade.netPnl.toString(), currency: trade.account.currency, lesson: trade.lesson, checkedRules: trade.checkedRules }));
  const account=accountList.find(a=>a.id===query.account)?.id||"";
  return <div className="content"><WorkflowNav current="review" account={account} date={date}/><div className="page-head"><div><span className="eyebrow">Close the feedback loop</span><h1>Performance reviews</h1><p>Compare expectation with execution, find recurring decisions, and choose one change for the next session.</p></div></div><div className="grid review-layout">
    <ReviewForm key={`${account}-${date}`} accounts={accountList.map((account) => ({ id: account.id, name: account.name }))} trades={reviewTrades} initialDate={date} initialAccount={account} plans={plans.map(plan=>({id:plan.id,accountId:plan.accountId,accountName:plan.account.name,day:dateOnlyValue(plan.planDate),bias:plan.marketBias,drawOnLiquidity:plan.drawOnLiquidity,thesis:plan.thesis,images:plan.attachments.map(image=>({id:image.id,url:chartImageUrl(image.objectKey)}))}))}/>
    <section className="grid"><div><h2>Review history</h2><p className="help">Revisit past adjustments. Your latest goal returns to the session workspace.</p></div>{reviews.length ? reviews.map((review) => {
      const metrics = review.metrics as Snapshot, currency = review.account?.currency || "USD";
      return <article className="card review-card" key={review.id}><div className="review-card-head"><div><span className="eyebrow">{review.period.toLowerCase()} review</span><h2>{formatNewYorkDate(review.startsAt)} – {formatNewYorkDate(review.endsAt)}</h2></div><span className="badge">{review.rating ? `${review.rating}/5` : "Unrated"}</span></div><div className="review-mini-stats"><div><span>Net P&amp;L</span><b className={Number(metrics.netPnl) >= 0 ? "positive" : "negative"}>{money(metrics.netPnl || 0, currency)}</b></div><div><span>Win rate</span><b>{pct(metrics.winRate || 0)}</b></div><div><span>Trades</span><b>{metrics.trades || 0}</b></div><div><span>Discipline</span><b>{metrics.discipline == null ? "—" : pct(metrics.discipline)}</b></div></div><p><b>Next adjustment:</b> {review.goals || "No action chosen yet."}</p>{metrics.topMistake ? <p className="help">Most frequent mistake: {metrics.topMistake}</p> : null}<div className="actions section"><Link className="btn" href={`/app/reviews/${review.id}`}>Open review <ArrowRight size={15}/></Link><Link className="btn secondary" href={`/app/reviews/${review.id}/edit`}>Edit</Link><form action={deleteReview}><input type="hidden" name="id" value={review.id}/><button className="btn danger">Delete</button></form></div></article>;
    }) : <div className="card empty">Your reviews will build a record of growth.</div>}</section>
  </div></div>;
}
