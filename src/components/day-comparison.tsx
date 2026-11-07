import { TradeChartGallery } from "@/components/trade-chart-gallery";
import { WorkflowNav } from "@/components/workflow-nav";
import { workflowHref } from "@/lib/workflow";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { chartImageUrl } from "@/lib/chart-images";
import { money } from "@/lib/format";
import { hindsightImages, type HindsightTrade } from "@/lib/review-hindsight";
import { formatDateOnly, formatNewYorkDateTime, newYorkDayEnd, newYorkDayStart } from "@/lib/time";

import type { Prisma } from "@prisma/client";

type Plan = Prisma.TradePlanGetPayload<{ include: { attachments: true } }>;
type Account = { id: string; name: string; currency: string };

export async function DayComparison({ userId, account, day, plan }: { userId: string; account: Account; day: string; plan: Plan | null }) {
  const reviews = await db.review.findMany({
    where: {
      userId: userId, period: "DAILY",
      OR: [{ accountId: account.id }, { accountId: null }],
      startsAt: newYorkDayStart(day), endsAt: newYorkDayEnd(day),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  const trades = await db.trade.findMany({
    where: {
      accountId: account.id, account: { userId: userId }, deletedAt: null, source: "LIVE",
      openedAt: { gte: newYorkDayStart(day), lte: newYorkDayEnd(day) },
    },
    include: { instrument: true, attachments: { orderBy: { createdAt: "asc" } } },
    orderBy: { openedAt: "asc" },
  });
  return <div className="content"><WorkflowNav current="review" account={account.id} date={day}/>
    <div className="page-head"><div>
      <Link className="back-link" href="/app/plans">Back to daily plans</Link>
      <span className="eyebrow">End-of-day comparison</span>
      <h1>Daily bias vs actual trades</h1>
      <p>{formatDateOnly(new Date(`${day}T00:00:00Z`))} · {account.name} · New York trading day</p>
    </div><Link className="btn secondary" href={plan ? `/app/plans/${plan.id}/edit` : workflowHref("/app/plans", account.id, day)}>{plan ? "Edit daily bias" : "Add daily bias"}</Link></div>
    <aside className="practice-focus"><p>Compare what you expected with the decisions you made. Finish by choosing one action for your next session.</p>{reviews.length === 0 ? <Link className="btn" href={workflowHref("/app/reviews",account.id,day)}>Write daily review</Link> : null}</aside>
    <div className="grid two">
      <div className="grid">
      <section className="card">
        <h2>Chart expectation</h2>
        {plan ? <>
        <span className="badge">{plan.marketBias || "Neutral"}</span>
        <p>{plan.thesis || "No thesis recorded."}</p>
        <div className="detail-row"><span>Draw on Liquidity (DOL)</span><b>{plan.drawOnLiquidity || "Not recorded"}</b></div>
        {plan.watchlist.length ? <p>Watchlist: {plan.watchlist.join(", ")}</p> : null}
        <Charts attachments={plan.attachments} label="Expected chart" empty="No expectation chart uploaded. Edit your daily bias to attach one."/>
        {plan.notes ? <p>{plan.notes}</p> : null}
        </> : <div className="empty">No daily bias recorded for this account and day. Review the actual trades and saved hindsight below.</div>}
      </section>
      {reviews.map(review => {
        const hindsight = (review.metrics as { hindsightTrade?: HindsightTrade | null }).hindsightTrade;
        if (!hindsight) return null;
        return <section className="card hindsight-summary" key={review.id}>
          <span className="eyebrow">Daily review · {review.accountId ? account.name : "All accounts"}</span>
          <h2>Correct trade in hindsight</h2>
          <div className="detail-row"><span>Symbol</span><b>{hindsight.symbol || "Not recorded"}</b></div>
          <div className="detail-row"><span>Direction</span><b>{hindsight.direction === "NO_TRADE" ? "No trade" : hindsight.direction || "Not recorded"}</b></div>
          <div className="detail-row"><span>Entry time</span><b>{hindsight.entryTime ? `${hindsight.entryTime} New York` : "Not recorded"}</b></div>
          <Charts attachments={hindsightImages(hindsight).map((image, index) => ({ id: String(index), objectKey: image.objectKey }))} label="Correct trade in hindsight chart" empty="No hindsight chart uploaded."/>
          <div className="review-text"><span className="stat-label">Why this was correct</span><p>{hindsight.rationale || "Not recorded."}</p></div>
          <Link className="btn secondary" href={`/app/reviews/${review.id}`}>Open daily review</Link>
        </section>;
      })}
      </div>
      <section className="card">
        <h2>Actual trades taken · {trades.length}</h2>
        <p className="help">Trades opened on this account during the day, including trades not linked to this plan. Backtests are excluded. Open trades are still in progress.</p>
        {trades.length ? <div className="grid">{trades.map(trade => <article className="compact-card" key={trade.id}>
          <h3><Link href={`/app/journal/${trade.id}`}>{trade.instrument.symbol} · {trade.direction}</Link></h3>
          <p>{formatNewYorkDateTime(trade.openedAt)} · {trade.status}</p>
          <div className="detail-row"><span>Entry → exit</span><b>{trade.averageEntry.toString()} → {trade.averageExit?.toString() || "Open"}</b></div>
          <div className="detail-row"><span>Net P&amp;L{trade.status === "OPEN" ? " so far" : ""}</span><b>{money(trade.netPnl.toString(), account.currency)}</b></div>
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
