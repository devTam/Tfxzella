ALTER TABLE "Trade"
ADD COLUMN "maximumFavorablePrice" DECIMAL(20,8),
ADD COLUMN "maximumAdversePrice" DECIMAL(20,8);

ALTER TABLE "TradePlan"
ADD COLUMN "plannedEntry" DECIMAL(20,8),
ADD COLUMN "plannedStop" DECIMAL(20,8),
ADD COLUMN "plannedTarget" DECIMAL(20,8),
ADD COLUMN "maxTrades" INTEGER;
