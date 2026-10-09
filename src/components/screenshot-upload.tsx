"use client";

import Image from "next/image";
import { ClipboardPaste, ImagePlus, LoaderCircle, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Uploaded = { key: string; mimeType: string; size: number; preview: string };
export type InitialScreenshot = Uploaded;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const EMPTY_INITIAL_IMAGES: InitialScreenshot[] = [];

export function ScreenshotUpload({ label = "Trade screenshots", maxImages = 3, initialImages = EMPTY_INITIAL_IMAGES }: { label?: string; maxImages?: number; initialImages?: InitialScreenshot[] }) {
  const [items, setItems] = useState<Uploaded[]>(initialImages);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pasteActive, setPasteActive] = useState(false);

  const uploadOne = useCallback(async (file: File) => {
    if (!ACCEPTED.includes(file.type)) throw new Error("Paste or choose a PNG, JPEG, or WebP image");
    if (file.size > 5_000_000) throw new Error("Each screenshot must be 5MB or smaller");
    const signed = await fetch("/api/uploads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mimeType: file.type, size: file.size }),
    });
    const config = await signed.json();
    if (!signed.ok) throw new Error(config.error || "Could not prepare upload");
    const body = new FormData();
    body.set("file", file);
    body.set("api_key", config.apiKey);
    body.set("timestamp", String(config.timestamp));
    body.set("signature", config.signature);
    body.set("folder", config.folder);
    body.set("public_id", config.public_id);
    body.set("type", config.type);
    body.set("overwrite", String(config.overwrite));
    const response = await fetch(config.uploadUrl, { method: "POST", body });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "Cloudinary upload failed");
    return { key: result.public_id, mimeType: file.type, size: file.size, preview: URL.createObjectURL(file) } satisfies Uploaded;
  }, []);

  const uploadFiles = useCallback(async (files: File[]) => {
    if (busy || !files.length) return;
    const available = maxImages - items.length;
    if (available <= 0) { const warning=`You can attach up to ${maxImages} screenshot${maxImages === 1 ? "" : "s"}`;setError(warning);toast.warning(warning);return; }
    setError("");
    setBusy(true);
    try {
      const uploaded: Uploaded[] = [];
      for (const file of files.slice(0, available)) uploaded.push(await uploadOne(file));
      setItems((current) => [...current, ...uploaded]);
      if (files.length > available){const warning=`Only the first ${available} image${available === 1 ? "" : "s"} were added`;setError(warning);toast.warning(warning)}else toast.success(`${uploaded.length} screenshot${uploaded.length===1?"":"s"} uploaded`);
    } catch (uploadError) {
      const message=uploadError instanceof Error ? uploadError.message : "Upload failed";setError(message);toast.error(message);
    } finally {
      setBusy(false);
    }
  }, [busy, items.length, maxImages, uploadOne]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.items || [])
        .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file));
      if (!files.length) return;
      event.preventDefault();
      setPasteActive(true);
      window.setTimeout(() => setPasteActive(false), 500);
      void uploadFiles(files);
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [uploadFiles]);

  return <div className="field full">
    <label>{label}</label>
    <div className={`paste-zone ${pasteActive ? "active" : ""}`}>
      <ClipboardPaste size={22}/>
      <div><strong>Paste a TradingView chart</strong><span>Copy the chart, return here, then press Cmd+V or Ctrl+V anywhere on the page.</span></div>
      <label className="btn secondary" aria-disabled={busy || items.length >= maxImages}>
        {busy ? <LoaderCircle className="spin" size={16}/> : <ImagePlus size={16}/>} {busy ? "Uploading…" : "Choose image"}
        <input type="file" accept={ACCEPTED.join(",")} multiple={maxImages > 1} hidden disabled={busy || items.length >= maxImages} onChange={(event) => { const files = Array.from(event.target.files || []); if (files.length) void uploadFiles(files); event.target.value = ""; }}/>
      </label>
    </div>
    <span className="help">PNG, JPEG, or WebP · 5MB each · {items.length}/{maxImages} attached</span>
    {error ? <p className="negative" role="alert">{error}</p> : null}
    <div className="preview-grid">{items.map((item, index) => <div className="preview" key={item.key}>
      <Image src={item.preview} alt={`Trade screenshot ${index + 1}`} fill unoptimized sizes="160px"/>
      <button type="button" aria-label="Remove screenshot" onClick={() => { URL.revokeObjectURL(item.preview); setItems((current) => current.filter((image) => image.key !== item.key)); }}><X size={14}/></button>
      <input type="hidden" name="attachmentKey" value={item.key}/><input type="hidden" name="attachmentMime" value={item.mimeType}/><input type="hidden" name="attachmentSize" value={item.size}/>
    </div>)}</div>
  </div>;
}
