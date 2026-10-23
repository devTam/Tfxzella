import { newYorkDateKey } from "@/lib/time";

export type WorkflowQuery = { account?: string; date?: string };

export function workflowDate(value?: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value) return value;
  }
  return newYorkDateKey();
}

export function workflowHref(path: string, account?: string | null, date?: string) {
  const query = new URLSearchParams();
  if (account) query.set("account", account);
  if (date) query.set("date", date);
  return `${path}${query.size ? `?${query}` : ""}`;
}

type LearningTrade = { followedPlan: boolean | null; lesson: string | null; mistakes: string[] };
export function learningSummary(trades: LearningTrade[]) {
  const assessed = trades.filter(trade => trade.followedPlan !== null);
  const reflected = trades.filter(trade => trade.followedPlan !== null && Boolean(trade.lesson?.trim()));
  const mistakes = new Map<string, number>();
  for (const trade of trades) for (const mistake of new Set(trade.mistakes)) mistakes.set(mistake, (mistakes.get(mistake) || 0) + 1);
  const topMistake = [...mistakes].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return {
    total: trades.length, assessed: assessed.length, reflected: reflected.length,
    adherence: assessed.length ? Math.round(assessed.filter(trade => trade.followedPlan).length / assessed.length * 100) : null,
    coverage: trades.length ? Math.round(reflected.length / trades.length * 100) : null,
    topMistake: topMistake ? { name: topMistake[0], count: topMistake[1] } : null,
  };
}
