import { notFound } from "next/navigation";
import { QuickTradeForm } from "@/components/quick-trade-form";
import { db } from "@/lib/db";
import { viewer } from "@/lib/data";

export const metadata={title:"Record backtest trade"};
export default async function NewBacktestTrade({params}:{params:Promise<{id:string}>}){
  const user=await viewer(),{id}=await params;
  const [session,playbooks,plans,tags]=await Promise.all([db.backtestSession.findFirst({where:{id,userId:user.id},include:{account:true}}),db.playbook.findMany({where:{userId:user.id},select:{id:true,name:true,entryChecklist:true,isActive:true},orderBy:[{isActive:"desc"},{name:"asc"}]}),db.tradePlan.findMany({where:{userId:user.id},select:{id:true,accountId:true,planDate:true,playbookId:true,marketBias:true,thesis:true,riskBudget:true,maxTrades:true,newsOnDay:true},orderBy:{planDate:"desc"}}),db.tag.findMany({where:{userId:user.id},select:{id:true,name:true,color:true},orderBy:{name:"asc"}})]);if(!session)notFound();
  const start=session.marketStartedAt,later=new Date(start.getTime()+5*60_000),date=start.toISOString().slice(0,10),time=(value:Date)=>value.toISOString().slice(11,16);
  return <div className="content"><div className="page-head"><div><span className="eyebrow">{session.name}</span><h1>Record a replay trade</h1><p>Use the historical chart’s date and execution times. The app records the submission time separately.</p></div></div><QuickTradeForm accounts={[{id:session.account.id,name:session.account.name,currency:session.account.currency}]} playbooks={playbooks} plans={plans.map(plan=>({...plan,planDate:plan.planDate.toISOString().slice(0,10),riskBudget:plan.riskBudget?.toString()||null}))} tags={tags} initialDate={date} initialEntryTime={time(start)} initialExitTime={time(later)} source="BACKTEST" backtestSessionId={session.id}/></div>;
}
