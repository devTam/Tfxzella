export const MAX_SCREENSHOTS = 10;
export const TIMEFRAMES = ["HTF", "MTF", "LTF"] as const;
export type Timeframe = typeof TIMEFRAMES[number];
export const TIMEFRAME_LABELS = { HTF: "HTF · Higher time frame", MTF: "MTF · Middle time frame", LTF: "LTF · Lower time frame" };
export type ScreenshotMetadata = { objectKey: string; mimeType: string; size: number };

export function validateScreenshot(image: ScreenshotMetadata, userId: string) {
  const prefix = `tfxzella/users/${userId}/`;
  if (!image.objectKey.startsWith(prefix) || !/^[a-zA-Z0-9_-]+$/.test(image.objectKey.slice(prefix.length)) ||
      !["image/png", "image/jpeg", "image/webp"].includes(image.mimeType) ||
      !Number.isInteger(image.size) || image.size <= 0 || image.size > 5_000_000) {
    throw new Error("Invalid screenshot. Upload a PNG, JPEG, or WebP up to 5MB from your account.");
  }
}

export function screenshotFields(form: FormData, userId: string, categorized = false) {
  const keys = form.getAll("attachmentKey"), types = form.getAll("attachmentMime"), sizes = form.getAll("attachmentSize"), frames = form.getAll("attachmentTimeframe");
  if (keys.length !== types.length || keys.length !== sizes.length || (frames.length && frames.length !== keys.length)) throw new Error("Incomplete screenshot details");
  if (!categorized && keys.length > MAX_SCREENSHOTS) throw new Error(`Attach up to ${MAX_SCREENSHOTS} screenshots`);
  const counts = new Map<string, number>(), seen = new Set<string>();
  return keys.map((key, index) => {
    const image = { objectKey: String(key), mimeType: String(types[index]), size: Number(sizes[index]) };
    validateScreenshot(image, userId);
    if (seen.has(image.objectKey)) throw new Error("The same screenshot was attached more than once");
    seen.add(image.objectKey);
    const frame = String(frames[index] || "");
    if (frame && (!categorized || !TIMEFRAMES.includes(frame as Timeframe))) throw new Error("Invalid screenshot timeframe");
    counts.set(frame, (counts.get(frame) || 0) + 1);
    // Legacy uncategorized trade images are retained, even if older records exceed the new limit.
    if (frame && counts.get(frame)! > MAX_SCREENSHOTS) throw new Error(`Attach up to ${MAX_SCREENSHOTS} screenshots per timeframe`);
    return { ...image, timeframe: (frame || null) as Timeframe | null, userId };
  });
}
