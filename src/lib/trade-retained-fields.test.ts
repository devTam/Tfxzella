import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { retainedTradeFields } from "./trade-retained-fields";

describe("removed journal inputs", () => {
  const trade = { initialRisk: new Prisma.Decimal(100), plannedEntry: new Prisma.Decimal(1000), plannedStop: null, plannedTarget: null, maximumFavorablePrice: null, maximumAdversePrice: null, confidence: 4, setup: "Legacy setup", emotion: "Calm", marketCondition: "Trending", notes: "Keep these notes" };
  it("preserves old values when the simplified form does not include them", () => {
    expect(retainedTradeFields(new FormData(), trade)).toEqual(trade);
  });
  it("allows explicit inputs from other clients to update or clear retained fields", () => {
    const form = new FormData();
    form.set("notes", "");
    form.set("initialRisk", "200");
    const retained = retainedTradeFields(form, trade);
    expect(retained).not.toHaveProperty("notes");
    expect(retained).not.toHaveProperty("initialRisk");
    expect(retained.confidence).toBe(4);
  });
});
