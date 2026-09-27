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
