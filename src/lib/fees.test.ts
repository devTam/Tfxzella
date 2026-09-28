import { describe, expect, it } from "vitest";
import { calculateCommission } from "@/lib/fees";

describe("calculateCommission",()=>{
  it("calculates Tradeify MNQ round-trip fees",()=>expect(calculateCommission("TRADEIFY","MNQ",5)).toBe(9.1));
  it("normalizes symbol case",()=>expect(calculateCommission("TRADEIFY","mnq",2)).toBe(3.64));
  it("preserves manual fees",()=>expect(calculateCommission("MANUAL","MNQ",5,7.5)).toBe(7.5));
  it("preserves manual fees for unsupported symbols",()=>expect(calculateCommission("TRADEIFY","AAPL",5,1)).toBe(1));
});
