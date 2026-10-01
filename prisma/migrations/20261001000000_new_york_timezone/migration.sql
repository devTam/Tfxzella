ALTER TABLE "TradingAccount" ALTER COLUMN "timezone" SET DEFAULT 'America/New_York';
UPDATE "TradingAccount" SET "timezone" = 'America/New_York';
