import Decimal from "decimal.js";

type Value = { toString(): string } | string | number | null;

/** Price risk for the position, before fees or slippage. */
export function tradeRiskAmount({ entry, stop, quantity, multiplier }: {
  entry: Value; stop: Value; quantity: Value; multiplier: Value;
}) {
  if (entry === null || stop === null || quantity === null || multiplier === null) return null;
  const size = new Decimal(quantity.toString()), pointValue = new Decimal(multiplier.toString());
  if (!size.isFinite() || !pointValue.isFinite() || size.lte(0) || pointValue.lte(0)) return null;
  const risk = new Decimal(entry.toString()).minus(stop.toString()).abs().mul(size).mul(pointValue);
  return risk.isFinite() ? risk : null;
}
