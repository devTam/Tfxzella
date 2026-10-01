export type DatedAccountPlan = {
  accountId: string;
  planDate: string;
};

export function planForTradingDay<T extends DatedAccountPlan>(plans: T[], accountId: string, date: string): T | undefined {
  return plans.find((plan) => plan.accountId === accountId && plan.planDate === date);
}
