import { notFound } from "next/navigation";
import { DayComparison } from "@/components/day-comparison";
import { db } from "@/lib/db";
import { viewer } from "@/lib/data";
import { dateOnlyValue } from "@/lib/time";

export const metadata = { title: "Daily bias vs actual trades" };

export default async function PlanComparison({ params }: { params: Promise<{ id: string }> }) {
  const user = await viewer();
  const { id } = await params;
  const plan = await db.tradePlan.findFirst({
    where: { id, userId: user.id },
    include: { account: true, attachments: { orderBy: { createdAt: "asc" } } },
  });
  if (!plan) notFound();
  return DayComparison({ userId: user.id, account: plan.account, day: dateOnlyValue(plan.planDate), plan });
}
