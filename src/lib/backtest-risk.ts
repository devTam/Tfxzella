import Decimal from "decimal.js";

type Price = { toString(): string } | string | number | null;

export function backtestRiskReward({ entry, stop, target, exit, direction }: {
  entry: Price; stop: Price; target: Price; exit: Price; direction: "LONG" | "SHORT";
}) {
  const rewardPrice = target ?? exit;
  if (entry === null || stop === null || rewardPrice === null) return null;
  const entryPrice = new Decimal(entry.toString()), stopPrice = new Decimal(stop.toString());
  const sign = direction === "LONG" ? 1 : -1;
  const risk = entryPrice.minus(stopPrice).mul(sign);
  if (!risk.isFinite() || risk.lte(0)) return null;
  const ratio = new Decimal(rewardPrice.toString()).minus(entryPrice).mul(sign).div(risk);
  return ratio.isFinite() ? { ratio, basis: target !== null ? "Take profit" : "Exit" } : null;
}
