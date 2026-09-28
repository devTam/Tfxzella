"use server";
import { hash } from "@node-rs/argon2";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import Decimal from "decimal.js";
import { auth, signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { calculateMetrics, groupExecutions } from "@/lib/trades";
import { v2 as cloudinary } from "cloudinary";

async function userId(){ const s=await auth(); if(!s?.user?.id) redirect("/login"); return s.user.id; }
const text=(fd:FormData,k:string)=>String(fd.get(k)??"").trim();
const lines=(fd:FormData,k:string)=>text(fd,k).split("\n").map(value=>value.trim()).filter(Boolean);
const optionalNumber=(fd:FormData,k:string)=>{const value=text(fd,k);if(!value)return null;const number=Number(value);if(!Number.isFinite(number)||number<0)throw new Error(`${k} must be a positive number`);return value};
const optionalInteger=(fd:FormData,k:string,min:number,max:number)=>{const value=text(fd,k);if(!value)return null;const number=Number(value);if(!Number.isInteger(number)||number<min||number>max)throw new Error(`${k} must be between ${min} and ${max}`);return number};
const attachments=(fd:FormData)=>fd.getAll("attachmentKey").map((key,index)=>({objectKey:String(key),mimeType:String(fd.getAll("attachmentMime")[index]||"image/png"),size:Number(fd.getAll("attachmentSize")[index]||0)})).filter(x=>x.objectKey&&x.size>0);
function revalidatePlaybooks(){revalidatePath("/app/playbooks");revalidatePath("/app/plans");revalidatePath("/app/journal/new");revalidatePath("/app/backtests","layout")}
function revalidateTradeEntry(){revalidatePath("/app/journal/new");revalidatePath("/app/backtests","layout")}
function tradeLevels(formData:FormData,entryValue:string,direction:"LONG"|"SHORT"){
  const entry=new Decimal(entryValue),stopValue=text(formData,"stopPrice"),targetValue=text(formData,"targetPrice");
  const stopPrice=stopValue?new Decimal(stopValue):null,targetPrice=targetValue?new Decimal(targetValue):null;
  if(stopPrice&&(direction==="LONG"?stopPrice.gte(entry):stopPrice.lte(entry)))throw new Error(`Stop loss must be ${direction==="LONG"?"below":"above"} entry`);
  if(targetPrice&&(direction==="LONG"?targetPrice.lte(entry):targetPrice.gte(entry)))throw new Error(`Take profit must be ${direction==="LONG"?"above":"below"} entry`);
  return {stopPrice:stopPrice?.toString()||null,targetPrice:targetPrice?.toString()||null,stopLossPoints:stopPrice?entry.minus(stopPrice).abs().toString():null,takeProfitPoints:targetPrice?targetPrice.minus(entry).abs().toString():null};
}

export async function register(formData:FormData){
  const data=z.object({name:z.string().min(2).max(80),email:z.string().email(),password:z.string().min(10).max(128)}).parse({name:text(formData,"name"),email:text(formData,"email").toLowerCase(),password:text(formData,"password")});
  const exists=await db.user.findUnique({where:{email:data.email}}); if(exists) redirect("/login?error=exists");
  await db.user.create({data:{name:data.name,email:data.email,passwordHash:await hash(data.password),accounts:{create:{name:"My trading account",currency:"USD",timezone:"UTC",startingBalance:10000}}}});
  await signIn("credentials",{email:data.email,password:data.password,redirectTo:"/app"});
}
export async function login(formData:FormData){ await signIn("credentials",{email:text(formData,"email"),password:text(formData,"password"),redirectTo:"/app"}); }
export async function logout(){ await signOut({redirectTo:"/"}); }

export async function createAccount(formData:FormData){ const uid=await userId(); await db.tradingAccount.create({data:{userId:uid,name:text(formData,"name"),currency:text(formData,"currency")||"USD",timezone:text(formData,"timezone")||"UTC",type:(text(formData,"type")||"DEMO") as "LIVE"|"DEMO"|"PROP",startingBalance:text(formData,"startingBalance")||"0"}}); revalidatePath("/app/settings"); }

export async function createBacktestSession(formData:FormData){
  const uid=await userId(),accountId=text(formData,"accountId");
  if(!await db.tradingAccount.findFirst({where:{id:accountId,userId:uid}}))throw new Error("Account not found");
  const marketStartedAt=new Date(text(formData,"marketStartedAt")),marketEndedValue=text(formData,"marketEndedAt"),marketEndedAt=marketEndedValue?new Date(marketEndedValue):null;
  if(Number.isNaN(+marketStartedAt)||(marketEndedAt&&(Number.isNaN(+marketEndedAt)||marketEndedAt<marketStartedAt)))throw new Error("Invalid session times");
  const session=await db.backtestSession.create({data:{userId:uid,accountId,name:text(formData,"name")||`Backtest ${marketStartedAt.toLocaleDateString()}`,marketStartedAt,marketEndedAt,notes:text(formData,"notes")||null}});
  revalidatePath("/app/backtests");redirect(`/app/backtests/${session.id}`);
}

export async function updateBacktestSession(formData:FormData){
  const uid=await userId(),id=text(formData,"id"),accountId=text(formData,"accountId");
  const session=await db.backtestSession.findFirst({where:{id,userId:uid},include:{_count:{select:{trades:true}}}});
  if(!session)throw new Error("Backtest session not found");
  if(!await db.tradingAccount.findFirst({where:{id:accountId,userId:uid}}))throw new Error("Account not found");
  if(session._count.trades>0&&accountId!==session.accountId)throw new Error("The account cannot be changed after trades have been recorded");
  const marketStartedAt=new Date(text(formData,"marketStartedAt")),marketEndedValue=text(formData,"marketEndedAt"),marketEndedAt=marketEndedValue?new Date(marketEndedValue):null;
  if(Number.isNaN(+marketStartedAt)||(marketEndedAt&&(Number.isNaN(+marketEndedAt)||marketEndedAt<marketStartedAt)))throw new Error("Invalid session times");
  const name=text(formData,"name");if(!name)throw new Error("Session name is required");
  await db.backtestSession.update({where:{id},data:{accountId,name,marketStartedAt,marketEndedAt,notes:text(formData,"notes")||null}});
  revalidatePath("/app/backtests");revalidatePath(`/app/backtests/${id}`);redirect(`/app/backtests/${id}`);
}

export async function deleteBacktestSession(formData:FormData){
  const uid=await userId(),id=text(formData,"id"),deletedAt=new Date();
  const session=await db.backtestSession.findFirst({where:{id,userId:uid},select:{id:true}});if(!session)throw new Error("Backtest session not found");
  await db.$transaction([db.trade.updateMany({where:{backtestSessionId:id},data:{deletedAt}}),db.backtestSession.delete({where:{id}})]);
  revalidatePath("/app");revalidatePath("/app/backtests");redirect("/app/backtests");
}

export async function createTrade(formData:FormData){
  const uid=await userId(); const accountId=text(formData,"accountId");
  const account=await db.tradingAccount.findFirst({where:{id:accountId,userId:uid}}); if(!account) throw new Error("Account not found");
  const source=text(formData,"source")==="BACKTEST"?"BACKTEST" as const:"LIVE" as const,requestedSession=text(formData,"backtestSessionId");
  const backtestSession=source==="BACKTEST"?await db.backtestSession.findFirst({where:{id:requestedSession,userId:uid,accountId}}):null;
  if(source==="BACKTEST"&&!backtestSession)throw new Error("Backtest session not found");
  const openedAt=new Date(text(formData,"openedAt")),closedAt=new Date(text(formData,"closedAt")); if(Number.isNaN(+openedAt)||Number.isNaN(+closedAt)||closedAt<openedAt) throw new Error("Invalid execution times");
  const requestedPlan=text(formData,"planId")||null,planDate=new Date(`${text(formData,"openedAt").slice(0,10)}T00:00:00.000Z`);
  const plan=requestedPlan?await db.tradePlan.findFirst({where:{id:requestedPlan,userId:uid,accountId,planDate}}):null;
  if(requestedPlan&&!plan)throw new Error("The selected daily plan does not match this account and trading day");
  const requestedPlaybook=text(formData,"playbookId")||plan?.playbookId||null;
  const playbookId=requestedPlaybook&&(await db.playbook.findFirst({where:{id:requestedPlaybook,userId:uid}}))?requestedPlaybook:null;
  const requestedTags=formData.getAll("tagIds").map(String);
  const ownedTags=await db.tag.findMany({where:{id:{in:requestedTags},userId:uid},select:{id:true}});
  const symbol=text(formData,"symbol").toUpperCase(); const assetClass=(text(formData,"assetClass")||"STOCK") as "STOCK"|"FUTURE"|"FOREX";
  const pointValue=text(formData,"multiplier")||(symbol==="MNQ"?"2":"1");
  const instrument=await db.instrument.upsert({where:{accountId_symbol:{accountId,symbol}},update:{assetClass,pointValue},create:{accountId,symbol,assetClass,pointValue}});
  const direction=text(formData,"direction") as "LONG"|"SHORT"; const quantity=text(formData,"quantity"), entry=text(formData,"entry"), exit=text(formData,"exit"), fees=text(formData,"fees")||"0";
  const fills=[{side:direction==="LONG"?"BUY" as const:"SELL" as const,quantity,price:entry,executedAt:openedAt},{side:direction==="LONG"?"SELL" as const:"BUY" as const,quantity,price:exit,fees,executedAt:closedAt}],levels=tradeLevels(formData,entry,direction);
  const [calc]=groupExecutions(fills,instrument.pointValue.toString());
  await db.trade.create({data:{...levels,accountId,instrumentId:instrument.id,planId:plan?.id||null,playbookId,source,backtestSessionId:backtestSession?.id||null,direction,status:calc.status,openedAt,closedAt,quantity:calc.quantity.toString(),averageEntry:calc.averageEntry.toString(),averageExit:calc.averageExit?.toString(),grossPnl:calc.grossPnl.toString(),netPnl:calc.netPnl.toString(),fees:calc.fees.toString(),returnPercent:calc.returnPercent?.toString(),initialRisk:optionalNumber(formData,"initialRisk"),plannedEntry:optionalNumber(formData,"plannedEntry"),plannedStop:optionalNumber(formData,"plannedStop"),plannedTarget:optionalNumber(formData,"plannedTarget"),entryConditions:text(formData,"entryConditions")||null,stopPlan:text(formData,"stopPlan")||null,targetPlan:text(formData,"targetPlan")||null,maximumFavorablePrice:optionalNumber(formData,"maximumFavorablePrice"),maximumAdversePrice:optionalNumber(formData,"maximumAdversePrice"),confidence:optionalInteger(formData,"confidence",1,5),setup:text(formData,"setup")||null,qualityGrade:text(formData,"qualityGrade")||null,followedPlan:text(formData,"followedPlan")==="true"?true:text(formData,"followedPlan")==="false"?false:null,emotion:text(formData,"emotion")||null,marketCondition:text(formData,"marketCondition")||null,newsOnDay:plan?plan.newsOnDay:text(formData,"newsOnDay")||null,lesson:text(formData,"lesson")||null,mistakes:formData.getAll("mistakes").map(String),checkedRules:formData.getAll("checkedRules").map(String),notes:text(formData,"notes")||null,tags:{create:ownedTags.map(t=>({tagId:t.id}))},executions:{create:fills.map(f=>({accountId,instrumentId:instrument.id,side:f.side,quantity:f.quantity,price:f.price,fees:"fees" in f?f.fees:"0",executedAt:f.executedAt}))},attachments:{create:attachments(formData).map(a=>({...a,userId:uid}))}}});
  revalidatePath("/app");revalidatePath("/app/backtests");redirect(backtestSession?`/app/backtests/${backtestSession.id}`:"/app/journal");
}

export async function deleteTrade(formData:FormData){ const uid=await userId(); const id=text(formData,"id"); await db.trade.updateMany({where:{id,account:{userId:uid}},data:{deletedAt:new Date()}}); revalidatePath("/app","layout");revalidatePath("/app/backtests","layout"); }
export async function createPlan(formData:FormData){ const uid=await userId(); const accountId=text(formData,"accountId"),requestedPlaybook=text(formData,"playbookId")||null; if(!await db.tradingAccount.findFirst({where:{id:accountId,userId:uid}})) throw new Error("Account not found");const playbookId=requestedPlaybook&&(await db.playbook.findFirst({where:{id:requestedPlaybook,userId:uid}}))?requestedPlaybook:null;const data={playbookId,marketBias:text(formData,"marketBias"),watchlist:text(formData,"watchlist").split(",").map(x=>x.trim()).filter(Boolean),thesis:text(formData,"thesis"),newsOnDay:text(formData,"newsOnDay")||null,entryConditions:text(formData,"entryConditions"),stopPlan:text(formData,"stopPlan"),targetPlan:text(formData,"targetPlan"),plannedEntry:optionalNumber(formData,"plannedEntry"),plannedStop:optionalNumber(formData,"plannedStop"),plannedTarget:optionalNumber(formData,"plannedTarget"),maxTrades:optionalInteger(formData,"maxTrades",1,100),riskBudget:optionalNumber(formData,"riskBudget"),notes:text(formData,"notes")}; const plan=await db.tradePlan.upsert({where:{accountId_planDate:{accountId,planDate:new Date(`${text(formData,"planDate")}T00:00:00.000Z`)}},update:data,create:{userId:uid,accountId,planDate:new Date(`${text(formData,"planDate")}T00:00:00.000Z`),...data}});await db.trade.updateMany({where:{planId:plan.id},data:{newsOnDay:data.newsOnDay}}); revalidatePath("/app/plans");revalidatePath("/app/journal/new");revalidatePath("/app/backtests","layout"); }
export async function createPlaybook(formData:FormData){ const uid=await userId(); await db.playbook.create({data:{userId:uid,name:text(formData,"name"),description:text(formData,"description"),setupCriteria:text(formData,"setupCriteria"),invalidationRules:text(formData,"invalidationRules"),riskRules:text(formData,"riskRules"),entryChecklist:lines(formData,"entryChecklist"),exitChecklist:lines(formData,"exitChecklist"),examples:text(formData,"examples")}}); revalidatePlaybooks(); }
export async function createReview(formData:FormData){
  const uid=await userId(),accountId=text(formData,"accountId")||null;
  if(accountId&&!await db.tradingAccount.findFirst({where:{id:accountId,userId:uid}}))throw new Error("Account not found");
  const startsAt=new Date(`${text(formData,"startsAt")}T00:00:00Z`),endsAt=new Date(`${text(formData,"endsAt")}T23:59:59Z`);
  const trades=await db.trade.findMany({where:{account:{userId:uid},accountId:accountId||undefined,source:"LIVE",deletedAt:null,closedAt:{gte:startsAt,lte:endsAt}},orderBy:{netPnl:"desc"}});
  const summary=calculateMetrics(trades.map(t=>({netPnl:t.netPnl.toString(),grossPnl:t.grossPnl.toString(),fees:t.fees.toString(),closedAt:t.closedAt})));
  const durationOf=(t:typeof trades[number])=>t.closedAt?Math.max(0,t.closedAt.getTime()-t.openedAt.getTime()):0,avg=(values:number[])=>values.length?values.reduce((sum,n)=>sum+n,0)/values.length:0;
  const reviewed=trades.filter(t=>t.followedPlan!==null),mistakeCounts=trades.flatMap(t=>t.mistakes).reduce<Record<string,number>>((all,mistake)=>(all[mistake]=(all[mistake]||0)+1,all),{});
  const metrics={trades:summary.totalTrades,netPnl:summary.netPnl.toString(),winRate:summary.winRate.toString(),profitFactor:summary.profitFactor?.toString()||null,expectancy:summary.expectancy.toString(),averageWin:summary.averageWin.toString(),averageLoss:summary.averageLoss.toString(),maxDrawdown:summary.maxDrawdown.toString(),averageHoldMs:avg(trades.map(durationOf)),winnerHoldMs:avg(trades.filter(t=>Number(t.netPnl)>0).map(durationOf)),loserHoldMs:avg(trades.filter(t=>Number(t.netPnl)<0).map(durationOf)),discipline:reviewed.length?reviewed.filter(t=>t.followedPlan).length/reviewed.length*100:null,bestTradeId:trades[0]?.id||null,worstTradeId:trades.at(-1)?.id||null,topMistake:Object.entries(mistakeCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]||null};
  await db.review.create({data:{userId:uid,accountId,period:text(formData,"period") as "DAILY"|"WEEKLY"|"MONTHLY",startsAt,endsAt,metrics,wins:text(formData,"wins"),mistakes:text(formData,"mistakes"),lessons:text(formData,"lessons"),goals:text(formData,"goals"),rating:Number(text(formData,"rating"))||null,notes:text(formData,"notes")}});
  revalidatePath("/app/reviews");
}

export async function updateProfile(formData:FormData){const uid=await userId();const name=text(formData,"name");if(name.length<2)throw new Error("Name is too short");await db.user.update({where:{id:uid},data:{name}});revalidatePath("/app","layout");revalidatePath("/app/settings")}
export async function updateAccount(formData:FormData){const uid=await userId(),id=text(formData,"id");await db.tradingAccount.updateMany({where:{id,userId:uid},data:{name:text(formData,"name"),type:text(formData,"type") as "LIVE"|"DEMO"|"PROP",currency:text(formData,"currency").toUpperCase(),timezone:text(formData,"timezone"),startingBalance:text(formData,"startingBalance")||"0",weekStartsOn:Number(text(formData,"weekStartsOn")||1)}});revalidatePath("/app/settings");revalidatePath("/app","layout")}
export async function toggleAccountArchive(formData:FormData){const uid=await userId(),id=text(formData,"id"),archived=text(formData,"archived")==="true";await db.tradingAccount.updateMany({where:{id,userId:uid},data:{archivedAt:archived?null:new Date()}});revalidatePath("/app/settings");revalidatePath("/app","layout")}

export async function updateTrade(formData:FormData){
  const uid=await userId(),id=text(formData,"id"),accountId=text(formData,"accountId");
  const owned=await db.trade.findFirst({where:{id,account:{userId:uid}}});if(!owned)throw new Error("Trade not found");
  const account=await db.tradingAccount.findFirst({where:{id:accountId,userId:uid}});if(!account)throw new Error("Account not found");
  const openedAt=new Date(text(formData,"openedAt")),closedAt=new Date(text(formData,"closedAt"));if(Number.isNaN(+openedAt)||Number.isNaN(+closedAt)||closedAt<openedAt)throw new Error("Invalid execution times");
  const hasBehavior=formData.has("behaviorReview"),requestedPlan=text(formData,"planId")||null,planDate=new Date(`${text(formData,"openedAt").slice(0,10)}T00:00:00.000Z`);
  const plan=hasBehavior&&requestedPlan?await db.tradePlan.findFirst({where:{id:requestedPlan,userId:uid,accountId,planDate}}):null;if(hasBehavior&&requestedPlan&&!plan)throw new Error("The selected daily plan does not match this account and trading day");
  const requestedPlaybook=text(formData,"playbookId")||plan?.playbookId||null;
  const playbookId=hasBehavior?(requestedPlaybook&&(await db.playbook.findFirst({where:{id:requestedPlaybook,userId:uid}}))?requestedPlaybook:null):owned.playbookId;
  const requestedTags=formData.getAll("tagIds").map(String),ownedTags=await db.tag.findMany({where:{id:{in:requestedTags},userId:uid},select:{id:true}});
  const symbol=text(formData,"symbol").toUpperCase(),assetClass=text(formData,"assetClass") as "STOCK"|"FUTURE"|"FOREX";
  const instrument=await db.instrument.upsert({where:{accountId_symbol:{accountId,symbol}},update:{assetClass,pointValue:text(formData,"multiplier")||"1"},create:{accountId,symbol,assetClass,pointValue:text(formData,"multiplier")||"1"}});
  const direction=text(formData,"direction") as "LONG"|"SHORT",quantity=text(formData,"quantity"),entry=text(formData,"entry"),exit=text(formData,"exit"),fees=text(formData,"fees")||"0";
  const fills=[{side:direction==="LONG"?"BUY" as const:"SELL" as const,quantity,price:entry,executedAt:openedAt},{side:direction==="LONG"?"SELL" as const:"BUY" as const,quantity,price:exit,fees,executedAt:closedAt}],levels=tradeLevels(formData,entry,direction), [calc]=groupExecutions(fills,instrument.pointValue.toString());
  await db.$transaction(async tx=>{await Promise.all([tx.execution.deleteMany({where:{tradeId:id}}),hasBehavior?tx.tradeTag.deleteMany({where:{tradeId:id}}):Promise.resolve()]);await tx.trade.update({where:{id},data:{...levels,accountId,instrumentId:instrument.id,planId:hasBehavior?plan?.id||null:owned.planId,playbookId,direction,status:calc.status,openedAt,closedAt,quantity:calc.quantity.toString(),averageEntry:calc.averageEntry.toString(),averageExit:calc.averageExit?.toString(),grossPnl:calc.grossPnl.toString(),netPnl:calc.netPnl.toString(),fees:calc.fees.toString(),returnPercent:calc.returnPercent?.toString(),initialRisk:optionalNumber(formData,"initialRisk"),plannedEntry:optionalNumber(formData,"plannedEntry"),plannedStop:optionalNumber(formData,"plannedStop"),plannedTarget:optionalNumber(formData,"plannedTarget"),entryConditions:text(formData,"entryConditions")||null,stopPlan:text(formData,"stopPlan")||null,targetPlan:text(formData,"targetPlan")||null,maximumFavorablePrice:optionalNumber(formData,"maximumFavorablePrice"),maximumAdversePrice:optionalNumber(formData,"maximumAdversePrice"),confidence:hasBehavior?optionalInteger(formData,"confidence",1,5):owned.confidence,setup:text(formData,"setup")||null,qualityGrade:hasBehavior?text(formData,"qualityGrade")||null:owned.qualityGrade,followedPlan:hasBehavior?(text(formData,"followedPlan")==="true"?true:text(formData,"followedPlan")==="false"?false:null):owned.followedPlan,emotion:hasBehavior?text(formData,"emotion")||null:owned.emotion,marketCondition:hasBehavior?text(formData,"marketCondition")||null:owned.marketCondition,newsOnDay:hasBehavior?(plan?plan.newsOnDay:text(formData,"newsOnDay")||null):owned.newsOnDay,lesson:hasBehavior?text(formData,"lesson")||null:owned.lesson,mistakes:hasBehavior?formData.getAll("mistakes").map(String):owned.mistakes,notes:text(formData,"notes")||null,...(hasBehavior?{tags:{create:ownedTags.map(t=>({tagId:t.id}))}}:{}),executions:{create:fills.map(f=>({accountId,instrumentId:instrument.id,side:f.side,quantity:f.quantity,price:f.price,fees:"fees" in f?f.fees:"0",executedAt:f.executedAt}))},attachments:{create:attachments(formData).map(a=>({...a,userId:uid}))}}})});
  revalidatePath("/app","layout");
  if(owned.backtestSessionId){revalidatePath(`/app/backtests/${owned.backtestSessionId}`);redirect(`/app/backtests/${owned.backtestSessionId}`)}
  redirect("/app/journal")
}
export async function restoreTrade(formData:FormData){const uid=await userId();await db.trade.updateMany({where:{id:text(formData,"id"),account:{userId:uid}},data:{deletedAt:null}});revalidatePath("/app","layout");revalidatePath("/app/backtests","layout")}
export async function deleteAttachment(id:string,formData:FormData){void formData;const uid=await userId();const item=await db.attachment.findFirst({where:{id,userId:uid}});if(!item)throw new Error("Attachment not found");cloudinary.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET});if(process.env.CLOUDINARY_API_SECRET)await cloudinary.uploader.destroy(item.objectKey,{resource_type:"image",type:"authenticated",invalidate:true});await db.attachment.delete({where:{id}});revalidatePath(`/app/journal/${item.tradeId}/edit`)}

export async function updatePlan(formData:FormData){const uid=await userId(),id=text(formData,"id"),accountId=text(formData,"accountId"),requestedPlaybook=text(formData,"playbookId")||null;if(!await db.tradePlan.findFirst({where:{id,userId:uid}})||!await db.tradingAccount.findFirst({where:{id:accountId,userId:uid}}))throw new Error("Plan not found");const playbookId=requestedPlaybook&&(await db.playbook.findFirst({where:{id:requestedPlaybook,userId:uid}}))?requestedPlaybook:null,newsOnDay=text(formData,"newsOnDay")||null;await db.$transaction([db.tradePlan.update({where:{id},data:{accountId,playbookId,planDate:new Date(`${text(formData,"planDate")}T00:00:00Z`),marketBias:text(formData,"marketBias"),watchlist:text(formData,"watchlist").split(",").map(x=>x.trim()).filter(Boolean),thesis:text(formData,"thesis"),newsOnDay,entryConditions:text(formData,"entryConditions"),stopPlan:text(formData,"stopPlan"),targetPlan:text(formData,"targetPlan"),plannedEntry:optionalNumber(formData,"plannedEntry"),plannedStop:optionalNumber(formData,"plannedStop"),plannedTarget:optionalNumber(formData,"plannedTarget"),maxTrades:optionalInteger(formData,"maxTrades",1,100),riskBudget:optionalNumber(formData,"riskBudget"),notes:text(formData,"notes")}}),db.trade.updateMany({where:{planId:id},data:{newsOnDay}})]);revalidatePath("/app/plans");revalidatePath("/app/journal/new");revalidatePath("/app/backtests","layout");redirect("/app/plans")}
export async function deletePlan(formData:FormData){const uid=await userId();await db.tradePlan.deleteMany({where:{id:text(formData,"id"),userId:uid}});revalidatePath("/app/plans");revalidateTradeEntry()}
export async function updatePlaybook(formData:FormData){const uid=await userId(),id=text(formData,"id");await db.playbook.updateMany({where:{id,userId:uid},data:{name:text(formData,"name"),description:text(formData,"description"),setupCriteria:text(formData,"setupCriteria"),invalidationRules:text(formData,"invalidationRules"),riskRules:text(formData,"riskRules"),entryChecklist:lines(formData,"entryChecklist"),exitChecklist:lines(formData,"exitChecklist"),examples:text(formData,"examples")}});revalidatePlaybooks();redirect(`/app/playbooks/${id}`)}
export async function togglePlaybook(formData:FormData){const uid=await userId(),id=text(formData,"id"),active=text(formData,"active")==="true";await db.playbook.updateMany({where:{id,userId:uid},data:{isActive:!active}});revalidatePlaybooks()}
export async function deletePlaybook(formData:FormData){const uid=await userId();await db.playbook.deleteMany({where:{id:text(formData,"id"),userId:uid}});revalidatePlaybooks()}
export async function updateReview(formData:FormData){const uid=await userId(),id=text(formData,"id"),accountId=text(formData,"accountId")||null;if(!await db.review.findFirst({where:{id,userId:uid}}))throw new Error("Review not found");await db.review.update({where:{id},data:{accountId,period:text(formData,"period") as "DAILY"|"WEEKLY"|"MONTHLY",startsAt:new Date(`${text(formData,"startsAt")}T00:00:00Z`),endsAt:new Date(`${text(formData,"endsAt")}T23:59:59Z`),wins:text(formData,"wins"),mistakes:text(formData,"mistakes"),lessons:text(formData,"lessons"),goals:text(formData,"goals"),rating:Number(text(formData,"rating"))||null,notes:text(formData,"notes")}});revalidatePath("/app/reviews");redirect("/app/reviews")}
export async function deleteReview(formData:FormData){const uid=await userId();await db.review.deleteMany({where:{id:text(formData,"id"),userId:uid}});revalidatePath("/app/reviews")}
export async function createTag(formData:FormData){const uid=await userId();await db.tag.upsert({where:{userId_name:{userId:uid,name:text(formData,"name")}},update:{color:text(formData,"color")||"#21c989"},create:{userId:uid,name:text(formData,"name"),color:text(formData,"color")||"#21c989"}});revalidatePath("/app/settings");revalidateTradeEntry()}
export async function updateTag(formData:FormData){const uid=await userId();await db.tag.updateMany({where:{id:text(formData,"id"),userId:uid},data:{name:text(formData,"name"),color:text(formData,"color")}});revalidatePath("/app/settings");revalidateTradeEntry()}
export async function deleteTag(formData:FormData){const uid=await userId();await db.tag.deleteMany({where:{id:text(formData,"id"),userId:uid}});revalidatePath("/app/settings");revalidateTradeEntry()}
export async function undoImport(formData:FormData){const uid=await userId(),id=text(formData,"id");const batch=await db.importBatch.findFirst({where:{id,userId:uid,status:"COMMITTED"},include:{executions:true}});if(!batch)throw new Error("Import not found");const tradeIds=[...new Set(batch.executions.map(x=>x.tradeId).filter((x):x is string=>Boolean(x)))];await db.$transaction(async tx=>{await tx.execution.deleteMany({where:{importBatchId:id}});await tx.trade.deleteMany({where:{id:{in:tradeIds},account:{userId:uid}}});await tx.importBatch.update({where:{id},data:{status:"UNDONE",undoneAt:new Date()}})});revalidatePath("/app/import");revalidatePath("/app","layout")}
