/** Only ordinary web links may be stored and opened as trade videos. */
export function tradeVideoUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || trimmed.length > 2048) throw new Error();
    return url.href;
  } catch {
    throw new Error("Enter a valid http:// or https:// trade video link (up to 2,048 characters)");
  }
}
