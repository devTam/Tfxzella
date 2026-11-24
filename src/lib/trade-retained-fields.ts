import type { Trade } from "@prisma/client";

const retainedFields = ["initialRisk", "plannedEntry", "plannedStop", "plannedTarget", "maximumFavorablePrice", "maximumAdversePrice", "confidence", "setup", "emotion", "marketCondition", "notes"] as const;

// Removing an input from the journal must not erase data on older trades.
export function retainedTradeFields(form: FormData, trade: Pick<Trade, typeof retainedFields[number]>) {
  return Object.fromEntries(retainedFields.filter(field => !form.has(field)).map(field => [field, trade[field]]));
}
