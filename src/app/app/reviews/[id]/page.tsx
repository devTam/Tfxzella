import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { v2 as cloudinary } from "cloudinary";
import { ClickableTableRow } from "@/components/clickable-table-row";
import { db } from "@/lib/db";
import { viewer } from "@/lib/data";
import { duration, money, pct } from "@/lib/format";
import { formatNewYorkDate, formatNewYorkDateTime } from "@/lib/time";

type HindsightTrade = { symbol: string | null; direction: string | null; entryTime: string | null; image: { objectKey: string; mimeType: string; size: number } | null; rationale: string | null };
type Snapshot = { trades?: number; netPnl?: string; winRate?: string; profitFactor?: string | null; expectancy?: string; averageWin?: string; averageLoss?: string; maxDrawdown?: string; averageHoldMs?: number; winnerHoldMs?: number; loserHoldMs?: number; discipline?: number | null; bestTradeId?: string | null; worstTradeId?: string | null; topMistake?: string | null; hindsightTrade?: HindsightTrade | null };

export default async function ReviewDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await viewer(), { id } = await params;
  const review = await db.review.findFirst({ where: { id, userId: user.id }, include: { account: true } });
  if (!review) notFound();
  const where={ account: { userId: user.id }, accountId: review.accountId || undefined, deletedAt: null, closedAt: { gte: review.startsAt, lte: review.endsAt } };
  const trades = await db.trade.findMany({ where, include: { instrument: true, account: true }, orderBy: [{ openedAt: "desc" }, { id: "desc" }] });
  const snapshot = review.metrics as Snapshot, currency = review.account?.currency || trades[0]?.account.currency || "USD";
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
  const hindsightImageUrl = snapshot.hindsightTrade?.image ? cloudinary.url(snapshot.hindsightTrade.image.objectKey, { type: "authenticated", sign_url: true, secure: true }) : null;
  return <div className="content"><div className="page-head"><div><Link className="back-link" href="/app/reviews"><ArrowLeft size={15}/>All reviews</Link><span className="eyebrow">{review.period.toLowerCase()} review</span><h1>{formatNewYorkDate(review.startsAt)} – {formatNewYorkDate(review.endsAt)}</h1><p>Snapshot preserved from the day this review was created.</p></div><Link className="btn" href={`/app/reviews/${review.id}/edit`}><Pencil size={15}/>Edit reflection</Link></div>
    <section className="analytics-kpis"><Metric label="Net P&L" value={money(snapshot.netPnl || 0, currency)}/><Metric label="Win rate" value={pct(snapshot.winRate || 0)}/><Metric label="Profit factor" value={snapshot.profitFactor ? Number(snapshot.profitFactor).toFixed(2) : "—"}/><Metric label="Expectancy" value={money(snapshot.expectancy || 0, currency)}/><Metric label="Discipline" value={snapshot.discipline == null ? "—" : pct(snapshot.discipline)}/><Metric label="Avg hold" value={duration(snapshot.averageHoldMs || 0)}/></section>
    <div className="grid two section"><section className="card"><h2>Hold-time check</h2><div className="detail-grid"><Row label="Average winner" value={duration(snapshot.winnerHoldMs || 0)}/><Row label="Average loser" value={duration(snapshot.loserHoldMs || 0)}/><Row label="Average win" value={money(snapshot.averageWin || 0, currency)}/><Row label="Average loss" value={money(snapshot.averageLoss || 0, currency)}/><Row label="Max drawdown" value={money(snapshot.maxDrawdown || 0, currency)}/><Row label="Top mistake" value={snapshot.topMistake || "None recorded"}/></div></section><section className="card"><h2>One-change framework</h2><ReviewText label="What worked" value={review.wins}/><ReviewText label="What cost you" value={review.mistakes}/><ReviewText label="Lesson" value={review.lessons}/><ReviewText label="Next adjustment" value={review.goals}/></section></div>
    {snapshot.hindsightTrade ? <section className="card section hindsight-summary"><div><span className="eyebrow">Session reconstruction</span><h2>Correct trade in hindsight</h2></div><div className="detail-grid"><Row label="Symbol" value={snapshot.hindsightTrade.symbol || "—"}/><Row label="Direction" value={snapshot.hindsightTrade.direction === "NO_TRADE" ? "No trade" : snapshot.hindsightTrade.direction || "—"}/><Row label="Entry time" value={snapshot.hindsightTrade.entryTime ? `${snapshot.hindsightTrade.entryTime} New York` : "—"}/></div>{hindsightImageUrl ? <a className="hindsight-image" href={hindsightImageUrl} target="_blank" rel="noreferrer"><Image src={hindsightImageUrl} alt="Correct trade in hindsight chart" width={1100} height={620} sizes="(max-width: 900px) 100vw, 900px" unoptimized/></a> : null}<ReviewText label="Why this was correct" value={snapshot.hindsightTrade.rationale}/></section> : null}
    <section className="card section"><h2>Trades taken ({trades.length})</h2>{trades.length ? <div className="table-wrap"><table className="table review-trades-table"><thead><tr><th>Trade</th><th>Date</th><th>Hold</th><th>Result</th><th>Lesson</th><th></th></tr></thead><tbody>{trades.map((trade) => <ClickableTableRow href={`/app/journal/${trade.id}`} label={`Review ${trade.instrument.symbol} trade`} key={trade.id}><td><b>{trade.instrument.symbol}</b> · {trade.direction}</td><td>{formatNewYorkDateTime(trade.openedAt)}</td><td>{trade.closedAt ? duration(trade.closedAt.getTime() - trade.openedAt.getTime()) : "Open"}</td><td className={Number(trade.netPnl) >= 0 ? "positive" : "negative"}>{money(trade.netPnl.toString(), trade.account.currency)}</td><td className="trade-lesson">{trade.lesson || <span className="help">No lesson recorded.</span>}</td><td><Link className="btn secondary" href={`/app/journal/${trade.id}`}>Review trade</Link></td></ClickableTableRow>)}</tbody></table></div> : <div className="empty">No matching trades.</div>}</section>
  </div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="card"><span className="stat-label">{label}</span><div className="stat-value">{value}</div></div>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="detail-row"><span>{label}</span><b>{value}</b></div>; }
function ReviewText({ label, value }: { label: string; value: string | null }) { return <div className="review-text"><span className="stat-label">{label}</span><p>{value || "Not recorded."}</p></div>; }
