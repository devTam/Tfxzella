"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { createReview } from "@/app/actions";
import { SubmitButton } from "@/components/confirm-submit-button";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import type { ReviewDay } from "@/lib/review-days";
import { ReviewTrades, type ReviewTrade } from "@/components/review-trades";

type Account = { id: string; name: string };


export function ReviewForm({ accounts, trades, initialDate, initialAccount = "", plans = [] }: { accounts: Account[]; trades: ReviewTrade[]; initialDate: string; initialAccount?: string; plans?: ReviewDay[] }) {
  const [period, setPeriod] = useState("DAILY");
  const [accountId, setAccountId] = useState(initialAccount);
  const [startsAt, setStartsAt] = useState(initialDate);
  const [endsAt, setEndsAt] = useState(initialDate);

  const matchingPlans = plans.filter(plan=>plan.day>=startsAt&&plan.day<=(period==="DAILY"?startsAt:endsAt)&&(!accountId||plan.accountId===accountId));

  return <form action={createReview} className="card form-grid review-form">
    <h2 className="full">Create review</h2>
    <Field label="Period"><select name="period" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="DAILY">Daily · close the session</option><option value="WEEKLY">Weekly · find patterns</option><option value="MONTHLY">Monthly · assess progress</option></select></Field>
    <Field label="Account"><select name="accountId" value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="">All accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></Field>
    <Field label={period === "DAILY" ? "Trading day" : "Starts"}><input name="startsAt" type="date" value={startsAt} onChange={(event) => { const value = event.target.value; setStartsAt(value); if (period === "DAILY" || endsAt < value) setEndsAt(value); }} required/></Field>
    {period === "DAILY" ? <input name="endsAt" type="hidden" value={startsAt}/> : <Field label="Ends"><input name="endsAt" type="date" value={endsAt} min={startsAt} onChange={(event) => setEndsAt(event.target.value)} required/></Field>}
    <Field label="Rating (1–5)"><input name="rating" type="number" min="1" max="5"/></Field>
    <section className="full review-expectations"><h3>Start with the original expectation</h3><p className="help">What did you anticipate, and did your execution respect the plan? Review charts before interpreting the outcome.</p>{matchingPlans.length?<div className="grid">{matchingPlans.map(plan=><article key={plan.id} className="trade-context"><b>{plan.day} · {plan.accountName} · {plan.hasBias ? plan.bias || "Neutral" : "No daily bias recorded"}</b><p>{plan.hasBias ? plan.thesis || "No thesis recorded." : "Review the saved charts and actual trades for this session."}</p>{plan.hasBias ? <p><b>DOL:</b> {plan.drawOnLiquidity||"Not recorded"}</p> : null}{plan.images.length?<div className="expectation-thumbnails">{plan.images.map(image=><a key={image.id} href={image.url} target="_blank" rel="noreferrer"><Image src={image.url} alt={`${plan.day} ${plan.hasBias ? "expectation" : "session"} chart; open full size`} width={360} height={220} unoptimized/></a>)}</div>:null}<Link href={plan.comparisonHref} target="_blank" rel="noreferrer">Compare expectation with trades ↗</Link></article>)}</div>:<p className="help">No daily bias, trades, or daily reviews saved for this period and account.</p>}</section>
    <ReviewTrades trades={trades} accountId={accountId} startsAt={startsAt} endsAt={period === "DAILY" ? startsAt : endsAt}/>
    {period === "DAILY" ? <>

      <section className="full hindsight-trade"><div><h3>Correct trade in hindsight</h3><p className="help">Reconstruct the session, including a valid no-trade decision. Distinguish what was knowable at entry from what became clear afterward.</p></div><div className="form-grid">
        <Field label="Symbol"><input name="hindsightSymbol" placeholder="MNQ"/></Field>
        <Field label="Direction"><select name="hindsightDirection"><option value="">Select direction</option><option>LONG</option><option>SHORT</option><option>NO_TRADE</option></select></Field>
        <Field label="Entry time (New York)"><input name="hindsightEntryTime" type="time"/></Field>
        <ScreenshotUpload label="Correct trade · hindsight charts"/>
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
