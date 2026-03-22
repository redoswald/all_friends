-- AlterTable: Remove snooze fields from Contact
ALTER TABLE "Contact" DROP COLUMN IF EXISTS "snoozedUntil";
ALTER TABLE "Contact" DROP COLUMN IF EXISTS "awayUntil";

-- AlterTable: Add location and self-contact fields to Contact
ALTER TABLE "Contact" ADD COLUMN "location" TEXT;
ALTER TABLE "Contact" ADD COLUMN "metroArea" TEXT;
ALTER TABLE "Contact" ADD COLUMN "isSelf" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add destination fields to ContactOOOPeriod
ALTER TABLE "ContactOOOPeriod" ADD COLUMN "destination" TEXT;
ALTER TABLE "ContactOOOPeriod" ADD COLUMN "destinationMetro" TEXT;

-- CreateIndex: Ensure only one self-contact per user
CREATE UNIQUE INDEX "Contact_userId_isSelf_key" ON "Contact" ("userId") WHERE "isSelf" = true;
