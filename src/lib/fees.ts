export const TRADEIFY_ROUND_TRIP:Record<string,number>={MNQ:1.82};

export function calculateCommission(schedule:string,symbol:string,quantity:number,manual=0){
  const rate=schedule==="TRADEIFY"?TRADEIFY_ROUND_TRIP[symbol.trim().toUpperCase()]:undefined;
  return rate===undefined?manual:Math.round(rate*quantity*100)/100;
}
