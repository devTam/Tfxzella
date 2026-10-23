export function TradeVideoField({ defaultValue }: { defaultValue?: string | null }) {
  return <div className="field full">
    <label htmlFor="videoUrl">Trade video link (optional)</label>
    <input id="videoUrl" name="videoUrl" type="url" maxLength={2048} defaultValue={defaultValue || ""} placeholder="https://www.loom.com/share/…" aria-describedby="videoUrl-help"/>
    <span id="videoUrl-help" className="help">Link a recording of your trade to revisit during review. Clear the field to remove the link.</span>
  </div>;
}
