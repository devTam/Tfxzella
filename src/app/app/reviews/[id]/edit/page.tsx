import { v2 as cloudinary } from "cloudinary";
import { notFound } from "next/navigation";
import { updateReview } from "@/app/actions";
import { SubmitButton } from "@/components/confirm-submit-button";
import { ScreenshotUpload, type InitialScreenshot } from "@/components/screenshot-upload";
import { accounts, viewer } from "@/lib/data";
import { db } from "@/lib/db";
import type { HindsightTrade } from "@/lib/review-hindsight";
import { newYorkDateKey } from "@/lib/time";

type Snapshot = { hindsightTrade?: HindsightTrade | null };

export default async function EditReview({ params }: { params: Promise<{ id: string }> }) {
  const user = await viewer(), { id } = await params;
  const [review, accountList] = await Promise.all([
    db.review.findFirst({ where: { id, userId: user.id } }),
    accounts(),
  ]);
  if (!review) notFound();

  const hindsight = (review.metrics as Snapshot).hindsightTrade;
  let initialImages: InitialScreenshot[] = [];
  if (hindsight?.image) {
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
    initialImages = [{ key: hindsight.image.objectKey, mimeType: hindsight.image.mimeType, size: hindsight.image.size, preview: cloudinary.url(hindsight.image.objectKey, { type: "authenticated", sign_url: true, secure: true }) }];
  }

  return <div className="content">
    <div className="page-head"><div><span className="eyebrow">Feedback loop</span><h1>Edit review</h1><p>Update the reflection and the correct trade you identified for the session.</p></div></div>
    <form action={updateReview} className="card form-grid">
      <input type="hidden" name="id" value={id}/>
      <F label="Period"><select name="period" defaultValue={review.period}><option>DAILY</option><option>WEEKLY</option><option>MONTHLY</option></select></F>
      <F label="Account"><select name="accountId" defaultValue={review.accountId || ""}><option value="">All accounts</option>{accountList.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></F>
      <F label="Starts"><input name="startsAt" type="date" defaultValue={newYorkDateKey(review.startsAt)} required/></F>
      <F label="Ends"><input name="endsAt" type="date" defaultValue={newYorkDateKey(review.endsAt)} required/></F>
      <F label="Rating"><input name="rating" type="number" min="1" max="5" defaultValue={review.rating || ""}/></F>

      <section className="full hindsight-trade">
        <div><h3>Correct trade in hindsight</h3><p className="help">Edit the trade the market offered, and keep, remove, or replace its chart.</p></div>
        <div className="form-grid">
          <F label="Symbol"><input name="hindsightSymbol" defaultValue={hindsight?.symbol || ""} placeholder="MNQ"/></F>
          <F label="Direction"><select name="hindsightDirection" defaultValue={hindsight?.direction || ""}><option value="">Select direction</option><option>LONG</option><option>SHORT</option><option>NO_TRADE</option></select></F>
          <F label="Entry time (New York)"><input name="hindsightEntryTime" type="time" defaultValue={hindsight?.entryTime || ""}/></F>
          <ScreenshotUpload label="Hindsight chart" maxImages={1} initialImages={initialImages}/>
          <F label="Why was this the correct trade?" full><textarea name="hindsightRationale" defaultValue={hindsight?.rationale || ""} placeholder="Describe the valid setup, confirmation, and invalidation."/></F>
        </div>
      </section>

      {[["wins", "What worked?", review.wins], ["mistakes", "Mistakes", review.mistakes], ["lessons", "Lessons", review.lessons], ["goals", "Goals", review.goals], ["notes", "Notes", review.notes]].map(([name, label, value]) => <F key={name} label={label || ""} full><textarea name={name || ""} defaultValue={value || ""}/></F>)}
      <div className="form-footer full"><SubmitButton className="btn" pendingLabel="Saving changes…" successMessage="Review updated">Save changes</SubmitButton></div>
    </form>
  </div>;
}

function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={`field ${full ? "full" : ""}`}><label>{label}</label>{children}</div>;
}
