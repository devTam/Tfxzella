import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseTradeImport } from "@/lib/trade-import";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData(), file = form.get("file"), accountId = String(form.get("accountId") || "");
  if (!(file instanceof File) || file.size > 5_000_000) return Response.json({ error: "Choose a CSV smaller than 5MB" }, { status: 400 });
  const account = await db.tradingAccount.findFirst({ where: { id: accountId, userId: session.user.id } });
  if (!account) return Response.json({ error: "Account not found" }, { status: 404 });
  const source = await file.text(), fingerprint = randomUUID();
  let parsed;
  try { parsed = parseTradeImport(source, { timezone: "America/New_York", strategySymbol: String(form.get("strategySymbol") || ""), assetClass: String(form.get("assetClass") || "STOCK"), multiplier: String(form.get("multiplier") || "1") }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not read this CSV" }, { status: 400 }); }
  if (!parsed.trades.length) return Response.json({ error: parsed.errors[0]?.message || "No valid trades were found", errors: parsed.errors }, { status: 400 });
  const userId = session.user.id;
  await db.importBatch.deleteMany({ where: { userId } });
  await db.$transaction(async tx => {
    const batch = await tx.importBatch.create({ data: { userId, accountId, filename: file.name, fingerprint, status: "PREVIEW", mapping: { mode: parsed.format }, rowCount: parsed.rowCount } });
    for (const item of parsed.trades) {
      const instrument = await tx.instrument.upsert({ where: { accountId_symbol: { accountId, symbol: item.symbol } }, update: {}, create: { accountId, symbol: item.symbol, assetClass: item.assetClass, pointValue: item.multiplier } });
      const cycle = item.cycle;
      const trade = await tx.trade.create({ data: { accountId, instrumentId: instrument.id, direction: cycle.direction, status: cycle.status, openedAt: cycle.openedAt, closedAt: cycle.closedAt, quantity: cycle.quantity.toString(), averageEntry: cycle.averageEntry.toString(), averageExit: cycle.averageExit?.toString(), grossPnl: cycle.grossPnl.toString(), netPnl: cycle.netPnl.toString(), fees: cycle.fees.toString(), returnPercent: cycle.returnPercent?.toString(), setup: item.setup, newsOnDay: item.newsOnDay, notes: item.notes } });
      await tx.execution.createMany({ data: cycle.fills.map(fill => ({ accountId, instrumentId: instrument.id, tradeId: trade.id, importBatchId: batch.id, side: fill.side, quantity: String(fill.quantity), price: String(fill.price), commission: String(fill.commission ?? 0), fees: String(fill.fees ?? 0), executedAt: new Date(fill.executedAt) })) });
    }
    await tx.importBatch.delete({ where: { id: batch.id } });
  });
  return Response.json({ imported: parsed.trades.length, errors: parsed.errors, format: parsed.format });
}
