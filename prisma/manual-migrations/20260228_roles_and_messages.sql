-- Manual migration for PostgreSQL (run once in production database)
-- Purpose:
-- 1) Move role model to: SUPER_ADMIN > ADMIN > VIEWER > GUEST
-- 2) Preserve existing USER accounts by remapping USER -> VIEWER
-- 3) Add message sender metadata so admins can reply to viewers

BEGIN;

-- Rebuild Role enum safely with remapping
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'VIEWER', 'GUEST');

ALTER TABLE "User" ALTER COLUMN role DROP DEFAULT;
ALTER TABLE "User"
  ALTER COLUMN role TYPE "Role"
  USING (
    CASE
      WHEN role::text = 'USER' THEN 'VIEWER'
      ELSE role::text
    END
  )::"Role";
ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'VIEWER';

DROP TYPE "Role_old";

-- Message metadata for admin replies
ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "senderId" TEXT,
  ADD COLUMN IF NOT EXISTS "senderRole" "Role" NOT NULL DEFAULT 'VIEWER';

COMMIT;
