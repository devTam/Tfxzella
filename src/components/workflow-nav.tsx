import Link from "next/link";
import { workflowHref } from "@/lib/workflow";

export function WorkflowNav({ current, account, date }: { current: "prepare" | "trade" | "review"; account?: string | null; date?: string }) {
  return <nav className="workflow-nav" aria-label="Trading routine">
    <Link href={workflowHref("/app", account, date)}>Session workspace</Link>
    {([['prepare', '1 · Daily bias', '/app/plans'], ['trade', '2 · Trades & lessons', '/app/journal'], ['review', '3 · Review & adjust', '/app/reviews']] as const).map(([step, label, path]) =>
      <Link key={step} aria-current={step === current ? "step" : undefined} href={workflowHref(path, account, date)}>{label}</Link>
    )}
  </nav>;
}
