import { WorkflowNav } from "@/components/workflow-nav";
import { workflowDate, type WorkflowQuery } from "@/lib/workflow";
import { QuickTradeForm } from "@/components/quick-trade-form";
import { db } from "@/lib/db";
import { accounts,viewer } from "@/lib/data";
import { dateOnlyValue, newYorkTimeValue } from "@/lib/time";

export const metadata={title:"Log trade"};

export default async function NewTrade({searchParams}:{searchParams:Promise<WorkflowQuery>}){
  const user=await viewer(),query=await searchParams;
  const [list,playbooks,plans,tags]=await Promise.all([accounts(),db.playbook.findMany({where:{userId:user.id},select:{id:true,name:true,entryChecklist:true,isActive:true},orderBy:[{isActive:"desc"},{name:"asc"}]}),db.tradePlan.findMany({where:{userId:user.id},select:{id:true,accountId:true,planDate:true,playbookId:true,marketBias:true,drawOnLiquidity:true,thesis:true,riskBudget:true,maxTrades:true,newsOnDay:true},orderBy:{planDate:"desc"}}),db.tag.findMany({where:{userId:user.id},select:{id:true,name:true,color:true},orderBy:{name:"asc"}})]);
  const now=new Date();
  const later=new Date(now.getTime()+5*60_000);
  const date=workflowDate(query.date),account=list.find(a=>a.id===query.account)?.id||list[0]?.id;
  const time=(value:Date)=>newYorkTimeValue(value);
  return <div className="content"><WorkflowNav current="trade" account={account} date={date}/><div className="page-head"><div><span className="eyebrow">Fast entry</span><h1>Log a trade</h1><p>Capture the mechanics quickly, then record the decisions that improve performance.</p></div></div><QuickTradeForm key={`${account}-${date}`} initialAccount={account} accounts={list.map(a=>({id:a.id,name:a.name,currency:a.currency}))} playbooks={playbooks} plans={plans.map(plan=>({...plan,planDate:dateOnlyValue(plan.planDate),riskBudget:plan.riskBudget?.toString()||null}))} tags={tags} initialDate={date} initialEntryTime={time(now)} initialExitTime={time(later)}/></div>;
}
