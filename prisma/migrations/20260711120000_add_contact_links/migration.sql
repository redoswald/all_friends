-- CreateTable: external address-book links (Apple/Google), pull-only
CREATE TABLE "ContactLink" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "fingerprint" TEXT,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContactLink_contactId_source_key" ON "ContactLink"("contactId", "source");
CREATE INDEX "ContactLink_contactId_idx" ON "ContactLink"("contactId");

ALTER TABLE "ContactLink" ADD CONSTRAINT "ContactLink_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
