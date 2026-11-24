import Decimal from "decimal.js";

type Price = { toString(): string } | string | number | null;
export function tradePoints({ entry, stop, target, exit, direction }: {
  entry: Price; stop: Price; target: Price; exit: Price; direction: "LONG" | "SHORT";
}) {
  const distance = (price: Price, absolute = false) => {
    if (entry === null || price === null) return null;
    const points = new Decimal(price.toString()).minus(entry.toString());
    const result = absolute ? points.abs() : points.mul(direction === "LONG" ? 1 : -1);
    return result.isFinite() ? result : null;
  };
  return { stop: distance(stop, true), target: distance(target), profit: distance(exit) };
}

export function formatPoints(value: { toString(): string } | null | undefined) {
  return value == null ? "Not recorded" : `${value.toString()} pts`;
}
