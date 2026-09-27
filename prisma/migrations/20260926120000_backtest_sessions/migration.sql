CREATE TYPE "TradeSource" AS ENUM ('LIVE', 'BACKTEST');

ALTER TABLE "Trade" ADD COLUMN "source" "TradeSource" NOT NULL DEFAULT 'LIVE';
ALTER TABLE "Trade" ADD COLUMN "backtestSessionId" TEXT;

CREATE TABLE "BacktestSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "marketStartedAt" TIMESTAMP(3) NOT NULL,
  "marketEndedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BacktestSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BacktestSession_userId_marketStartedAt_idx" ON "BacktestSession"("userId", "marketStartedAt");
CREATE INDEX "Trade_backtestSessionId_openedAt_idx" ON "Trade"("backtestSessionId", "openedAt");
ALTER TABLE "BacktestSession" ADD CONSTRAINT "BacktestSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BacktestSession" ADD CONSTRAINT "BacktestSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "TradingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_backtestSessionId_fkey" FOREIGN KEY ("backtestSessionId") REFERENCES "BacktestSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
