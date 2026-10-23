# TFXZella

A free, multi-user trading journal built with Next.js, PostgreSQL, Prisma, and Auth.js.

## Local setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and `AUTH_SECRET`. PostgreSQL must be running and reachable at this URL.
2. Run `npm install`.
3. Run `npm run db:migrate` to apply committed migrations. The underlying command is `prisma migrate deploy`, not `prisma deploy`.
4. Optionally run `npm run db:seed` (demo login: `demo@tfxzella.local` / `DemoTrader123!`).
5. Run `npm run dev`.

## Railway

Create a Railway project with PostgreSQL, deploy this repository using its Dockerfile, and configure the variables shown in `.env.example`. Set `NEXTAUTH_URL` to the public Railway domain. The container applies committed Prisma migrations before starting, and Railway checks `/api/health`.

For screenshots, configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Upload signatures are issued only to authenticated users; images use Cloudinary's `authenticated` delivery type and user-scoped folders. The API secret never leaves the server. Resend is optional until verification/reset email screens are enabled.

## CSV format

Imports accept up to 5,000 rows / 5MB. Required headers: `symbol,direction,quantity,entry,exit,openedAt,closedAt`. Optional headers: `assetClass,multiplier,fees,setup,newsOnDay,notes`.

## Trader workflow

The sidebar follows the daily routine: **Today & overview → Daily bias & plans → Trade journal → Reviews**. Reports, calendar, strategies, and backtesting live under **Study & improve**; imports and settings remain under **Manage**. Mobile navigation shows four daily destinations and a More menu for every other tool.

- The session workspace selects an account and New York trading date, carries forward the most recent prior review goal, and links directly to preparation, trade entry, unfinished reflection, and the daily review.
- Daily bias supports expectation chart uploads and a comparison with actual trades. Reviews show matching original plans and charts before hindsight and reflection.
- The journal filters by account, date, opened/closed date, and open or incomplete trades. Pagination preserves filters. A trade needs reflection when it is closed and lacks plan adherence or a lesson.
- The latest 20 closed trades are compared with the preceding 20 for recorded plan adherence and reflection coverage. Sample sizes and missing data are shown explicitly; these are behavior measures, not a prediction of trading performance.
- Calendar days open the corresponding session workspace. Existing reports, strategy tools, backtests, screenshots, hindsight reviews, imports, exports, and settings remain available.

Bias comparison groups trades by **opening day**; review snapshots and the reflection queue use **closing day**. This distinction is displayed for overnight positions. Financial overview metrics use the selected account to avoid combining balances in different currencies.
