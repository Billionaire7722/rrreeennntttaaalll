ALTER TYPE "Role" RENAME VALUE 'VIEWER' TO 'USER';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'ADMIN'
          AND enumtypid = '"Role"'::regtype
    ) THEN
        UPDATE "User"
        SET role = 'USER'
        WHERE role = 'ADMIN';
    END IF;
END $$;

ALTER TABLE "House"
ADD COLUMN IF NOT EXISTS "property_type" TEXT,
ADD COLUMN IF NOT EXISTS "owner_id" TEXT;

UPDATE "House" h
SET "owner_id" = ha."adminId"
FROM "HouseAdmin" ha
WHERE ha."houseId" = h.id
  AND h."owner_id" IS NULL;

ALTER TABLE "House"
ADD CONSTRAINT "House_owner_id_fkey"
FOREIGN KEY ("owner_id") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "House_owner_id_idx" ON "House"("owner_id");
