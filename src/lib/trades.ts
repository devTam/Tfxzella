import Decimal from "decimal.js";

export type Fill = { id?: string; side: "BUY" | "SELL"; quantity: Decimal.Value; price: Decimal.Value; commission?: Decimal.Value; fees?: Decimal.Value; executedAt: Date | string };
export type PositionCycle = { direction: "LONG" | "SHORT"; openedAt: Date; closedAt: Date | null; quantity: Decimal; averageEntry: Decimal; averageExit: Decimal | null; grossPnl: Decimal; fees: Decimal; netPnl: Decimal; returnPercent: Decimal | null; status: "OPEN" | "WIN" | "LOSS" | "BREAKEVEN"; fills: Fill[] };

export function groupExecutions(input: Fill[], multiplier: Decimal.Value = 1): PositionCycle[] {
  const fills = [...input].sort((a,b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime());
  const cycles: PositionCycle[] = [];
  let current: { direction:"LONG"|"SHORT"; openQty:Decimal; entryValue:Decimal; exitQty:Decimal; exitValue:Decimal; gross:Decimal; fees:Decimal; openedAt:Date; fills:Fill[] } | null = null;
  const mult = new Decimal(multiplier);
  for (const fill of fills) {
    const qty = new Decimal(fill.quantity);
    const price = new Decimal(fill.price);
    if (!qty.isPositive() || !price.isPositive()) throw new Error("Quantity and price must be positive");
    const sideSign = fill.side === "BUY" ? 1 : -1;
    let remaining = qty;
    const fillFee = new Decimal(fill.commission ?? 0).plus(fill.fees ?? 0);
    while (remaining.gt(0)) {
      if (!current) current = { direction: sideSign > 0 ? "LONG" : "SHORT", openQty:new Decimal(0), entryValue:new Decimal(0), exitQty:new Decimal(0), exitValue:new Decimal(0), gross:new Decimal(0), fees:new Decimal(0), openedAt:new Date(fill.executedAt), fills:[] };
      const directionSign = current.direction === "LONG" ? 1 : -1;
      const isOpening = sideSign === directionSign;
      if (isOpening) {
        current.entryValue = current.entryValue.plus(remaining.times(price));
        current.openQty = current.openQty.plus(remaining);
        current.fees = current.fees.plus(fillFee);
        current.fills.push(fill);
        remaining = new Decimal(0);
      } else {
        const closeQty = Decimal.min(remaining, current.openQty);
        const averageEntry = current.entryValue.div(current.openQty);
        current.exitQty = current.exitQty.plus(closeQty);
        current.exitValue = current.exitValue.plus(closeQty.times(price));
        current.gross = current.gross.plus(price.minus(averageEntry).times(closeQty).times(directionSign).times(mult));
        current.entryValue = current.entryValue.minus(averageEntry.times(closeQty));
        current.openQty = current.openQty.minus(closeQty);
        current.fees = current.fees.plus(fillFee.times(closeQty.div(qty)));
        current.fills.push(fill);
        remaining = remaining.minus(closeQty);
        if (current.openQty.eq(0)) {
          const originalQty = current.exitQty;
          const averageExit = current.exitValue.div(current.exitQty);
          const net = current.gross.minus(current.fees);
          const cost = averageEntry.times(originalQty).times(mult);
          cycles.push({ direction:current.direction, openedAt:current.openedAt, closedAt:new Date(fill.executedAt), quantity:originalQty, averageEntry, averageExit, grossPnl:current.gross, fees:current.fees, netPnl:net, returnPercent:cost.eq(0)?null:net.div(cost).times(100), status:net.gt(0)?"WIN":net.lt(0)?"LOSS":"BREAKEVEN", fills:current.fills });
          current = null;
        }
      }
    }
  }
  if (current) {
    const averageEntry = current.entryValue.div(current.openQty);
    cycles.push({ direction:current.direction, openedAt:current.openedAt, closedAt:null, quantity:current.openQty, averageEntry, averageExit:null, grossPnl:current.gross, fees:current.fees, netPnl:current.gross.minus(current.fees), returnPercent:null, status:"OPEN", fills:current.fills });
  }
  return cycles;
}

export type MetricTrade = { netPnl: Decimal.Value; grossPnl?: Decimal.Value; fees?: Decimal.Value; closedAt?: Date | null };
export function calculateMetrics(trades: MetricTrade[]) {
  const closed = trades.filter(t => t.closedAt !== null);
  const pnls = closed.map(t => new Decimal(t.netPnl));
  const wins = pnls.filter(p => p.gt(0));
  const losses = pnls.filter(p => p.lt(0));
  const netPnl = Decimal.sum(0, ...pnls);
  const grossPnl = Decimal.sum(0, ...closed.map(t => new Decimal(t.grossPnl ?? t.netPnl)));
  const fees = Decimal.sum(0, ...closed.map(t => new Decimal(t.fees ?? 0)));
  const grossWins = Decimal.sum(0, ...wins);
  const grossLosses = Decimal.sum(0, ...losses.map(p=>p.abs()));
  let peak = new Decimal(0), equity = new Decimal(0), maxDrawdown = new Decimal(0);
  for (const pnl of pnls) { equity=equity.plus(pnl); peak=Decimal.max(peak,equity); maxDrawdown=Decimal.max(maxDrawdown,peak.minus(equity)); }
  return { totalTrades:closed.length, wins:wins.length, losses:losses.length, netPnl, grossPnl, fees, winRate:closed.length?new Decimal(wins.length).div(closed.length).times(100):new Decimal(0), profitFactor:grossLosses.eq(0)?(grossWins.gt(0)?null:new Decimal(0)):grossWins.div(grossLosses), expectancy:closed.length?netPnl.div(closed.length):new Decimal(0), averageWin:wins.length?grossWins.div(wins.length):new Decimal(0), averageLoss:losses.length?grossLosses.div(losses.length):new Decimal(0), payoffRatio:losses.length&&wins.length?grossWins.div(wins.length).div(grossLosses.div(losses.length)):new Decimal(0), maxDrawdown };
}
