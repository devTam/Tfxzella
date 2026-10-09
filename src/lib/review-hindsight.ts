export type HindsightImage = { objectKey: string; mimeType: string; size: number };
export type HindsightTrade = {
  symbol: string | null;
  direction: string | null;
  entryTime: string | null;
  image: HindsightImage | null;
  rationale: string | null;
};

export function buildHindsightTrade({ period, symbol, direction, entryTime, rationale, image, userId }: {
  period: "DAILY" | "WEEKLY" | "MONTHLY";
  symbol: string;
  direction: string;
  entryTime: string;
  rationale: string;
  image?: HindsightImage;
  userId: string;
}): HindsightTrade | null {
  if (direction && !["LONG", "SHORT", "NO_TRADE"].includes(direction)) throw new Error("Invalid hindsight trade direction");
  if (image && !image.objectKey.startsWith(`tfxzella/users/${userId}/`)) throw new Error("Invalid hindsight image");
  if (period !== "DAILY") return null;
  if (![symbol, direction, entryTime, rationale].some(Boolean) && !image) return null;
  return { symbol: symbol.toUpperCase() || null, direction: direction || null, entryTime: entryTime || null, image: image || null, rationale: rationale || null };
}
