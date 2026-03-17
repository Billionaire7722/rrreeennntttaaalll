CREATE TABLE "house_room_details" (
    "id" TEXT NOT NULL,
    "house_id" TEXT NOT NULL,
    "electricity_price" INTEGER,
    "water_price" INTEGER,
    "payment_method" TEXT,
    "other_fees" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "house_room_details_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "house_room_details_house_id_key" ON "house_room_details"("house_id");

ALTER TABLE "house_room_details"
ADD CONSTRAINT "house_room_details_house_id_fkey"
FOREIGN KEY ("house_id") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;
