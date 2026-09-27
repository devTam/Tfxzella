import {describe,expect,it} from "vitest";
import {excursionMetrics,processScore,reviewCompleteness} from "./skill-metrics";

describe("skill metrics",()=>{
  it("scores process independently from pnl",()=>expect(processScore({followedPlan:true,qualityGrade:"A",checkedRules:["Wait"],initialRisk:50,plan:{riskBudget:100},playbook:{entryChecklist:["Wait"]}})).toBe(100));
  it("measures review completion",()=>expect(reviewCompleteness({confidence:4,qualityGrade:"A",followedPlan:true,emotion:"Calm",lesson:"Wait",notes:null})).toBe(100));
  it("calculates long excursion and exit efficiency",()=>expect(excursionMetrics({direction:"LONG",averageEntry:100,averageExit:108,maximumFavorablePrice:110,maximumAdversePrice:98})).toEqual({mfePoints:10,maePoints:2,exitEfficiency:80}));
  it("calculates short excursion",()=>expect(excursionMetrics({direction:"SHORT",averageEntry:100,averageExit:94,maximumFavorablePrice:92,maximumAdversePrice:103})).toEqual({mfePoints:8,maePoints:3,exitEfficiency:75}));
});
