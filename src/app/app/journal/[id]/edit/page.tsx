import Link from "next/link";
import { TradeVideoField } from "@/components/trade-video-field";
import { WorkflowNav } from "@/components/workflow-nav";
import { newYorkDateKey } from "@/lib/time";
import { notFound } from "next/navigation";
import { v2 as cloudinary } from "cloudinary";
import { updateTrade } from "@/app/actions";
import { TradeScreenshots } from "@/components/trade-screenshots";
import { db } from "@/lib/db";
import { accounts, viewer } from "@/lib/data";
import { dateOnlyValue, newYorkDateTimeValue } from "@/lib/time";
import { SubmitButton } from "@/components/confirm-submit-button";
import { MistakeFields } from "@/components/mistake-fields";


export default async function EditTrade({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ importBatch?: string }> }) {
  const user = await viewer();
  const { id } = await params;
  const [trade, accountList, playbooks, plans] = await Promise.all([
    db.trade.findFirst({ where: { id, account: { userId: user.id } }, include: { instrument: true, attachments: true, tags: true } }),
    accounts(),
    db.playbook.findMany({ where: { userId: user.id }, orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
    db.tradePlan.findMany({ where: { userId: user.id }, include: { account: true }, orderBy: { planDate: "desc" } }),
  ]);
  if (!trade) notFound();
  const { importBatch } = await searchParams;
  const batch = importBatch ? await db.importBatch.findFirst({ where: { id: importBatch, userId: user.id, status: "COMMITTED" } }) : null;
  const mapping = batch?.mapping as { tradeIds?: unknown } | undefined;
  const ids = Array.isArray(mapping?.tradeIds) ? mapping.tradeIds.filter((value): value is string => typeof value === "string") : [];
  const position = ids.indexOf(id), nextId = position >= 0 ? ids[position + 1] : undefined;
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
  const dt = newYorkDateTimeValue;

  return <div className="content">{trade.source==="LIVE"?<WorkflowNav current="trade" account={trade.accountId} date={newYorkDateKey(trade.openedAt)}/>:null}
    <div className="page-head"><div><span className="eyebrow">Correct and learn</span><h1>Edit {trade.instrument.symbol}</h1><p>Update both the execution and the decision behind it.</p></div></div>
    <form action={updateTrade} className="card form-grid">
      {position >= 0 ? <div className="full"><h2>Imported trade {position + 1} of {ids.length}</h2><p>Execution details are prefilled. Check the prices, times and multiplier, add fees and complete your review. Saving continues to the next trade.</p><input type="hidden" name="importBatchId" value={batch!.id}/>{nextId ? <><input type="hidden" name="nextImportTradeId" value={nextId}/><Link href={`/app/journal/${nextId}/edit?importBatch=${batch!.id}`}>Complete this trade later · next trade →</Link></> : null}</div> : null}
      <input type="hidden" name="id" value={trade.id}/><input type="hidden" name="behaviorReview" value="1"/>
      <Field label="Account"><select name="accountId" defaultValue={trade.accountId}>{accountList.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></Field>
      <Field label="Symbol"><input name="symbol" defaultValue={trade.instrument.symbol} required/></Field>

      <Field label="Direction"><select name="direction" defaultValue={trade.direction}><option>LONG</option><option>SHORT</option></select></Field>
      <Field label="Quantity" help="Shares, contracts, or lots traded."><input name="quantity" type="number" step="any" min="0.00000001" defaultValue={trade.quantity.toString()} required/></Field>

      <Field label="Entry"><input name="entry" type="number" step="any" defaultValue={trade.averageEntry.toString()} required/></Field>
      <Field label="Exit"><input name="exit" type="number" step="any" defaultValue={trade.averageExit?.toString()} required={Boolean(trade.closedAt)}/></Field>
      <Field label="Stop loss price" help={trade.stopLossPoints ? `${trade.stopLossPoints.toString()} points from entry` : "Distance is calculated automatically."}><input name="stopPrice" type="number" step="any" min="0.00000001" defaultValue={trade.stopPrice?.toString()}/></Field>
      <Field label="Take profit price" help={trade.takeProfitPoints ? `${trade.takeProfitPoints.toString()} points from entry` : "Distance is calculated automatically."}><input name="targetPrice" type="number" step="any" min="0.00000001" defaultValue={trade.targetPrice?.toString()}/></Field>
      <Field label="Entry time (New York)"><input name="openedAt" type="datetime-local" defaultValue={dt(trade.openedAt)} required/></Field>
      <Field label="Exit time (New York)"><input name="closedAt" type="datetime-local" defaultValue={trade.closedAt ? dt(trade.closedAt) : ""} required={Boolean(trade.closedAt)}/></Field>
      <Field label="Commissions & fees"><input name="fees" type="number" step="any" min="0" defaultValue={trade.fees.toString()}/></Field>
      <div className="full section"><h2>Post-trade review</h2><p className="help">Judge the process separately from the profit or loss.</p></div>
      <Field label="Daily plan"><select name="planId" defaultValue={trade.planId || ""}><option value="">No daily plan</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{dateOnlyValue(plan.planDate)} · {plan.account.name} · {plan.marketBias||"Neutral"}</option>)}</select></Field>
      <Field label="Strategy"><select name="playbookId" defaultValue={trade.playbookId || ""}><option value="">Off-plan / no strategy</option>{playbooks.map((playbook) => <option key={playbook.id} value={playbook.id}>{playbook.name}{playbook.isActive?"":" · archived"}</option>)}</select></Field>
      <div className="field full"><label>Entry conditions</label><textarea name="entryConditions" defaultValue={trade.entryConditions||""}/></div>
      <Field label="Exit conditions · stop"><input name="stopPlan" defaultValue={trade.stopPlan||""}/></Field>
      <Field label="Exit conditions · profit-taking"><input name="targetPlan" defaultValue={trade.targetPlan||""}/></Field>
      <Field label="Trade quality"><select name="qualityGrade" defaultValue={trade.qualityGrade || ""}><option value="">Not graded</option><option value="A">A · Textbook</option><option value="B">B · Valid, minor flaws</option><option value="C">C · Low quality</option></select></Field>
      <Field label="Did you follow your plan?"><select name="followedPlan" defaultValue={trade.followedPlan === null ? "" : String(trade.followedPlan)}><option value="">Not reviewed</option><option value="true">Yes — followed plan</option><option value="false">No — off-plan</option></select></Field>
      <MistakeFields selected={trade.mistakes}/>
      <div className="field full"><label>News on the day</label><textarea name="newsOnDay" defaultValue={trade.newsOnDay || ""} placeholder="Market-moving news or scheduled events relevant to this trade"/></div>
      <div className="field full"><label>One lesson from this trade</label><input name="lesson" defaultValue={trade.lesson || ""} placeholder="What will you repeat or change next time?"/></div>
      <div className="full section"><h2>Trade video & chart images</h2></div>
      <TradeVideoField defaultValue={trade.videoUrl}/>
      <TradeScreenshots initialImages={trade.attachments.map(image=>({key:image.objectKey,mimeType:image.mimeType,size:image.size,timeframe:image.timeframe,preview:cloudinary.url(image.objectKey,{type:"authenticated",sign_url:true,secure:true})}))}/>
      <details className="full optional-metrics"><summary>Instrument settings</summary><div className="form-grid section">
      <Field label="Asset class"><select name="assetClass" defaultValue={trade.instrument.assetClass}><option>STOCK</option><option>FUTURE</option><option>FOREX</option></select></Field>
      <Field label="Multiplier" help="Money value of a 1-point move per unit. MNQ is $2."><input name="multiplier" type="number" step="any" min="0.00000001" defaultValue={trade.instrument.pointValue.toString()} required/></Field>
      </div></details><div className="full"><SubmitButton className="btn" pendingLabel="Saving changes…" successMessage="Trade updated">{position >= 0 ? nextId ? "Save & next trade" : "Save & finish import" : "Save changes"}</SubmitButton></div>
    </form>
  </div>;
}

function Field({ label, children, help }: { label: string; children: React.ReactNode; help?: string }) {
  return <div className="field"><label>{label}</label>{children}{help ? <span className="help">{help}</span> : null}</div>;
}
