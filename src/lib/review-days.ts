import { workflowHref } from "./workflow";

export type ReviewDay = {
  id: string; accountId: string; accountName: string; day: string;
  bias: string | null; drawOnLiquidity: string | null; thesis: string | null;
  images: { id: string; url: string }[];
  comparisonHref: string;
  hasBias: boolean;
};
type PlanDay = Omit<ReviewDay, "comparisonHref" | "hasBias">;
type ChartDay = Pick<ReviewDay, "accountId" | "accountName" | "day" | "images">;

/** Include recorded sessions even when preparation was skipped. */
export function reviewDays(plans: PlanDay[], chartDays: ChartDay[]): ReviewDay[] {
  const key = (day: ChartDay) => `${day.accountId}:${day.day}`;
  const days = new Map(plans.map(plan => [key(plan), { ...plan, hasBias: true, comparisonHref: `/app/plans/${plan.id}` }]));
  for (const day of chartDays) {
    const existing = days.get(key(day));
    if (existing?.hasBias) continue;
    if (existing) {
      const urls = new Set(existing.images.map(image => image.url));
      existing.images.push(...day.images.filter(image => !urls.has(image.url)));
    } else {
      days.set(key(day), {
        ...day, images: [...day.images], id: key(day), hasBias: false,
        bias: null, drawOnLiquidity: null, thesis: null,
        comparisonHref: workflowHref("/app/plans/compare", day.accountId, day.day),
      });
    }
  }
  return [...days.values()].sort((a, b) => b.day.localeCompare(a.day) || a.accountName.localeCompare(b.accountName));
}
