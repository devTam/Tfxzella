"use client";

import Image from "next/image";
import { ClipboardPaste, ImagePlus, LoaderCircle, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { MAX_SCREENSHOTS, type Timeframe } from "@/lib/screenshots";

export type InitialScreenshot = { key: string; mimeType: string; size: number; preview: string };
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const EMPTY: InitialScreenshot[] = [];

export function ScreenshotUpload({ label = "Chart screenshots", maxImages = MAX_SCREENSHOTS, initialImages = EMPTY, timeframe }: { label?: string; maxImages?: number; initialImages?: InitialScreenshot[]; timeframe?: Timeframe }) {
  const id = useId(), container = useRef<HTMLDivElement>(null), uploading = useRef(false), urls = useRef<string[]>([]);
  const [items, setItems] = useState(initialImages), [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    const form = container.current?.closest("form");
    const preventEarlySave = (event: Event) => {
      if (uploading.current) { event.preventDefault(); event.stopImmediatePropagation(); toast.warning("Wait for all chart uploads to finish before saving"); }
    };
    form?.addEventListener("submit", preventEarlySave, true);
    const previews = urls.current;
    return () => { form?.removeEventListener("submit", preventEarlySave, true); previews.forEach(url => URL.revokeObjectURL(url)); };
  }, []);

  async function uploadFiles(files: File[]) {
    if (uploading.current || !files.length) return;
    const available = Math.max(0, maxImages - items.length);
    if (!available) { setError(`You can attach up to ${maxImages} screenshots here`); return; }
    uploading.current = true; setBusy(true); setError("");
    const failures: string[] = [];
    let added = 0;
    try {
      for (const file of files.slice(0, available)) {
        try {
          if (!ACCEPTED.includes(file.type) || file.size <= 0 || file.size > 5_000_000) throw new Error("Choose a PNG, JPEG, or WebP up to 5MB");
          const signed = await fetch("/api/uploads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mimeType: file.type, size: file.size }) });
          const config = await signed.json();
          if (!signed.ok) throw new Error(config.error || "Could not prepare upload");
          const body = new FormData();
          body.set("file", file);
          for (const key of ["api_key", "timestamp", "signature", "folder", "public_id", "type", "overwrite"]) body.set(key, String(key === "api_key" ? config.apiKey : config[key]));
          const response = await fetch(config.uploadUrl, { method: "POST", body }), result = await response.json();
          if (!response.ok) throw new Error(result.error?.message || "Upload failed");
          const preview = URL.createObjectURL(file); urls.current.push(preview);
          const item = { key: result.public_id as string, mimeType: file.type, size: file.size, preview };
          setItems(current => [...current, item]); added++;
        } catch (cause) { failures.push(`${file.name}: ${cause instanceof Error ? cause.message : "Upload failed"}`); }
      }
      if (files.length > available) failures.push(`Only ${available} images fit. Remove an image before adding more.`);
      if (added) toast.success(`${added} screenshot${added === 1 ? "" : "s"} uploaded`);
      if (failures.length) { setError(failures.join(" · ")); toast.error("Some screenshots could not be added; successful uploads were kept"); }
    } finally { uploading.current = false; setBusy(false); }
  }

  return <div className="field full" ref={container}>
    <label id={`${id}-label`} htmlFor={id}>{label}</label>
    <div className="paste-zone" tabIndex={0} role="group" aria-labelledby={`${id}-label`} aria-describedby={`${id}-help`} aria-busy={busy} onPaste={event => {
      const files = Array.from(event.clipboardData.items).filter(item => item.kind === "file").map(item => item.getAsFile()).filter((file): file is File => Boolean(file));
      if (files.length) { event.preventDefault(); event.stopPropagation(); void uploadFiles(files); }
    }}>
      <ClipboardPaste size={22}/>
      <div><strong>Choose multiple charts or paste here</strong><span>Click this area, then press Cmd+V or Ctrl+V. Charts go only into this group.</span></div>
      <label className="btn secondary" htmlFor={id} aria-disabled={busy || items.length >= maxImages}>
        {busy ? <LoaderCircle className="spin" size={16}/> : <ImagePlus size={16}/>} {busy ? "Uploading…" : "Choose images"}
        <input id={id} type="file" accept={ACCEPTED.join(",")} multiple hidden disabled={busy || items.length >= maxImages} onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ""; void uploadFiles(files); }}/>
      </label>
    </div>
    <span id={`${id}-help`} className="help">PNG, JPEG, or WebP · 5MB each · {items.length}/{maxImages} attached</span>
    {error ? <p className="negative" role="alert">{error}</p> : null}
    <div className="preview-grid">{items.map((item, index) => <div className="preview" key={item.key}>
      <Image src={item.preview} alt={`${label} ${index + 1}`} fill unoptimized sizes="160px"/>
      <button type="button" disabled={busy} aria-label={`Remove ${label} screenshot ${index + 1}`} onClick={() => setItems(current => current.filter(image => image.key !== item.key))}><X size={14}/></button>
      <input type="hidden" name="attachmentKey" value={item.key}/><input type="hidden" name="attachmentMime" value={item.mimeType}/><input type="hidden" name="attachmentSize" value={item.size}/><input type="hidden" name="attachmentTimeframe" value={timeframe || ""}/>
    </div>)}</div>
  </div>;
}
