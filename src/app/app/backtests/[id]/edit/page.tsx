import Link from "next/link";
import { notFound } from "next/navigation";
import { updateBacktestSession } from "@/app/actions";
import { db } from "@/lib/db";
import { accounts,viewer } from "@/lib/data";
import { SubmitButton } from "@/components/confirm-submit-button";
import { newYorkDateTimeValue } from "@/lib/time";

export default async function EditBacktestSessionPage({params}:{params:Promise<{id:string}>}){
  const user=await viewer(),{id}=await params;
  const [session,accountList]=await Promise.all([
    db.backtestSession.findFirst({where:{id,userId:user.id},include:{_count:{select:{trades:true}}}}),
    accounts(),
  ]);
  if(!session)notFound();
  const accountLocked=session._count.trades>0;
  return <div className="content"><div className="page-head"><div><span className="eyebrow">Backtesting</span><h1>Edit session</h1><p>Update the replay window, name, and notes.</p></div></div>
    <form action={updateBacktestSession} className="card form-grid">
      <input type="hidden" name="id" value={session.id}/>
      <div className="field"><label>Session name</label><input name="name" defaultValue={session.name} required/></div>
      <div className="field"><label>Account</label>{accountLocked?<><input type="hidden" name="accountId" value={session.accountId}/><select value={session.accountId} disabled>{accountList.map(account=><option value={account.id} key={account.id}>{account.name}</option>)}</select><span className="help">The account is locked because this session has recorded trades.</span></>:<select name="accountId" defaultValue={session.accountId} required>{accountList.map(account=><option value={account.id} key={account.id}>{account.name}</option>)}</select>}</div>
      <div className="field"><label>Historical start (New York)</label><input name="marketStartedAt" type="datetime-local" defaultValue={newYorkDateTimeValue(session.marketStartedAt)} required/></div>
      <div className="field"><label>Historical end (New York, optional)</label><input name="marketEndedAt" type="datetime-local" defaultValue={session.marketEndedAt?newYorkDateTimeValue(session.marketEndedAt):""}/></div>
      <div className="field full"><label>Session notes</label><textarea name="notes" defaultValue={session.notes||""}/></div>
      <div className="actions full"><SubmitButton className="btn" pendingLabel="Saving changes…" successMessage="Session updated">Save changes</SubmitButton><Link className="btn secondary" href={`/app/backtests/${session.id}`}>Cancel</Link></div>
    </form>
  </div>;
}
