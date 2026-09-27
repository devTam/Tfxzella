import { QuickTradeForm } from "@/components/quick-trade-form";
import { db } from "@/lib/db";
import { accounts,viewer } from "@/lib/data";

export const metadata={title:"Log trade"};

export default async function NewTrade(){
  const user=await viewer();
  const [list,playbooks,plans,tags]=await Promise.all([accounts(),db.playbook.findMany({where:{userId:user.id},select:{id:true,name:true,entryChecklist:true,isActive:true},orderBy:[{isActive:"desc"},{name:"asc"}]}),db.tradePlan.findMany({where:{userId:user.id},select:{id:true,accountId:true,planDate:true,playbookId:true,marketBias:true,thesis:true,plannedEntry:true,plannedStop:true,plannedTarget:true,riskBudget:true,maxTrades:true},orderBy:{planDate:"desc"}}),db.tag.findMany({where:{userId:user.id},select:{id:true,name:true,color:true},orderBy:{name:"asc"}})]);
  const now=new Date();
  const later=new Date(now.getTime()+5*60_000);
  const date=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
  const time=(value:Date)=>value.toTimeString().slice(0,5);
  return <div className="content"><div className="page-head"><div><span className="eyebrow">Fast entry</span><h1>Log a trade</h1><p>Capture the mechanics quickly, then record the decisions that improve performance.</p></div></div><QuickTradeForm accounts={list.map(a=>({id:a.id,name:a.name,currency:a.currency}))} playbooks={playbooks} plans={plans.map(plan=>({...plan,planDate:plan.planDate.toISOString().slice(0,10),plannedEntry:plan.plannedEntry?.toString()||null,plannedStop:plan.plannedStop?.toString()||null,plannedTarget:plan.plannedTarget?.toString()||null,riskBudget:plan.riskBudget?.toString()||null}))} tags={tags} initialDate={date} initialEntryTime={time(now)} initialExitTime={time(later)}/></div>;
}
