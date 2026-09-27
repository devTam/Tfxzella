import { describe, expect, it } from "vitest";
import { calculateMetrics, groupExecutions } from "./trades";
describe("groupExecutions",()=>{
  it("calculates a scaled long trade",()=>{ const [t]=groupExecutions([{side:"BUY",quantity:2,price:100,executedAt:"2025-01-01T10:00:00Z"},{side:"BUY",quantity:2,price:110,executedAt:"2025-01-01T10:01:00Z"},{side:"SELL",quantity:4,price:120,commission:4,executedAt:"2025-01-01T11:00:00Z"}]); expect(t.averageEntry.toNumber()).toBe(105); expect(t.netPnl.toNumber()).toBe(56); expect(t.status).toBe("WIN"); });
  it("calculates a short future with multiplier",()=>{ const [t]=groupExecutions([{side:"SELL",quantity:1,price:5000,executedAt:"2025-01-01"},{side:"BUY",quantity:1,price:4990,fees:2,executedAt:"2025-01-02"}],50); expect(t.netPnl.toNumber()).toBe(498); expect(t.direction).toBe("SHORT"); });
  it("creates a reversal as two cycles",()=>{ const x=groupExecutions([{side:"BUY",quantity:1,price:10,executedAt:"2025-01-01"},{side:"SELL",quantity:2,price:12,executedAt:"2025-01-02"}]); expect(x).toHaveLength(2); expect(x[1].status).toBe("OPEN"); expect(x[1].direction).toBe("SHORT"); });
});
describe("calculateMetrics",()=>{ it("handles no losses",()=>{ const m=calculateMetrics([{netPnl:10,closedAt:new Date()},{netPnl:20,closedAt:new Date()}]); expect(m.profitFactor).toBeNull(); expect(m.winRate.toNumber()).toBe(100); }); });
