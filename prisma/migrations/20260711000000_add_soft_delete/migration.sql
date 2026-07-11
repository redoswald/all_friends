-- AlterTable: Add soft-delete timestamps (non-null = deleted, restorable via undo)
ALTER TABLE "Contact" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Event" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Tag" ADD COLUMN "deletedAt" TIMESTAMP(3);
