ALTER TABLE "Trade"
ADD COLUMN "plannedEntry" DECIMAL(20,8),
ADD COLUMN "plannedStop" DECIMAL(20,8),
ADD COLUMN "plannedTarget" DECIMAL(20,8),
ADD COLUMN "entryConditions" TEXT,
ADD COLUMN "stopPlan" TEXT,
ADD COLUMN "targetPlan" TEXT;

UPDATE "Trade" AS trade
SET
  "plannedEntry" = plan."plannedEntry",
  "plannedStop" = plan."plannedStop",
  "plannedTarget" = plan."plannedTarget",
  "entryConditions" = plan."entryConditions",
  "stopPlan" = plan."stopPlan",
  "targetPlan" = plan."targetPlan"
FROM "TradePlan" AS plan
WHERE trade."planId" = plan."id";
