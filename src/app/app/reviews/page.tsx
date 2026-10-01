import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createReview, deleteReview } from "@/app/actions";
import { db } from "@/lib/db";
import { accounts, viewer } from "@/lib/data";
import { money, pct } from "@/lib/format";
import { SubmitButton } from "@/components/confirm-submit-button";

export const metadata = { title: "Reviews" };
type Snapshot = { trades?: number; netPnl?: string; winRate?: string; discipline?: number | null; topMistake?: string | null };

export default async function Reviews() {
  const user = await viewer();
  const [accountList, reviews] = await Promise.all([accounts(), db.review.findMany({ where: { userId: user.id }, include: { account: true }, orderBy: { startsAt: "desc" } })]);
  return <div className="content"><div className="page-head"><div><span className="eyebrow">Close the feedback loop</span><h1>Performance reviews</h1><p>Turn a week of trades into one measurable adjustment.</p></div></div><div className="grid review-layout">
    <form action={createReview} className="card form-grid review-form"><h2 className="full">Create review</h2><Field label="Period"><select name="period"><option>DAILY</option><option>WEEKLY</option><option>MONTHLY</option></select></Field><Field label="Account"><select name="accountId"><option value="">All accounts</option>{accountList.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></Field><Field label="Starts"><input name="startsAt" type="date" required/></Field><Field label="Ends"><input name="endsAt" type="date" required/></Field><Field label="Rating (1–5)"><input name="rating" type="number" min="1" max="5"/></Field>{[["wins","What worked?"],["mistakes","What cost you?"],["lessons","What did you learn?"],["goals","One change for next period"],["notes","Additional notes"]].map(([name,label]) => <Field key={name} label={label} full><textarea name={name}/></Field>)}<SubmitButton className="btn" pendingLabel="Creating review…" successMessage="Review created">Create metric snapshot</SubmitButton></form>
    <section className="grid">{reviews.length ? reviews.map((review) => { const metrics = review.metrics as Snapshot; const currency = review.account?.currency || "USD"; return <article className="card review-card" key={review.id}><div className="review-card-head"><div><span className="eyebrow">{review.period.toLowerCase()} review</span><h2>{review.startsAt.toLocaleDateString()} – {review.endsAt.toLocaleDateString()}</h2></div><span className="badge">{review.rating ? `${review.rating}/5` : "Unrated"}</span></div><div className="review-mini-stats"><div><span>Net P&amp;L</span><b className={Number(metrics.netPnl) >= 0 ? "positive" : "negative"}>{money(metrics.netPnl || 0, currency)}</b></div><div><span>Win rate</span><b>{pct(metrics.winRate || 0)}</b></div><div><span>Trades</span><b>{metrics.trades || 0}</b></div><div><span>Discipline</span><b>{metrics.discipline == null ? "—" : pct(metrics.discipline)}</b></div></div><p><b>Next adjustment:</b> {review.goals || "No action chosen yet."}</p>{metrics.topMistake ? <p className="help">Most frequent mistake: {metrics.topMistake}</p> : null}<div className="actions section"><Link className="btn" href={`/app/reviews/${review.id}`}>Open review <ArrowRight size={15}/></Link><Link className="btn secondary" href={`/app/reviews/${review.id}/edit`}>Edit</Link><form action={deleteReview}><input type="hidden" name="id" value={review.id}/><button className="btn danger">Delete</button></form></div></article>; }) : <div className="card empty">Your reviews will build a record of growth.</div>}</section>
  </div></div>;
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) { return <div className={`field ${full ? "full" : ""}`}><label>{label}</label>{children}</div>; }
