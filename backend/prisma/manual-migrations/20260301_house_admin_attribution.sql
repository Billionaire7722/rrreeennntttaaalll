-- Manual migration for PostgreSQL (run once in production database)
-- Purpose:
-- 1) Track which admins posted/updated each house
-- 2) Allow multiple admins to be attributed to one house listing

BEGIN;

CREATE TABLE IF NOT EXISTS "HouseAdmin" (
  "id" TEXT NOT NULL,
  "houseId" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HouseAdmin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "HouseAdmin_houseId_adminId_key"
  ON "HouseAdmin" ("houseId", "adminId");

CREATE INDEX IF NOT EXISTS "HouseAdmin_adminId_idx"
  ON "HouseAdmin" ("adminId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'HouseAdmin_houseId_fkey'
      AND table_name = 'HouseAdmin'
  ) THEN
    ALTER TABLE "HouseAdmin"
      ADD CONSTRAINT "HouseAdmin_houseId_fkey"
      FOREIGN KEY ("houseId") REFERENCES "House"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'HouseAdmin_adminId_fkey'
      AND table_name = 'HouseAdmin'
  ) THEN
    ALTER TABLE "HouseAdmin"
      ADD CONSTRAINT "HouseAdmin_adminId_fkey"
      FOREIGN KEY ("adminId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;
