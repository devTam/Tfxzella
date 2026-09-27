import { accounts } from "@/lib/data";import { ImportForm } from "@/components/import-form";
export const metadata={title:"Import trades"};
export default async function ImportPage(){const list=await accounts();return <div className="content"><div className="page-head"><div><span className="eyebrow">TradingView + CSV</span><h1>Import trades</h1><p>Import TradingView Paper Trading Trade History or Order History exports.</p></div></div><ImportForm accounts={list.map(a=>({id:a.id,name:a.name}))}/></div>}
