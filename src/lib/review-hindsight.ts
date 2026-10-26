import { MAX_SCREENSHOTS, validateScreenshot } from "./screenshots";
export type HindsightImage = { objectKey: string; mimeType: string; size: number };
export type HindsightTrade = {
  symbol: string | null;
  direction: string | null;
  entryTime: string | null;
  image?: HindsightImage | null;
  images?: HindsightImage[];
  rationale: string | null;
};

/** Read both earlier single-chart reviews and new multi-chart reviews. */
export function hindsightImages(trade?: Pick<HindsightTrade, "image" | "images"> | null): HindsightImage[] {
  return trade?.images ?? (trade?.image ? [trade.image] : []);
}

export function buildHindsightTrade({ period, symbol, direction, entryTime, rationale, image, images, userId }: {
  period: "DAILY" | "WEEKLY" | "MONTHLY";
  symbol: string; direction: string; entryTime: string; rationale: string;
  image?: HindsightImage; images?: HindsightImage[]; userId: string;
}): HindsightTrade | null {
  if (direction && !["LONG", "SHORT", "NO_TRADE"].includes(direction)) throw new Error("Invalid hindsight trade direction");
  const charts = images ?? (image ? [image] : []);
  if (charts.length > MAX_SCREENSHOTS) throw new Error(`Attach up to ${MAX_SCREENSHOTS} hindsight charts`);
  for (const chart of charts) {
    try { validateScreenshot(chart, userId); } catch { throw new Error("Invalid hindsight image"); }
  }
  if (period !== "DAILY") return null;
  if (![symbol, direction, entryTime, rationale].some(Boolean) && !charts.length) return null;
  return { symbol: symbol.toUpperCase() || null, direction: direction || null, entryTime: entryTime || null, images: charts, image: charts[0] || null, rationale: rationale || null };
}
