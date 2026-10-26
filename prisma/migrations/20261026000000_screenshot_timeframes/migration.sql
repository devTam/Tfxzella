CREATE TYPE "ScreenshotTimeframe" AS ENUM ('HTF', 'MTF', 'LTF');
ALTER TABLE "Attachment" ADD COLUMN "timeframe" "ScreenshotTimeframe";
