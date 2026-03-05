ALTER TABLE "Message"
ADD COLUMN "adminId" TEXT,
ADD COLUMN "seen_at" TIMESTAMP(3),
ADD COLUMN "seen_by_role" "Role";

CREATE INDEX "Message_adminId_idx" ON "Message"("adminId");

ALTER TABLE "Message"
ADD CONSTRAINT "Message_adminId_fkey"
FOREIGN KEY ("adminId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

