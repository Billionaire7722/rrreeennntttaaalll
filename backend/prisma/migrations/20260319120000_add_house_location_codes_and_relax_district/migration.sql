ALTER TABLE "House"
ADD COLUMN "city_code" TEXT,
ADD COLUMN "ward_code" TEXT;

ALTER TABLE "House"
ALTER COLUMN "district" DROP NOT NULL;

CREATE INDEX "House_city_code_idx" ON "House"("city_code");
CREATE INDEX "House_ward_code_idx" ON "House"("ward_code");
