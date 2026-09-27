type ProcessTrade={
  followedPlan:boolean|null;qualityGrade:string|null;checkedRules:string[];initialRisk:unknown;
  plan:{riskBudget:unknown}|null;playbook:{entryChecklist:unknown}|null;
};

export function processScore(trade:ProcessTrade){
  let earned=0,possible=0;
  if(trade.followedPlan!==null){possible+=35;if(trade.followedPlan)earned+=35}
  if(trade.qualityGrade){possible+=25;earned+=trade.qualityGrade==="A"?25:trade.qualityGrade==="B"?17:trade.qualityGrade==="C"?8:0}
  const rules=Array.isArray(trade.playbook?.entryChecklist)?trade.playbook.entryChecklist.filter((rule):rule is string=>typeof rule==="string"):[];
  if(rules.length){possible+=25;earned+=25*Math.min(1,trade.checkedRules.filter(rule=>rules.includes(rule)).length/rules.length)}
  const risk=Number(trade.initialRisk),budget=Number(trade.plan?.riskBudget);
  if(risk>0&&budget>0){possible+=15;if(risk<=budget)earned+=15;else earned+=Math.max(0,15*(2-risk/budget))}
  return possible?Math.round(earned/possible*100):null;
}

export function reviewCompleteness(trade:{confidence:number|null;qualityGrade:string|null;followedPlan:boolean|null;emotion:string|null;lesson:string|null;notes:string|null}){
  const fields=[trade.confidence!==null,Boolean(trade.qualityGrade),trade.followedPlan!==null,Boolean(trade.emotion),Boolean(trade.lesson||trade.notes)];
  return Math.round(fields.filter(Boolean).length/fields.length*100);
}

export function excursionMetrics(trade:{direction:"LONG"|"SHORT";averageEntry:unknown;averageExit:unknown;maximumFavorablePrice:unknown;maximumAdversePrice:unknown}){
  const entry=Number(trade.averageEntry),exit=Number(trade.averageExit),favorable=Number(trade.maximumFavorablePrice),adverse=Number(trade.maximumAdversePrice),sign=trade.direction==="LONG"?1:-1;
  const mfe=Number.isFinite(favorable)&&favorable>0?Math.max(0,(favorable-entry)*sign):null;
  const mae=Number.isFinite(adverse)&&adverse>0?Math.max(0,(entry-adverse)*sign):null;
  const captured=mfe&&Number.isFinite(exit)?Math.max(0,Math.min(100,(exit-entry)*sign/mfe*100)):null;
  return {mfePoints:mfe,maePoints:mae,exitEfficiency:captured};
}

export function minutesBetween(earlier:Date,later:Date){return Math.max(0,(later.getTime()-earlier.getTime())/60_000)}
