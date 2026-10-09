import Link from "next/link";
import { createPlan, deletePlan } from "@/app/actions";
import { db } from "@/lib/db";
import { accounts, viewer } from "@/lib/data";
import { SubmitButton } from "@/components/confirm-submit-button";
import { formatDateOnly } from "@/lib/time";

export const metadata={title:"Trade plans"};
export default async function Plans(){
  const u=await viewer();
  const [list,playbooks,plans]=await Promise.all([accounts(),db.playbook.findMany({where:{userId:u.id,isActive:true},orderBy:{name:"asc"}}),db.tradePlan.findMany({where:{userId:u.id},include:{account:true,playbook:true},orderBy:{planDate:"desc"}})]);
  return <div className="content"><div className="page-head"><div><span className="eyebrow">Prepare with intent</span><h1>Daily plans</h1><p>Create, revisit, edit, or remove every session plan.</p></div></div><div className="grid two plans-layout">
    <form action={createPlan} className="card form-grid plan-form"><h2 className="full">Plan a session</h2>
      <Field label="Account"><select name="accountId">{list.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field><Field label="Date"><input name="planDate" type="date" required/></Field>
      <Field label="Strategy"><select name="playbookId"><option value="">No specific strategy</option>{playbooks.map(playbook=><option key={playbook.id} value={playbook.id}>{playbook.name}</option>)}</select></Field><Field label="Market bias"><select name="marketBias"><option>Neutral</option><option>Bullish</option><option>Bearish</option></select></Field>
      <Field label="Risk budget"><input name="riskBudget" type="number" step="any" min="0"/></Field><Field label="Maximum trades"><input name="maxTrades" type="number" min="1" step="1"/></Field><Field label="Watchlist" full><input name="watchlist" placeholder="ES, NQ, AAPL"/></Field>
      <Field label="Thesis" full><textarea name="thesis"/></Field><Field label="News on the day" full><textarea name="newsOnDay" placeholder="CPI, FOMC, earnings, or other session-wide catalysts"/><span className="help">Automatically added to every trade linked to this plan.</span></Field>
      <Field label="Notes" full><textarea name="notes"/></Field><div className="form-footer full"><SubmitButton className="btn" pendingLabel="Saving plan…" successMessage="Plan saved">Save plan</SubmitButton></div>
    </form>
    <section className="card"><h2>Recent plans</h2>{plans.length?<div className="grid">{plans.map(p=><article key={p.id} className="compact-card" style={{borderBottom:"1px solid var(--line)"}}><div style={{display:"flex",justifyContent:"space-between"}}><b>{formatDateOnly(p.planDate)}</b><span className="badge">{p.marketBias||"Neutral"}</span></div><p>{p.account.name} · {p.playbook?.name||"Any strategy"} · {p.watchlist.join(", ")||"No watchlist"}</p><div>{p.thesis||"No thesis recorded."}</div>{p.newsOnDay?<small>News: {p.newsOnDay}</small>:null}{p.riskBudget||p.maxTrades?<small>Guardrails: {p.riskBudget?`${p.account.currency} ${p.riskBudget}`:"No risk cap"} · {p.maxTrades?`${p.maxTrades} trades max`:"No trade cap"}</small>:null}<div className="actions section"><Link className="btn secondary" href={`/app/plans/${p.id}/edit`}>Edit</Link><form action={deletePlan}><input type="hidden" name="id" value={p.id}/><SubmitButton className="btn danger" pendingLabel="Deleting…" successMessage="Plan deleted">Delete</SubmitButton></form></div></article>)}</div>:<div className="empty">Your session plans will appear here.</div>}</section>
  </div></div>;
}
function Field({label,children,full}:{label:string;children:React.ReactNode;full?:boolean}){return <div className={`field ${full?"full":""}`}><label>{label}</label>{children}</div>}
