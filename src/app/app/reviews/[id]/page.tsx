import { NavigationLink } from "@/components/navigation-link";
import { WorkflowNav } from "@/components/workflow-nav";
import { TradeChartGallery } from "@/components/trade-chart-gallery";
import { workflowHref } from "@/lib/workflow";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { viewer } from "@/lib/data";
import { chartImageUrl } from "@/lib/chart-images";
import { duration, money, pct } from "@/lib/format";
import { formatDateOnly, formatNewYorkDate, formatNewYorkDateTime, newYorkDateKey } from "@/lib/time";
import { formatPoints, tradePoints } from "@/lib/trade-points";
import { hindsightImages, type HindsightTrade } from "@/lib/review-hindsight";

type Snapshot = { trades?: number; netPnl?: string; winRate?: string; profitFactor?: string | null; expectancy?: string; averageWin?: string; averageLoss?: string; maxDrawdown?: string; averageHoldMs?: number; winnerHoldMs?: number; loserHoldMs?: number; discipline?: number | null; topMistake?: string | null; hindsightTrade?: HindsightTrade | null };

export default async function ReviewDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await viewer(), { id } = await params;
  const review = await db.review.findFirst({ where: { id, userId: user.id }, include: { account: true, attachments: true } });
  if (!review) notFound();
  const where = { account: { userId: user.id }, accountId: review.accountId || undefined, source: "LIVE" as const, deletedAt: null, closedAt: { gte: review.startsAt, lte: review.endsAt } };
  const adjacent = (next: boolean) => ({ userId: user.id, OR: [{ startsAt: { [next ? "lt" : "gt"]: review.startsAt } }, { startsAt: review.startsAt, id: { [next ? "lt" : "gt"]: id } }] });
  const [trades, plans, previous, next] = await Promise.all([
    db.trade.findMany({ where, include: { instrument: true, account: true, playbook: true, attachments: { orderBy: { createdAt: "asc" as const } } }, orderBy: [{ openedAt: "desc" }, { id: "desc" }] }),
    db.tradePlan.findMany({ where: { userId: user.id, accountId: review.accountId || undefined, planDate: { gte: new Date(`${newYorkDateKey(review.startsAt)}T00:00:00Z`), lte: new Date(`${newYorkDateKey(review.endsAt)}T00:00:00Z`) } }, include: { account: true, playbook: true, attachments: true }, orderBy: [{ planDate: "asc" }, { id: "asc" }] }),
    db.review.findFirst({ where: adjacent(false), select: { id: true }, orderBy: [{ startsAt: "asc" }, { id: "asc" }] }),
    db.review.findFirst({ where: adjacent(true), select: { id: true }, orderBy: [{ startsAt: "desc" }, { id: "desc" }] }),
  ]);
  const snapshot = review.metrics as Snapshot, currency = review.account?.currency || trades[0]?.account.currency || "USD";

  return <div className="content"><WorkflowNav current="review" account={review.accountId} date={newYorkDateKey(review.startsAt)}/>
    <div className="page-head"><div><Link className="back-link" href="/app/reviews"><ArrowLeft size={15}/>All reviews</Link><span className="eyebrow">{review.period.toLowerCase()} review</span><h1>{formatNewYorkDate(review.startsAt)} – {formatNewYorkDate(review.endsAt)}</h1><p>{review.account?.name || "All accounts"} · {review.rating ? `${review.rating}/5` : "Unrated"}</p></div><Link className="btn" href={`/app/reviews/${review.id}/edit`}><Pencil size={15}/>Edit reflection</Link></div>
    <section className="card section" aria-label="Performance review">
      <ReviewNavigation previous={previous} next={next}/>
      <div className="review-priority-metrics">
        <Metric label="Net P&L" value={money(snapshot.netPnl || 0, currency)}/><Metric label="Trades" value={String(snapshot.trades ?? 0)}/><Metric label="Win rate" value={pct(snapshot.winRate || 0)}/><Metric label="Plan adherence" value={snapshot.discipline == null ? "Not reviewed" : pct(snapshot.discipline)}/>
      </div>
      <p className="help">Performance numbers are saved at review time. Plans and trade details below show the latest journal records. Actual trades are grouped by exit time within this review period.</p>
      <div className="review-comparison section">
        <section className="review-comparison-column"><h2>What was expected</h2>
          {plans.length ? plans.map(plan => <article className="review-evidence" key={plan.id}>
            <h3>{formatDateOnly(plan.planDate)} · {plan.account.name}</h3>
            <Row label="Bias" value={plan.marketBias || "Neutral"}/><Row label="Strategy" value={plan.playbook?.name || "Unassigned"}/><ReviewText label="Thesis" value={plan.thesis}/><Row label="Draw on liquidity" value={plan.drawOnLiquidity || "Not recorded"}/>
            <ReviewText label="Entry conditions" value={plan.entryConditions}/><ReviewText label="Stop condition" value={plan.stopPlan}/><ReviewText label="Profit-taking condition" value={plan.targetPlan}/>
            <Row label="Planned entry / stop / target" value={[plan.plannedEntry, plan.plannedStop, plan.plannedTarget].map(value => value?.toString() || "—").join(" / ")}/>
            <Row label="Risk budget" value={plan.riskBudget ? money(plan.riskBudget.toString(), plan.account.currency) : "Not set"}/><Row label="Maximum trades" value={plan.maxTrades?.toString() || "Not set"}/>
            <ReviewText label="News on the day" value={plan.newsOnDay}/>
            <Charts images={plan.attachments} label="Expected chart" empty="No expectation charts recorded."/>
            <Link className="btn secondary" href={`/app/plans/${plan.id}`}>Open daily plan</Link>
          </article>) : <p className="empty">No daily plans recorded for this account and period.</p>}
        </section>
        <section className="review-comparison-column"><h2>What was gotten · actual trades ({trades.length})</h2>
          {trades.length ? trades.map(trade => {
            const points = tradePoints({ entry: trade.averageEntry, stop: trade.stopPrice, target: trade.targetPrice, exit: trade.averageExit, direction: trade.direction });
            return <article className="review-evidence" key={trade.id}>
              <h3>{trade.instrument.symbol} · {trade.direction}</h3><p>{trade.account.name} · {formatNewYorkDateTime(trade.openedAt)}</p>
              <Row label="Strategy" value={trade.playbook?.name || trade.setup || "Unassigned"}/>
              <Row label="Net P&L" value={money(trade.netPnl.toString(), trade.account.currency)}/>
              <Row label="Entry → exit" value={`${trade.averageEntry} → ${trade.averageExit ?? "Open"}`}/>
              <Row label="Stop loss points" value={formatPoints(points.stop ?? trade.stopLossPoints)}/><Row label="Take profit points" value={formatPoints(points.target ?? trade.takeProfitPoints)}/><Row label="Profit / loss points (actual)" value={formatPoints(points.profit)}/>
              <Row label="Hold time" value={trade.closedAt ? duration(trade.closedAt.getTime() - trade.openedAt.getTime()) : "Open"}/><Row label="Followed plan" value={trade.followedPlan === null ? "Not reviewed" : trade.followedPlan ? "Yes" : "No"}/><Row label="Trade quality" value={trade.qualityGrade || "Not graded"}/>
              <ReviewText label="Entry conditions" value={trade.entryConditions}/><ReviewText label="Exit conditions · stop" value={trade.stopPlan}/><ReviewText label="Exit conditions · profit-taking" value={trade.targetPlan}/><ReviewText label="Mistakes" value={trade.mistakes.join(", ")}/><ReviewText label="Lesson" value={trade.lesson}/>
              <TradeChartGallery attachments={trade.attachments}/>
              {trade.videoUrl ? <p><a className="btn secondary" href={trade.videoUrl} target="_blank" rel="noopener noreferrer">Watch trade video ↗</a></p> : null}
              <Link className="btn secondary" href={`/app/journal/${trade.id}`}>Review trade</Link>
            </article>;
          }) : <p className="empty">No closed trades recorded for this account and period.</p>}
        </section>
      </div>
      <section className="review-evidence section hindsight-summary"><span className="eyebrow">Session reconstruction</span><h2>Trade that should have been taken</h2>
        {snapshot.hindsightTrade ? <><div className="detail-grid"><Row label="Symbol" value={snapshot.hindsightTrade.symbol || "—"}/><Row label="Direction" value={snapshot.hindsightTrade.direction === "NO_TRADE" ? "No trade" : snapshot.hindsightTrade.direction || "—"}/><Row label="Entry time" value={snapshot.hindsightTrade.entryTime ? `${snapshot.hindsightTrade.entryTime} New York` : "—"}/></div><ReviewText label="Why this was correct" value={snapshot.hindsightTrade.rationale}/><Charts images={hindsightImages(snapshot.hindsightTrade)} label="Correct trade in hindsight chart" empty="No hindsight charts recorded."/></> : <p>No hindsight trade recorded. Add the setup, or record that no trade was the right decision, in Edit reflection.</p>}
      </section>
      <div className="backtest-trade-notes section"><section><h3>What worked</h3><ReviewText label="Wins" value={review.wins}/></section><section><h3>What cost you</h3><ReviewText label="Mistakes" value={review.mistakes}/><Row label="Most frequent mistake" value={snapshot.topMistake || "None recorded"}/></section><section><h3>Lessons to carry forward</h3><ReviewText label="Lesson" value={review.lessons}/></section><section><h3>Next session adjustment</h3><ReviewText label="Action" value={review.goals}/><Link className="btn secondary" href={workflowHref("/app",review.accountId)}>Open session workspace</Link></section></div>
      <ReviewText label="Additional review notes" value={review.notes}/>
      <Charts images={review.attachments} label="Review chart" empty=""/>
      <details className="section optional-metrics"><summary>More performance details</summary><div className="review-priority-metrics section"><Metric label="Profit factor" value={snapshot.profitFactor ? Number(snapshot.profitFactor).toFixed(2) : "—"}/><Metric label="Expectancy" value={money(snapshot.expectancy || 0, currency)}/><Metric label="Average hold" value={duration(snapshot.averageHoldMs || 0)}/><Metric label="Average winner hold" value={duration(snapshot.winnerHoldMs || 0)}/><Metric label="Average loser hold" value={duration(snapshot.loserHoldMs || 0)}/><Metric label="Average win" value={money(snapshot.averageWin || 0, currency)}/><Metric label="Average loss" value={money(snapshot.averageLoss || 0, currency)}/><Metric label="Max drawdown" value={money(snapshot.maxDrawdown || 0, currency)}/></div></details>
      <div className="section"><ReviewNavigation previous={previous} next={next}/></div>
    </section>
  </div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div><span className="stat-label">{label}</span><div className="stat-value">{value}</div></div>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="detail-row"><span>{label}</span><b>{value}</b></div>; }
function ReviewText({ label, value }: { label: string; value: string | null }) { return <div className="review-text"><span className="stat-label">{label}</span><p>{value || "Not recorded."}</p></div>; }
function Charts({ images, label, empty }: { images: { objectKey: string }[]; label: string; empty: string }) {
  if (!images.length) return empty ? <p className="help">{empty}</p> : null;
  return <div className="trade-images section">{images.map((image, index) => { const url = chartImageUrl(image.objectKey); return <a href={url} target="_blank" rel="noreferrer" key={`${image.objectKey}-${index}`}><Image src={url} alt={`${label} ${index + 1}`} width={1100} height={620} sizes="(max-width: 900px) 100vw, 650px" unoptimized/></a>; })}</div>;
}

function ReviewNavigation({ previous, next }: { previous: { id: string } | null; next: { id: string } | null }) {
  return <nav className="backtest-carousel-nav" aria-label="Review navigation">
        {previous ? <NavigationLink className="btn secondary" href={`/app/reviews/${previous.id}`}><ChevronLeft size={16}/>Previous review</NavigationLink> : <button className="btn secondary" disabled><ChevronLeft size={16}/>Previous review</button>}
        <span>Newest reviews first</span>
        {next ? <NavigationLink className="btn secondary" href={`/app/reviews/${next.id}`}>Next review<ChevronRight size={16}/></NavigationLink> : <button className="btn secondary" disabled>Next review<ChevronRight size={16}/></button>}
      </nav>;
}
