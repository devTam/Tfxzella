import { createAccount, createTag, deleteTag, toggleAccountArchive, updateAccount, updateProfile, updateTag } from "@/app/actions";
import { db } from "@/lib/db";
import { viewer } from "@/lib/data";
import { SubmitButton } from "@/components/confirm-submit-button";

export const metadata={title:"Settings"};

export default async function Settings(){
  const user=await viewer();
  const [accounts,tags]=await Promise.all([
    db.tradingAccount.findMany({where:{userId:user.id},orderBy:{createdAt:"asc"}}),
    db.tag.findMany({where:{userId:user.id},orderBy:{name:"asc"}}),
  ]);
  return <div className="content">
    <div className="page-head"><div><span className="eyebrow">Workspace controls</span><h1>Settings</h1><p>Manage profile, accounts, tags, localization, and data.</p></div></div>
    <div className="grid two">
      <form action={updateProfile} className="card"><h2>Profile</h2><Field label="Name"><input name="name" defaultValue={user.name||""} required/></Field><div className="field section"><label>Email</label><input value={user.email||""} readOnly/></div><div className="actions section"><SubmitButton className="btn" pendingLabel="Saving profile…" successMessage="Profile saved">Save profile</SubmitButton><a className="btn secondary" href="/api/export?format=json">Export data</a></div></form>
      <form action={createAccount} className="card form-grid"><h2 className="full">Add trading account</h2><Field label="Name"><input name="name" required/></Field><Field label="Type"><select name="type"><option>DEMO</option><option>LIVE</option><option>PROP</option></select></Field><Field label="Currency"><input name="currency" defaultValue="USD" maxLength={3}/></Field><Field label="Timezone"><input value="America/New_York" readOnly/></Field><Field label="Starting balance"><input name="startingBalance" type="number" step="any" defaultValue="0"/></Field><SubmitButton className="btn" pendingLabel="Adding account…" successMessage="Account added">Add account</SubmitButton></form>
    </div>
    <section className="card section"><h2>Trading accounts</h2><div className="grid">{accounts.map(account=><form action={updateAccount} className="form-grid compact-card" style={{borderBottom:"1px solid var(--line)"}} key={account.id}>
      <input type="hidden" name="id" value={account.id}/><input type="hidden" name="archived" value={String(Boolean(account.archivedAt))}/>
      <Field label="Name"><input name="name" defaultValue={account.name} required/></Field><Field label="Type"><select name="type" defaultValue={account.type}><option>DEMO</option><option>LIVE</option><option>PROP</option></select></Field><Field label="Currency"><input name="currency" defaultValue={account.currency} maxLength={3}/></Field><Field label="Timezone"><input value="America/New_York" readOnly/></Field><Field label="Starting balance"><input name="startingBalance" type="number" step="any" defaultValue={account.startingBalance.toString()}/></Field><Field label="Week starts"><select name="weekStartsOn" defaultValue={account.weekStartsOn}><option value="1">Monday</option><option value="0">Sunday</option><option value="6">Saturday</option></select></Field>
      <div className="actions full"><SubmitButton className="btn" pendingLabel="Saving account…" successMessage="Account saved">Save</SubmitButton><SubmitButton className="btn secondary" formAction={toggleAccountArchive} pendingLabel={account.archivedAt?"Restoring…":"Archiving…"} successMessage={account.archivedAt?"Account restored":"Account archived"}>{account.archivedAt?"Restore":"Archive"}</SubmitButton>{account.archivedAt?<span className="badge">ARCHIVED</span>:null}</div>
    </form>)}</div></section>
    <section className="card section"><h2>Tags</h2><form action={createTag} className="inline-form"><Field label="New tag"><input name="name" required placeholder="A+ setup"/></Field><Field label="Color"><input name="color" type="color" defaultValue="#725cff"/></Field><SubmitButton className="btn" pendingLabel="Adding tag…" successMessage="Tag added">Add tag</SubmitButton></form><div className="grid section">{tags.map(tag=><form action={updateTag} className="inline-form" key={tag.id}><input type="hidden" name="id" value={tag.id}/><input name="name" defaultValue={tag.name} required/><input name="color" type="color" defaultValue={tag.color}/><SubmitButton className="btn secondary" pendingLabel="Saving…" successMessage="Tag saved">Save</SubmitButton><SubmitButton className="btn danger" formAction={deleteTag} pendingLabel="Deleting…" successMessage="Tag deleted">Delete</SubmitButton></form>)}</div></section>
  </div>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <div className="field"><label>{label}</label>{children}</div>}
