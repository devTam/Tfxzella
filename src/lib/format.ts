export function money(value: number | string, currency="USD") { return new Intl.NumberFormat("en-US",{style:"currency",currency,maximumFractionDigits:2}).format(Number(value)); }
export function pct(value: number | string) { return `${Number(value).toFixed(1)}%`; }
export function duration(milliseconds: number) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return "—";
  const minutes = Math.floor(milliseconds / 60_000);
  if (minutes < 1) return `${Math.floor(milliseconds / 1000)}s`;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60), remainingMinutes = minutes % 60;
  if (hours < 24) return `${hours}h ${remainingMinutes}m`;
  const days = Math.floor(hours / 24), remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}
export function cn(...v: Array<string|false|null|undefined>) { return v.filter(Boolean).join(" "); }
