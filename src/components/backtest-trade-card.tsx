import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { deleteTrade } from "@/app/actions";
import { SubmitButton } from "@/components/confirm-submit-button";
import { TradeChartGallery } from "@/components/trade-chart-gallery";
import { backtestRiskReward } from "@/lib/backtest-risk";
import { formatPoints, tradePoints } from "@/lib/trade-points";
import { tradeRiskAmount } from "@/lib/trade-risk-amount";
import { duration, money } from "@/lib/format";
import { formatNewYorkDateTime } from "@/lib/time";

type Trade = Prisma.TradeGetPayload<{ include: { instrument: true; playbook: true; attachments: true } }>;

export function BacktestTradeCard({ trade, currency, journal = false }: { trade: Trade & { plan?: { id: string } | null }; currency: string; journal?: boolean }) {
  const rewardRisk = backtestRiskReward({ entry: trade.averageEntry, stop: trade.stopPrice, target: trade.targetPrice, exit: trade.averageExit, direction: trade.direction });
  const points = tradePoints({ entry: trade.averageEntry, stop: trade.stopPrice, target: trade.targetPrice, exit: trade.averageExit, direction: trade.direction });
  const riskAmount = tradeRiskAmount({ entry: trade.averageEntry, stop: trade.stopPrice, quantity: trade.quantity, multiplier: trade.instrument.pointValue });
  return <article className="backtest-trade" aria-label={`${trade.instrument.symbol} ${journal ? "journal" : "backtest"} trade`}>
    <div className="widget-head"><div><span className="stat-label">{trade.direction}</span><h2>{trade.instrument.symbol}</h2></div><div className="actions"><Link className="btn secondary" href={`/app/journal/${trade.id}/edit`}><Pencil size={15}/>Edit trade</Link><form action={deleteTrade}><input type="hidden" name="id" value={trade.id}/><input type="hidden" name="redirectAfterDelete" value="true"/><SubmitButton className="btn danger" pendingLabel="Deleting trade…" successMessage="Trade permanently deleted" confirmMessage={`Permanently delete this ${trade.instrument.symbol} ${journal ? "live" : "backtest"} trade, its executions, review and screenshots? This cannot be undone.`}><Trash2 size={15}/>Delete trade</SubmitButton></form></div></div>
    <dl className="backtest-trade-metrics">
      <Detail label="Entry time (New York)" value={formatNewYorkDateTime(trade.openedAt)}/>
      <Detail label="Exit time (New York)" value={trade.closedAt ? formatNewYorkDateTime(trade.closedAt) : "Open"}/>
      <Detail label="Amount risked (before fees)" value={riskAmount === null ? "Add stop loss to calculate" : money(riskAmount.toString(), currency)}/>
      <Detail label={trade.closedAt ? "Net P&L (actual)" : "Net P&L (so far)"} value={money(trade.netPnl.toString(), currency)} tone={trade.netPnl.gte(0) ? "positive" : "negative"}/>
      <Detail label="Risk to reward" value={rewardRisk ? `1:${rewardRisk.ratio.toFixed(2)}` : "Not available"}/>
      <Detail label="Strategy" value={trade.playbook?.name || trade.setup || "Unassigned"}/>
      <Detail label="Hold time" value={trade.closedAt ? duration(trade.closedAt.getTime() - trade.openedAt.getTime()) : "Open"}/>
    </dl>
    <p className="help">Amount risked = entry-to-stop distance × quantity × contract multiplier. Fees and slippage are excluded from this risk estimate. Net P&amp;L includes recorded commissions and fees.</p>
    <dl className="backtest-trade-metrics">
      <Detail label="Stop loss points" value={formatPoints(points.stop ?? trade.stopLossPoints)}/>
      <Detail label="Take profit points" value={formatPoints(points.target ?? trade.takeProfitPoints)}/>
      <Detail label="Profit / loss points (actual)" value={trade.closedAt ? formatPoints(points.profit) : "Open"} tone={points.profit?.isNegative() ? "negative" : "positive"}/>
    </dl>
    {journal ? <dl className="backtest-trade-metrics">
      <Detail label="Quantity" value={trade.quantity.toString()}/>
      <Detail label="Commissions & fees" value={money(trade.fees.toString(), currency)}/>
      <Detail label="Trade quality" value={trade.qualityGrade || "Not graded"}/>
      <Detail label="Followed plan" value={trade.followedPlan === true ? "Yes" : trade.followedPlan === false ? "No" : "Not reviewed"}/>
      <Detail label="Mistakes" value={trade.mistakes.join(", ") || "No mistakes recorded"}/>
      <div><dt className="stat-label">Daily plan</dt><dd>{trade.plan ? <Link href={`/app/plans/${trade.plan.id}`}>View daily plan ↗</Link> : "No daily plan linked"}</dd></div>
    </dl> : null}
    <dl className="backtest-trade-levels">
      <Detail label="Entry price" value={trade.averageEntry.toString()}/>
      <Detail label="Stop loss" value={trade.stopPrice?.toString() || "Not recorded"}/>
      <Detail label="Take profit" value={trade.targetPrice?.toString() || "Not recorded"}/>
      <Detail label="Exit price" value={trade.averageExit?.toString() || "Open"}/>
    </dl>
    <p className="help">{rewardRisk ? `Risk to reward uses the entry and stop loss prices with the ${rewardRisk.basis.toLowerCase()} price. A negative exit reward indicates a loss.` : "Add a valid stop loss and a take profit or exit price to calculate risk to reward."}</p>
    <div className="backtest-trade-notes">
      <Note label="Entry conditions" value={trade.entryConditions}/>
      <section><h3>Exit conditions</h3><dl><Detail label="Stop condition" value={trade.stopPlan || "Not recorded"}/><Detail label="Profit-taking condition" value={trade.targetPlan || "Not recorded"}/></dl></section>
      <Note label="News on the day" value={trade.newsOnDay}/>
      <Note label="Lessons" value={trade.lesson}/>
    </div>
    {journal ? <section className="section"><h3>Trade video</h3>{trade.videoUrl ? <a className="btn secondary" href={trade.videoUrl} target="_blank" rel="noopener noreferrer">Watch trade video ↗</a> : <p>No trade video linked.</p>}</section> : null}
    <section className="section"><h3>Chart pictures</h3><TradeChartGallery attachments={trade.attachments}/></section>
  </article>;
}

function Detail({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return <div><dt className="stat-label">{label}</dt><dd className={tone}>{value}</dd></div>;
}
function Note({ label, value }: { label: string; value: string | null }) {
  return <section><h3>{label}</h3><p>{value || "Not recorded"}</p></section>;
}
