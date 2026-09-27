ALTER TABLE "Trade" ADD COLUMN "stopLossPoints" DECIMAL(20,8);
ALTER TABLE "Trade" ADD COLUMN "takeProfitPoints" DECIMAL(20,8);

UPDATE "Trade"
SET "stopLossPoints" = ABS("averageEntry" - "stopPrice")
WHERE "stopPrice" IS NOT NULL;

UPDATE "Trade"
SET "takeProfitPoints" = ABS("targetPrice" - "averageEntry")
WHERE "targetPrice" IS NOT NULL;

CREATE INDEX "Trade_accountId_source_deletedAt_openedAt_idx" ON "Trade"("accountId", "source", "deletedAt", "openedAt");
CREATE INDEX "Trade_playbookId_deletedAt_openedAt_idx" ON "Trade"("playbookId", "deletedAt", "openedAt");
