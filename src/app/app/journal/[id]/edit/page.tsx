import Image from "next/image";
import { notFound } from "next/navigation";
import { v2 as cloudinary } from "cloudinary";
import { deleteAttachment, updateTrade } from "@/app/actions";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import { db } from "@/lib/db";
import { accounts, viewer } from "@/lib/data";
import { newYorkDateTimeValue } from "@/lib/time";
import { SubmitButton } from "@/components/confirm-submit-button";

const MISTAKES = ["FOMO", "Revenge trade", "Overtrading", "Moved stop", "Early exit", "Late entry", "Oversized"];
const EMOTIONS = ["Calm", "Confident", "Hesitant", "Fearful", "Greedy", "Frustrated", "Revenge"];
const CONDITIONS = ["Trending", "Ranging", "High volatility", "Low volatility", "News-driven"];

export default async function EditTrade({ params }: { params: Promise<{ id: string }> }) {
  const user = await viewer();
  const { id } = await params;
  const [trade, accountList, playbooks, plans, tags] = await Promise.all([
    db.trade.findFirst({ where: { id, account: { userId: user.id } }, include: { instrument: true, attachments: true, tags: true } }),
    accounts(),
    db.playbook.findMany({ where: { userId: user.id }, orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
    db.tradePlan.findMany({ where: { userId: user.id }, include: { account: true }, orderBy: { planDate: "desc" } }),
    db.tag.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);
  if (!trade) notFound();
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
  const dt = newYorkDateTimeValue;
  const selectedTags = new Set(trade.tags.map((tag) => tag.tagId));

  return <div className="content">
    <div className="page-head"><div><span className="eyebrow">Correct and learn</span><h1>Edit {trade.instrument.symbol}</h1><p>Update both the execution and the decision behind it.</p></div></div>
    <form action={updateTrade} className="card form-grid">
      <input type="hidden" name="id" value={trade.id}/><input type="hidden" name="behaviorReview" value="1"/>
      <Field label="Account"><select name="accountId" defaultValue={trade.accountId}>{accountList.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></Field>
      <Field label="Symbol"><input name="symbol" defaultValue={trade.instrument.symbol} required/></Field>
      <Field label="Asset class"><select name="assetClass" defaultValue={trade.instrument.assetClass}><option>STOCK</option><option>FUTURE</option><option>FOREX</option></select></Field>
      <Field label="Direction"><select name="direction" defaultValue={trade.direction}><option>LONG</option><option>SHORT</option></select></Field>
      <Field label="Quantity" help="Shares, contracts, or lots traded."><input name="quantity" type="number" step="any" min="0.00000001" defaultValue={trade.quantity.toString()} required/></Field>
      <Field label="Multiplier" help="Money value of a 1-point move per unit. MNQ is $2."><input name="multiplier" type="number" step="any" min="0.00000001" defaultValue={trade.instrument.pointValue.toString()} required/></Field>
      <Field label="Entry"><input name="entry" type="number" step="any" defaultValue={trade.averageEntry.toString()} required/></Field>
      <Field label="Exit"><input name="exit" type="number" step="any" defaultValue={trade.averageExit?.toString()} required/></Field>
      <Field label="Stop loss price" help={trade.stopLossPoints ? `${trade.stopLossPoints.toString()} points from entry` : "Distance is calculated automatically."}><input name="stopPrice" type="number" step="any" min="0.00000001" defaultValue={trade.stopPrice?.toString()}/></Field>
      <Field label="Take profit price" help={trade.takeProfitPoints ? `${trade.takeProfitPoints.toString()} points from entry` : "Distance is calculated automatically."}><input name="targetPrice" type="number" step="any" min="0.00000001" defaultValue={trade.targetPrice?.toString()}/></Field>
      <Field label="Opened"><input name="openedAt" type="datetime-local" defaultValue={dt(trade.openedAt)} required/></Field>
      <Field label="Closed"><input name="closedAt" type="datetime-local" defaultValue={trade.closedAt ? dt(trade.closedAt) : ""} required/></Field>
      <Field label="Fees"><input name="fees" type="number" step="any" min="0" defaultValue={trade.fees.toString()}/></Field>
      <Field label="Initial risk"><input name="initialRisk" type="number" step="any" min="0" defaultValue={trade.initialRisk?.toString()}/></Field>
      <div className="full section"><h2>Post-trade review</h2><p className="help">Judge the process separately from the profit or loss.</p></div>
      <Field label="Daily plan"><select name="planId" defaultValue={trade.planId || ""}><option value="">No daily plan</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.planDate.toISOString().slice(0,10)} · {plan.account.name} · {plan.marketBias||"Neutral"}</option>)}</select></Field>
      <Field label="Strategy"><select name="playbookId" defaultValue={trade.playbookId || ""}><option value="">Off-plan / no strategy</option>{playbooks.map((playbook) => <option key={playbook.id} value={playbook.id}>{playbook.name}{playbook.isActive?"":" · archived"}</option>)}</select></Field>
      <details className="full optional-metrics" open><summary>Plan for this trade</summary><div className="form-grid section"><Field label="Planned entry"><input name="plannedEntry" type="number" min="0" step="any" defaultValue={trade.plannedEntry?.toString()}/></Field><Field label="Planned stop"><input name="plannedStop" type="number" min="0" step="any" defaultValue={trade.plannedStop?.toString()}/></Field><Field label="Planned target"><input name="plannedTarget" type="number" min="0" step="any" defaultValue={trade.plannedTarget?.toString()}/></Field><div className="field full"><label>Entry conditions</label><textarea name="entryConditions" defaultValue={trade.entryConditions||""}/></div><Field label="Stop plan"><input name="stopPlan" defaultValue={trade.stopPlan||""}/></Field><Field label="Target plan"><input name="targetPlan" defaultValue={trade.targetPlan||""}/></Field></div></details>
      <Field label="Trade quality"><select name="qualityGrade" defaultValue={trade.qualityGrade || ""}><option value="">Not graded</option><option value="A">A · Textbook</option><option value="B">B · Valid, minor flaws</option><option value="C">C · Low quality</option></select></Field>
      <Field label="Confidence before entry"><select name="confidence" defaultValue={trade.confidence?.toString() || ""}><option value="">Not recorded</option>{[1,2,3,4,5].map(value=><option key={value} value={value}>{value} · {value===1?"Very low":value===2?"Low":value===3?"Neutral":value===4?"High":"Very high"}</option>)}</select></Field>
      <Field label="Did you follow your plan?"><select name="followedPlan" defaultValue={trade.followedPlan === null ? "" : String(trade.followedPlan)}><option value="">Not reviewed</option><option value="true">Yes — followed plan</option><option value="false">No — off-plan</option></select></Field>
      <Field label="Emotional state"><select name="emotion" defaultValue={trade.emotion || ""}><option value="">Select emotion</option>{EMOTIONS.map((value) => <option key={value}>{value}</option>)}</select></Field>
      <Field label="Market condition"><select name="marketCondition" defaultValue={trade.marketCondition || ""}><option value="">Select condition</option>{CONDITIONS.map((value) => <option key={value}>{value}</option>)}</select></Field>
      <Field label="Setup note"><input name="setup" defaultValue={trade.setup || ""}/></Field>
      <details className="full optional-metrics"><summary>Optional edge metrics · MFE and MAE</summary><div className="form-grid section"><Field label="Best price reached"><input name="maximumFavorablePrice" type="number" min="0" step="any" defaultValue={trade.maximumFavorablePrice?.toString()}/></Field><Field label="Worst price reached"><input name="maximumAdversePrice" type="number" min="0" step="any" defaultValue={trade.maximumAdversePrice?.toString()}/></Field></div></details>
      <div className="field full"><label>Mistakes</label><div className="choice-chips">{MISTAKES.map((mistake) => <label key={mistake}><input type="checkbox" name="mistakes" value={mistake} defaultChecked={trade.mistakes.includes(mistake)}/><span>{mistake}</span></label>)}</div></div>
      {tags.length ? <div className="field full"><label>Custom tags</label><div className="choice-chips">{tags.map((tag) => <label key={tag.id}><input type="checkbox" name="tagIds" value={tag.id} defaultChecked={selectedTags.has(tag.id)}/><span style={{ borderColor: tag.color }}>{tag.name}</span></label>)}</div></div> : null}
      <div className="field full"><label>News on the day</label><textarea name="newsOnDay" defaultValue={trade.newsOnDay || ""} placeholder="Market-moving news or scheduled events relevant to this trade"/></div>
      <div className="field full"><label>One lesson from this trade</label><input name="lesson" defaultValue={trade.lesson || ""} placeholder="What will you repeat or change next time?"/></div>
      <div className="field full"><label>Additional notes</label><textarea name="notes" defaultValue={trade.notes || ""}/></div>
      {trade.attachments.length ? <div className="field full"><label>Attached screenshots</label><div className="preview-grid">{trade.attachments.map((attachment, index) => {
        const url = cloudinary.url(attachment.objectKey, { type: "authenticated", sign_url: true, secure: true });
        const remove = deleteAttachment.bind(null, attachment.id);
        return <div key={attachment.id}><div className="preview"><Image src={url} alt={`Trade screenshot ${index + 1}`} fill sizes="150px" unoptimized/></div><SubmitButton className="btn danger" formAction={remove} pendingLabel="Removing…" successMessage="Screenshot removed">Remove</SubmitButton></div>;
      })}</div></div> : null}
      <ScreenshotUpload/><div className="full"><SubmitButton className="btn" pendingLabel="Saving changes…" successMessage="Trade updated">Save changes</SubmitButton></div>
    </form>
  </div>;
}

function Field({ label, children, help }: { label: string; children: React.ReactNode; help?: string }) {
  return <div className="field"><label>{label}</label>{children}{help ? <span className="help">{help}</span> : null}</div>;
}
