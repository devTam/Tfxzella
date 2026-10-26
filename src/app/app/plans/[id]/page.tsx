import { TradeChartGallery } from "@/components/trade-chart-gallery";
import { WorkflowNav } from "@/components/workflow-nav";
import { workflowHref } from "@/lib/workflow";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { viewer } from "@/lib/data";
import { chartImageUrl } from "@/lib/chart-images";
import { money } from "@/lib/format";
import { dateOnlyValue, formatDateOnly, formatNewYorkDateTime, newYorkDayEnd, newYorkDayStart } from "@/lib/time";

export const metadata = { title: "Daily bias vs actual trades" };

export default async function PlanComparison({ params }: { params: Promise<{ id: string }> }) {
  const user = await viewer();
  const { id } = await params;
  const plan = await db.tradePlan.findFirst({
    where: { id, userId: user.id },
    include: { account: true, attachments: { orderBy: { createdAt: "asc" } } },
  });
  if (!plan) notFound();
  const day = dateOnlyValue(plan.planDate);
  const trades = await db.trade.findMany({
    where: {
      accountId: plan.accountId, account: { userId: user.id }, deletedAt: null, source: "LIVE",
      openedAt: { gte: newYorkDayStart(day), lte: newYorkDayEnd(day) },
    },
    include: { instrument: true, attachments: { orderBy: { createdAt: "asc" } } },
    orderBy: { openedAt: "asc" },
  });
  return <div className="content"><WorkflowNav current="review" account={plan.accountId} date={day}/>
    <div className="page-head"><div>
      <Link className="back-link" href="/app/plans">Back to daily plans</Link>
      <span className="eyebrow">End-of-day comparison</span>
      <h1>Daily bias vs actual trades</h1>
      <p>{formatDateOnly(plan.planDate)} · {plan.account.name} · New York trading day</p>
    </div><Link className="btn secondary" href={`/app/plans/${id}/edit`}>Edit daily bias</Link></div>
    <aside className="practice-focus"><p>Compare what you expected with the decisions you made. Finish by choosing one action for your next session.</p><Link className="btn" href={workflowHref("/app/reviews",plan.accountId,day)}>Write daily review</Link></aside>
    <div className="grid two">
      <section className="card">
        <h2>Chart expectation</h2>
        <span className="badge">{plan.marketBias || "Neutral"}</span>
        <p>{plan.thesis || "No thesis recorded."}</p>
        <div className="detail-row"><span>Draw on Liquidity (DOL)</span><b>{plan.drawOnLiquidity || "Not recorded"}</b></div>
        {plan.watchlist.length ? <p>Watchlist: {plan.watchlist.join(", ")}</p> : null}
        <Charts attachments={plan.attachments} label="Expected chart" empty="No expectation chart uploaded. Edit your daily bias to attach one."/>
        {plan.notes ? <p>{plan.notes}</p> : null}
      </section>
      <section className="card">
        <h2>Actual trades taken · {trades.length}</h2>
        <p className="help">Trades opened on this account during the day, including trades not linked to this plan. Backtests are excluded. Open trades are still in progress.</p>
        {trades.length ? <div className="grid">{trades.map(trade => <article className="compact-card" key={trade.id}>
          <h3><Link href={`/app/journal/${trade.id}`}>{trade.instrument.symbol} · {trade.direction}</Link></h3>
          <p>{formatNewYorkDateTime(trade.openedAt)} · {trade.status}</p>
          <div className="detail-row"><span>Entry → exit</span><b>{trade.averageEntry.toString()} → {trade.averageExit?.toString() || "Open"}</b></div>
          <div className="detail-row"><span>Net P&amp;L{trade.status === "OPEN" ? " so far" : ""}</span><b>{money(trade.netPnl.toString(), plan.account.currency)}</b></div>
          <div className="detail-row"><span>Followed plan</span><b>{trade.followedPlan === null ? "Not reviewed" : trade.followedPlan ? "Yes" : "No"}</b></div>
          {trade.videoUrl ? <p><a className="btn secondary" href={trade.videoUrl} target="_blank" rel="noopener noreferrer">Watch trade video ↗</a></p> : null}
          <TradeChartGallery attachments={trade.attachments}/>
          <p>{trade.lesson || "Compare your entry, direction, and exit with the expected chart, then record your lesson in the trade review."}</p>
          <Link className="btn secondary" href={`/app/journal/${trade.id}/edit`}>Review trade</Link>
        </article>)}</div> : <div className="empty">No trades recorded for this account and day yet. They will appear here as you journal them.</div>}
      </section>
    </div>
  </div>;
}

function Charts({ attachments, label, empty }: { attachments: { id: string; objectKey: string }[]; label: string; empty: string }) {
  return attachments.length ? <div className="trade-images section">{attachments.map((attachment, index) => {
    const url = chartImageUrl(attachment.objectKey);
    return <a href={url} target="_blank" rel="noreferrer" key={attachment.id}>
      <Image src={url} alt={`${label} ${index + 1}; open full size`} width={900} height={520} sizes="(max-width: 900px) 100vw, 50vw" unoptimized/>
    </a>;
  })}</div> : <div className="empty">{empty}</div>;
}
