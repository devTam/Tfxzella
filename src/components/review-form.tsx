"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { createReview } from "@/app/actions";
import { SubmitButton } from "@/components/confirm-submit-button";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import { money } from "@/lib/format";

type Account = { id: string; name: string };
type ReviewTrade = { id: string; symbol: string; accountId: string; direction: string; dayKey: string; tradeTime: string; netPnl: string; currency: string; lesson: string | null; checkedRules: string[] };

type ReviewPlan = { id: string; accountId: string; accountName: string; day: string; bias: string | null; drawOnLiquidity: string | null; thesis: string | null; images: {id:string;url:string}[] };
export function ReviewForm({ accounts, trades, initialDate, initialAccount = "", plans = [] }: { accounts: Account[]; trades: ReviewTrade[]; initialDate: string; initialAccount?: string; plans?: ReviewPlan[] }) {
  const [period, setPeriod] = useState("DAILY");
  const [accountId, setAccountId] = useState(initialAccount);
  const [startsAt, setStartsAt] = useState(initialDate);
  const [endsAt, setEndsAt] = useState(initialDate);
  const dailyTrades = useMemo(() => trades.filter((trade) => trade.dayKey === startsAt && (!accountId || trade.accountId === accountId)), [accountId, startsAt, trades]);

  const matchingPlans = plans.filter(plan=>plan.day>=startsAt&&plan.day<=(period==="DAILY"?startsAt:endsAt)&&(!accountId||plan.accountId===accountId));

  return <form action={createReview} className="card form-grid review-form">
    <h2 className="full">Create review</h2>
    <Field label="Period"><select name="period" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="DAILY">Daily · close the session</option><option value="WEEKLY">Weekly · find patterns</option><option value="MONTHLY">Monthly · assess progress</option></select></Field>
    <Field label="Account"><select name="accountId" value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="">All accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></Field>
    <Field label={period === "DAILY" ? "Trading day" : "Starts"}><input name="startsAt" type="date" value={startsAt} onChange={(event) => { const value = event.target.value; setStartsAt(value); if (period === "DAILY" || endsAt < value) setEndsAt(value); }} required/></Field>
    {period === "DAILY" ? <input name="endsAt" type="hidden" value={startsAt}/> : <Field label="Ends"><input name="endsAt" type="date" value={endsAt} min={startsAt} onChange={(event) => setEndsAt(event.target.value)} required/></Field>}
    <Field label="Rating (1–5)"><input name="rating" type="number" min="1" max="5"/></Field>
    <section className="full review-expectations"><h3>Start with the original expectation</h3><p className="help">What did you anticipate, and did your execution respect the plan? Review charts before interpreting the outcome.</p>{matchingPlans.length?<div className="grid">{matchingPlans.map(plan=><article key={plan.id} className="trade-context"><b>{plan.day} · {plan.accountName} · {plan.bias||"Neutral"}</b><p>{plan.thesis||"No thesis recorded."}</p><p><b>DOL:</b> {plan.drawOnLiquidity||"Not recorded"}</p>{plan.images.length?<div className="expectation-thumbnails">{plan.images.map(image=><a key={image.id} href={image.url} target="_blank" rel="noreferrer"><Image src={image.url} alt={`${plan.day} expectation chart; open full size`} width={360} height={220} unoptimized/></a>)}</div>:null}<Link href={`/app/plans/${plan.id}`} target="_blank" rel="noreferrer">Compare expectation with trades ↗</Link></article>)}</div>:<p className="help">No daily bias saved for this period and account. You can still reflect on the session and prepare a bias next time.</p>}</section>
    {period === "DAILY" ? <>
      <div className="field full"><label>Trades closed on {startsAt}</label>{dailyTrades.length ? <div className="review-trade-list">{dailyTrades.map((trade) => { const pnl = Number(trade.netPnl); return <article key={trade.id}><div><Link href={`/app/journal/${trade.id}`} target="_blank" rel="noreferrer"><b>{trade.symbol} · {trade.direction === "LONG" ? "Long" : "Short"}</b> ↗</Link><small>{trade.tradeTime}</small>{trade.lesson ? <small>Lesson: {trade.lesson}</small> : null}{trade.checkedRules.length ? <div className="review-trade-rules">{trade.checkedRules.map((rule) => <span className="badge" key={rule}>{rule}</span>)}</div> : null}</div><strong className={pnl >= 0 ? "positive" : "negative"}>{money(trade.netPnl, trade.currency)}</strong></article>; })}</div> : <div className="empty review-trades-empty">No closed trades found for this day and account.</div>}<span className="help">Review metrics use trades closed during this New York day. Bias comparison uses trades opened that day, so overnight trades may appear on different days.</span></div>
      <section className="full hindsight-trade"><div><h3>Correct trade in hindsight</h3><p className="help">Reconstruct the session, including a valid no-trade decision. Distinguish what was knowable at entry from what became clear afterward.</p></div><div className="form-grid">
        <Field label="Symbol"><input name="hindsightSymbol" placeholder="MNQ"/></Field>
        <Field label="Direction"><select name="hindsightDirection"><option value="">Select direction</option><option>LONG</option><option>SHORT</option><option>NO_TRADE</option></select></Field>
        <Field label="Entry time (New York)"><input name="hindsightEntryTime" type="time"/></Field>
        <ScreenshotUpload label="Hindsight chart" maxImages={1}/>
        <Field label="What evidence supported this setup?" full><textarea name="hindsightRationale" placeholder="Describe the valid setup, confirmation, and invalidation."/></Field>
      </div></section>
    </> : null}
    {[['wins','What worked?'],['mistakes','What cost you?'],['lessons','What did you learn?'],['goals','One change for next period'],['notes','Additional notes']].map(([name,label]) => <Field key={name} label={label} full><textarea name={name} placeholder={name==="goals"?"One observable action, e.g. record setup confirmation before every entry. Revisit this in the next session.":name==="lessons"?"Which decision would you repeat or change, regardless of P&L?":undefined}/></Field>)}
    <SubmitButton className="btn" pendingLabel="Creating review…" successMessage="Review created">Save review & next adjustment</SubmitButton>
  </form>;
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={`field ${full ? "full" : ""}`}><label>{label}</label>{children}</div>;
}
