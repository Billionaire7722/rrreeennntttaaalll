-- Fix User table columns: rename avatarUrl -> avatar_url, add missing columns

-- Step 1: Rename avatarUrl column to avatar_url (Prisma @map convention)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'User' AND column_name = 'avatarUrl'
    ) THEN
        ALTER TABLE "User" RENAME COLUMN "avatarUrl" TO "avatar_url";
    END IF;
END $$;

-- Step 2: Add avatar_url if it doesn't exist at all (fresh install case)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;

-- Step 3: Add cover_url column if missing
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cover_url" TEXT;

-- Step 4: Add bio column if missing
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;

-- Step 5: Add name_updated_at column if missing
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name_updated_at" TIMESTAMP(3);
