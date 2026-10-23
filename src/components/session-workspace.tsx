import Link from "next/link";
import { db } from "@/lib/db";
import { dateOnlyValue, newYorkDayStart, newYorkDayEnd } from "@/lib/time";
import { learningSummary, workflowHref } from "@/lib/workflow";

type Account = { id: string; name: string };
export async function SessionWorkspace({ userId, accounts, accountId, date }: { userId: string; accounts: Account[]; accountId?: string; date: string }) {
  if (!accountId) return <section className="card routine-panel"><h2>Start with a trading account</h2><p>Add an account, define a strategy, then prepare your first daily bias.</p><Link className="btn" href="/app/settings">Set up account</Link><Link className="btn secondary" href="/app/playbooks">Build a strategy</Link></section>;
  const startsAt = newYorkDayStart(date), endsAt = newYorkDayEnd(date);
  const [plan, dayTrades, reviews, lastGoal, recentTrades] = await Promise.all([
    db.tradePlan.findFirst({ where: { userId, accountId, planDate: new Date(`${date}T00:00:00Z`) }, include: { _count: { select: { attachments: true } } } }),
    db.trade.findMany({ where: { accountId, account: { userId }, source: "LIVE", deletedAt: null, OR: [{ openedAt: { gte: startsAt, lte: endsAt } }, { closedAt: { gte: startsAt, lte: endsAt } }] }, include: { instrument: true }, orderBy: { openedAt: "asc" } }),
    db.review.findMany({ where: { userId, period: "DAILY", OR: [{ accountId }, { accountId: null }], startsAt, endsAt }, orderBy: { createdAt: "desc" } }),
    db.review.findFirst({ where: { userId, OR: [{ accountId }, { accountId: null }], endsAt: { lt: startsAt }, goals: { not: "" } }, orderBy: { endsAt: "desc" } }),
    db.trade.findMany({ where: { accountId, account: { userId }, source: "LIVE", deletedAt: null, closedAt: { lte: endsAt } }, select: { followedPlan: true, lesson: true, mistakes: true }, orderBy: [{ closedAt: "desc" }, { id: "desc" }], take: 40 }),
  ]);
  const closed = dayTrades.filter(trade => trade.closedAt && trade.closedAt >= startsAt && trade.closedAt <= endsAt);
  const pending = closed.filter(trade => trade.followedPlan === null || !trade.lesson?.trim());
  const opened = dayTrades.filter(trade => trade.openedAt >= startsAt && trade.openedAt <= endsAt);
  const recent = learningSummary(recentTrades.slice(0, 20)), previous = learningSummary(recentTrades.slice(20, 40));
  const review = reviews[0];
  const href = (path: string) => workflowHref(path, accountId, date);
  return <section className="routine-panel" aria-labelledby="routine-title">
    <div className="routine-heading"><div><span className="eyebrow">One session at a time</span><h2 id="routine-title">Your trading routine</h2><p>Prepare your expectation, capture decisions, then choose one adjustment.</p></div>
      <form className="session-filter" action="/app"><label>Account<select name="account" defaultValue={accountId}>{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label>Trading day · New York<input type="date" name="date" defaultValue={date} required/></label><button className="btn secondary">View session</button></form>
    </div>
    {lastGoal?.goals ? <aside className="practice-focus"><div><span className="stat-label">Carry into this session</span><p>{lastGoal.goals}</p><small>From your {lastGoal.period.toLowerCase()} review{lastGoal.accountId ? "" : " across all accounts"}.</small></div><Link href={`/app/reviews/${lastGoal.id}`} className="btn secondary">Revisit lesson</Link></aside> : <aside className="practice-focus"><p>Your latest review’s next adjustment will appear here before you trade.</p><Link href={href("/app/reviews")} className="btn secondary">Choose a focus</Link></aside>}
    <div className="routine-steps">
      <article className="card"><span className="eyebrow">01 · Prepare</span><h3>Daily bias & chart</h3><p>{plan ? `${plan.marketBias || "Neutral"} · ${plan._count.attachments} expectation chart${plan._count.attachments === 1 ? "" : "s"}` : "Write the thesis and risk limits you want to follow before the session."}</p>{plan?.thesis ? <p className="routine-thesis">{plan.thesis}</p> : null}{plan?.drawOnLiquidity ? <p><b>DOL:</b> {plan.drawOnLiquidity}</p> : null}<Link className="btn secondary" href={plan ? `/app/plans/${plan.id}/edit` : href("/app/plans")}>{plan ? "Revisit daily bias" : "Prepare daily bias"}</Link></article>
      <article className="card"><span className="eyebrow">02 · Execute & record</span><h3>Trades & decisions</h3><p>{opened.length} opened · {closed.length} closed during this day. {pending.length ? `${pending.length} closed trade${pending.length === 1 ? " needs" : "s need"} plan adherence and a lesson.` : closed.length ? "Every closed trade has plan adherence and a lesson recorded." : "Log what happened, including a decision to stay out in your daily review."}</p><div className="actions"><Link className="btn secondary" href={href("/app/journal/new")}>Log trade</Link><Link href={`${href("/app/journal")}&status=needs-review&basis=closed`} className="btn secondary">Review queue{pending.length ? ` (${pending.length})` : ""}</Link></div></article>
      <article className="card"><span className="eyebrow">03 · Reflect & adjust</span><h3>Close the feedback loop</h3><p>{review ? "Daily review saved. Revisit the evidence and carry one change into the next session." : "Compare the expected chart with actual trades, then record what to repeat or change."}</p><div className="actions">{plan ? <Link className="btn secondary" href={`/app/plans/${plan.id}`}>Compare charts</Link> : null}<Link className="btn" href={review ? `/app/reviews/${review.id}` : href("/app/reviews")}>{review ? "Open daily review" : "Write daily review"}</Link></div></article>
    </div>
    <div className="card learning-progress"><div><span className="eyebrow">Practice over time</span><h3>Is your execution becoming more consistent?</h3><p className="help">Latest {recent.total} closed trades through {dateOnlyValue(new Date(`${date}T00:00:00Z`))} on this account. These measure recorded behavior, not profitability.</p></div>
      <div className="learning-metrics"><div><span>Plan adherence</span><strong>{recent.adherence === null ? "—" : `${recent.adherence}%`}</strong><small>{recent.assessed} of {recent.total} assessed{previous.assessed ? ` · previous ${previous.assessed} assessed: ${previous.adherence}%` : ""}</small></div><div><span>Reflection coverage</span><strong>{recent.coverage === null ? "—" : `${recent.coverage}%`}</strong><small>{recent.reflected}/{recent.total} with adherence + lesson{previous.total ? ` · previous ${previous.total}: ${previous.coverage}%` : ""}</small></div><div><span>Most recorded mistake</span><strong className="mistake-name">{recent.topMistake?.name || "None recorded"}</strong><small>{recent.topMistake ? `${recent.topMistake.count} of ${recent.total} trades` : "Missing records do not mean mistake-free trading."}</small></div></div>
      <div className="actions"><Link href={href("/app/journal")} className="btn secondary">Inspect trades</Link><Link href={`${workflowHref("/app/analytics",accountId)}&report=behavior`} className="btn secondary">Explore behavior reports</Link><Link href="/app/playbooks" className="btn secondary">Refine strategy rules</Link></div>
    </div>
  </section>;
}
