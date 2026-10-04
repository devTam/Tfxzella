"use client";

import { useMemo, useState } from "react";
import { createReview } from "@/app/actions";
import { SubmitButton } from "@/components/confirm-submit-button";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import { money } from "@/lib/format";

type Account = { id: string; name: string };
type ReviewTrade = { id: string; accountId: string; direction: string; dayKey: string; tradeTime: string; netPnl: string; currency: string; lesson: string | null; checkedRules: string[] };

export function ReviewForm({ accounts, trades, initialDate }: { accounts: Account[]; trades: ReviewTrade[]; initialDate: string }) {
  const [period, setPeriod] = useState("DAILY");
  const [accountId, setAccountId] = useState("");
  const [startsAt, setStartsAt] = useState(initialDate);
  const [endsAt, setEndsAt] = useState(initialDate);
  const dailyTrades = useMemo(() => trades.filter((trade) => trade.dayKey === startsAt && (!accountId || trade.accountId === accountId)), [accountId, startsAt, trades]);

  return <form action={createReview} className="card form-grid review-form">
    <h2 className="full">Create review</h2>
    <Field label="Period"><select name="period" value={period} onChange={(event) => setPeriod(event.target.value)}><option>DAILY</option><option>WEEKLY</option><option>MONTHLY</option></select></Field>
    <Field label="Account"><select name="accountId" value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="">All accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></Field>
    <Field label={period === "DAILY" ? "Trading day" : "Starts"}><input name="startsAt" type="date" value={startsAt} onChange={(event) => { const value = event.target.value; setStartsAt(value); if (period === "DAILY" || endsAt < value) setEndsAt(value); }} required/></Field>
    {period === "DAILY" ? <input name="endsAt" type="hidden" value={startsAt}/> : <Field label="Ends"><input name="endsAt" type="date" value={endsAt} min={startsAt} onChange={(event) => setEndsAt(event.target.value)} required/></Field>}
    <Field label="Rating (1–5)"><input name="rating" type="number" min="1" max="5"/></Field>
    {period === "DAILY" ? <>
      <div className="field full"><label>Trades taken on {startsAt}</label>{dailyTrades.length ? <div className="review-trade-list">{dailyTrades.map((trade) => { const pnl = Number(trade.netPnl); return <article key={trade.id}><div><b>{trade.direction === "LONG" ? "Long" : "Short"}</b><small>{trade.tradeTime}</small>{trade.lesson ? <small>Lesson: {trade.lesson}</small> : null}{trade.checkedRules.length ? <div className="review-trade-rules">{trade.checkedRules.map((rule) => <span className="badge" key={rule}>{rule}</span>)}</div> : null}</div><strong className={pnl >= 0 ? "positive" : "negative"}>{money(trade.netPnl, trade.currency)}</strong></article>; })}</div> : <div className="empty review-trades-empty">No closed trades found for this day and account.</div>}<span className="help">These are the trades actually taken. They are shown for review only.</span></div>
      <section className="full hindsight-trade"><div><h3>Correct trade in hindsight</h3><p className="help">Record the trade the market offered after reviewing the completed session. This is separate from the trades taken above.</p></div><div className="form-grid">
        <Field label="Symbol"><input name="hindsightSymbol" placeholder="MNQ"/></Field>
        <Field label="Direction"><select name="hindsightDirection"><option value="">Select direction</option><option>LONG</option><option>SHORT</option><option>NO_TRADE</option></select></Field>
        <Field label="Entry time (New York)"><input name="hindsightEntryTime" type="time"/></Field>
        <ScreenshotUpload label="Hindsight chart" maxImages={1}/>
        <Field label="Why was this the correct trade?" full><textarea name="hindsightRationale" placeholder="Describe the valid setup, confirmation, and invalidation."/></Field>
      </div></section>
    </> : null}
    {[['wins','What worked?'],['mistakes','What cost you?'],['lessons','What did you learn?'],['goals','One change for next period'],['notes','Additional notes']].map(([name,label]) => <Field key={name} label={label} full><textarea name={name}/></Field>)}
    <SubmitButton className="btn" pendingLabel="Creating review…" successMessage="Review created">Create metric snapshot</SubmitButton>
  </form>;
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={`field ${full ? "full" : ""}`}><label>{label}</label>{children}</div>;
}
