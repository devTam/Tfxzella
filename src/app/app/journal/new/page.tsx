import { QuickTradeForm } from "@/components/quick-trade-form";
import { db } from "@/lib/db";
import { accounts,viewer } from "@/lib/data";
import { newYorkDateKey, newYorkTimeValue } from "@/lib/time";

export const metadata={title:"Log trade"};

export default async function NewTrade(){
  const user=await viewer();
  const [list,playbooks,plans,tags]=await Promise.all([accounts(),db.playbook.findMany({where:{userId:user.id},select:{id:true,name:true,entryChecklist:true,isActive:true},orderBy:[{isActive:"desc"},{name:"asc"}]}),db.tradePlan.findMany({where:{userId:user.id},select:{id:true,accountId:true,planDate:true,playbookId:true,marketBias:true,thesis:true,riskBudget:true,maxTrades:true,newsOnDay:true},orderBy:{planDate:"desc"}}),db.tag.findMany({where:{userId:user.id},select:{id:true,name:true,color:true},orderBy:{name:"asc"}})]);
  const now=new Date();
  const later=new Date(now.getTime()+5*60_000);
  const date=newYorkDateKey(now);
  const time=(value:Date)=>newYorkTimeValue(value);
  return <div className="content"><div className="page-head"><div><span className="eyebrow">Fast entry</span><h1>Log a trade</h1><p>Capture the mechanics quickly, then record the decisions that improve performance.</p></div></div><QuickTradeForm accounts={list.map(a=>({id:a.id,name:a.name,currency:a.currency}))} playbooks={playbooks} plans={plans.map(plan=>({...plan,planDate:plan.planDate.toISOString().slice(0,10),riskBudget:plan.riskBudget?.toString()||null}))} tags={tags} initialDate={date} initialEntryTime={time(now)} initialExitTime={time(later)}/></div>;
}
