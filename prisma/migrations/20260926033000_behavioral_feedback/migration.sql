ALTER TABLE "Trade"
ADD COLUMN "playbookId" TEXT,
ADD COLUMN "qualityGrade" TEXT,
ADD COLUMN "followedPlan" BOOLEAN,
ADD COLUMN "emotion" TEXT,
ADD COLUMN "marketCondition" TEXT,
ADD COLUMN "lesson" TEXT;

CREATE INDEX "Trade_playbookId_idx" ON "Trade"("playbookId");

ALTER TABLE "Trade"
ADD CONSTRAINT "Trade_playbookId_fkey"
FOREIGN KEY ("playbookId") REFERENCES "Playbook"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
