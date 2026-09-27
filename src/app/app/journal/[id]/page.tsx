import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { v2 as cloudinary } from "cloudinary";
import Decimal from "decimal.js";
import { db } from "@/lib/db";
import { viewer } from "@/lib/data";
import { duration, money, pct } from "@/lib/format";

export default async function TradeReview({ params }: { params: Promise<{ id: string }> }) {
  const user = await viewer();
  const { id } = await params;
  const trade = await db.trade.findFirst({ where: { id, account: { userId: user.id }, deletedAt: null }, include: { account: true, instrument: true, playbook: true, plan: true, tags: { include: { tag: true } }, executions: { orderBy: { executedAt: "asc" } }, attachments: true } });
  if (!trade) notFound();
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
  const hold = trade.closedAt ? trade.closedAt.getTime() - trade.openedAt.getTime() : null;
  const riskMultiple = trade.rMultiple ?? (trade.initialRisk && !trade.initialRisk.isZero() ? new Decimal(trade.netPnl).div(trade.initialRisk) : null);

  return <div className="content trade-review">
    <div className="page-head"><div><Link className="back-link" href={trade.backtestSessionId?`/app/backtests/${trade.backtestSessionId}`:"/app/journal"}><ArrowLeft size={15}/>{trade.backtestSessionId?"Back to session":"All trades"}</Link><span className="eyebrow">Trade review</span><h1>{trade.instrument.symbol} · {trade.direction}</h1><p>{trade.openedAt.toLocaleString()} · {trade.account.name}</p></div><Link className="btn" href={`/app/journal/${trade.id}/edit`}><Pencil size={16}/>Edit review</Link></div>
    <section className="trade-hero card"><div><span className="stat-label">NET P&amp;L</span><strong className={Number(trade.netPnl) >= 0 ? "positive" : "negative"}>{money(trade.netPnl.toString(), trade.account.currency)}</strong></div><ReviewMetric label="R-multiple" value={riskMultiple ? `${riskMultiple.toFixed(2)}R` : "Add initial risk"}/><ReviewMetric label="Hold time" value={hold === null ? "Open" : duration(hold)}/><ReviewMetric label="Quality" value={trade.qualityGrade ? `${trade.qualityGrade}-grade` : "Not graded"}/><ReviewMetric label="Plan" value={trade.followedPlan === true ? "Followed" : trade.followedPlan === false ? "Broken" : "Not reviewed"}/></section>
    <section className="card section level-summary"><div><span className="stat-label">Stop loss</span><b>{trade.stopPrice?.toString() || "Not recorded"}</b><small>{trade.stopLossPoints ? `${trade.stopLossPoints.toString()} points from entry` : "—"}</small></div><div><span className="stat-label">Take profit</span><b>{trade.targetPrice?.toString() || "Not recorded"}</b><small>{trade.takeProfitPoints ? `${trade.takeProfitPoints.toString()} points from entry` : "—"}</small></div></section>
    <div className="grid trade-detail-grid section">
      <div className="grid">
        <section className="card"><h2>Execution</h2><div className="detail-grid"><Detail label="Quantity" value={trade.quantity.toString()}/><Detail label="Entry" value={trade.averageEntry.toString()}/><Detail label="Exit" value={trade.averageExit?.toString() || "Open"}/><Detail label="Multiplier" value={trade.instrument.pointValue.toString()}/><Detail label="Gross P&L" value={money(trade.grossPnl.toString(), trade.account.currency)}/><Detail label="Fees" value={money(trade.fees.toString(), trade.account.currency)}/><Detail label="Return" value={trade.returnPercent ? pct(trade.returnPercent.toString()) : "—"}/><Detail label="Initial risk" value={trade.initialRisk ? money(trade.initialRisk.toString(), trade.account.currency) : "—"}/></div>{trade.executions.length ? <div className="execution-list section">{trade.executions.map((execution) => <div key={execution.id}><span className={`badge ${execution.side === "BUY" ? "positive" : "negative"}`}>{execution.side}</span><b>{execution.quantity.toString()} @ {execution.price.toString()}</b><span>{execution.executedAt.toLocaleString()}</span></div>)}</div> : null}</section>
        <section className="card"><h2>Chart screenshots</h2>{trade.attachments.length ? <div className="trade-images">{trade.attachments.map((attachment, index) => {const url=cloudinary.url(attachment.objectKey, { type: "authenticated", sign_url: true, secure: true });return <a href={url} target="_blank" rel="noreferrer" key={attachment.id}><Image src={url} alt={`Chart screenshot ${index + 1}`} width={900} height={520} sizes="(max-width: 900px) 100vw, 700px" unoptimized/></a>})}</div> : <div className="empty">No chart screenshots were attached.</div>}</section>
      </div>
      <aside className="grid review-sidebar">
        <section className="card"><h2>Process review</h2><Detail label="Strategy" value={trade.playbook?.name || trade.setup || "Unassigned"}/><Detail label="Emotion" value={trade.emotion || "Not recorded"}/><Detail label="Market" value={trade.marketCondition || "Not recorded"}/><div className="section"><span className="stat-label">MISTAKES</span><div className="tag-row">{trade.mistakes.length ? trade.mistakes.map((mistake) => <span className="badge negative" key={mistake}>{mistake}</span>) : <span className="positive">No mistakes recorded</span>}</div></div>{trade.tags.length ? <div className="section"><span className="stat-label">TAGS</span><div className="tag-row">{trade.tags.map(({ tag }) => <span className="badge" style={{ borderColor: tag.color }} key={tag.id}>{tag.name}</span>)}</div></div> : null}</section>
        <section className="card reflection-card"><h2>Reflection</h2><span className="stat-label">NEWS ON THE DAY</span><p>{trade.newsOnDay || "No market news recorded."}</p><span className="stat-label">LESSON</span><p>{trade.lesson || "No lesson recorded yet."}</p><span className="stat-label">NOTES</span><p>{trade.notes || "No additional notes."}</p></section>
        {trade.plan ? <section className="card"><h2>Planned vs actual</h2><Detail label="Plan date" value={trade.plan.planDate.toLocaleDateString()}/><Detail label="Bias" value={trade.plan.marketBias || "—"}/><Detail label="Thesis" value={trade.plan.thesis || "—"}/><Detail label="Entry conditions" value={trade.plan.entryConditions || "—"}/><Detail label="Stop plan" value={trade.plan.stopPlan || "—"}/><Detail label="Target plan" value={trade.plan.targetPlan || "—"}/><Detail label="Risk budget" value={trade.plan.riskBudget ? money(trade.plan.riskBudget.toString(), trade.account.currency) : "—"}/></section> : null}
      </aside>
    </div>
  </div>;
}

function ReviewMetric({ label, value }: { label: string; value: string }) { return <div><span className="stat-label">{label}</span><b>{value}</b></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="detail-row"><span>{label}</span><b>{value}</b></div>; }
