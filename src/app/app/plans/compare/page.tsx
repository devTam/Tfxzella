import { notFound } from "next/navigation";
import { DayComparison } from "@/components/day-comparison";
import { db } from "@/lib/db";
import { viewer } from "@/lib/data";
import { workflowDate, type WorkflowQuery } from "@/lib/workflow";

export const metadata = { title: "Daily bias vs actual trades" };

export default async function CompareDay({ searchParams }: { searchParams: Promise<WorkflowQuery> }) {
  const user = await viewer(), query = await searchParams;
  if (!query.account || !query.date || workflowDate(query.date) !== query.date) notFound();
  const account = await db.tradingAccount.findFirst({ where: { id: query.account, userId: user.id } });
  if (!account) notFound();
  const plan = await db.tradePlan.findFirst({
    where: { userId: user.id, accountId: account.id, planDate: new Date(`${query.date}T00:00:00Z`) },
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  });
  return DayComparison({ userId: user.id, account, day: query.date, plan });
}
