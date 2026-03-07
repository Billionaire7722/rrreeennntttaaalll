CREATE TYPE "user_role" AS ENUM (
  'SUPER_ADMIN',
  'USER'
);

CREATE TYPE "user_status" AS ENUM (
  'ACTIVE',
  'BANNED',
  'LOCKED'
);

CREATE TYPE "house_status" AS ENUM (
  'PENDING',
  'ACTIVE',
  'HIDDEN',
  'DELETED'
);

CREATE TYPE "report_status" AS ENUM (
  'OPEN',
  'REVIEWING',
  'RESOLVED',
  'REJECTED'
);

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  "name" "VARCHAR(100)",
  "username" "VARCHAR(50)" UNIQUE,
  "email" "VARCHAR(255)" UNIQUE NOT NULL,
  "phone" "VARCHAR(15)" CHECK (phone ~ '^\+?[0-9]{9,15}$'),
  "password_hash" TEXT NOT NULL,
  "avatar_url" TEXT,
  "role" user_role DEFAULT 'USER',
  "status" user_status DEFAULT 'ACTIVE',
  "locked_until" "TIMESTAMPTZ",
  "created_at" "TIMESTAMPTZ" DEFAULT (now()),
  "updated_at" "TIMESTAMPTZ" DEFAULT (now()),
  "deleted_at" "TIMESTAMPTZ"
);

CREATE TABLE "cities" (
  "id" SERIAL PRIMARY KEY,
  "name" "VARCHAR(100)" UNIQUE NOT NULL
);

CREATE TABLE "districts" (
  "id" SERIAL PRIMARY KEY,
  "city_id" INTEGER NOT NULL,
  "name" "VARCHAR(100)"
);

CREATE TABLE "houses" (
  "id" UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  "owner_id" UUID NOT NULL,
  "title" "VARCHAR(255)",
  "description" TEXT,
  "property_type" "VARCHAR(50)",
  "city_id" INTEGER,
  "district_id" INTEGER,
  "address" TEXT,
  "latitude" "DOUBLEPRECISION",
  "longitude" "DOUBLEPRECISION",
  "price" "NUMERIC(12,2)",
  "bedrooms" SMALLINT,
  "bathrooms" SMALLINT,
  "area" "NUMERIC(8,2)",
  "contact_phone" "VARCHAR(15)" CHECK (contact_phone ~ '^\+?[0-9]{9,15}$'),
  "status" house_status DEFAULT 'PENDING',
  "created_at" "TIMESTAMPTZ" DEFAULT (now()),
  "updated_at" "TIMESTAMPTZ" DEFAULT (now()),
  "deleted_at" "TIMESTAMPTPTZ"
);

CREATE TABLE "house_images" (
  "id" UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  "house_id" UUID NOT NULL,
  "image_url" TEXT NOT NULL,
  "sort_order" INTEGER DEFAULT 0,
  "created_at" "TIMESTAMPTZ" DEFAULT (now())
);

CREATE TABLE "house_videos" (
  "id" UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  "house_id" UUID NOT NULL,
  "video_url" TEXT,
  "created_at" "TIMESTAMPTZ" DEFAULT (now())
);

CREATE TABLE "amenities" (
  "id" SERIAL PRIMARY KEY,
  "name" "VARCHAR(100)" UNIQUE
);

CREATE TABLE "house_amenities" (
  "house_id" UUID,
  "amenity_id" INTEGER,
  PRIMARY KEY ("house_id", "amenity_id")
);

CREATE TABLE "favorites" (
  "user_id" UUID,
  "house_id" UUID,
  "created_at" "TIMESTAMPTZ" DEFAULT (now()),
  PRIMARY KEY ("user_id", "house_id")
);

CREATE TABLE "conversations" (
  "id" UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  "created_at" "TIMESTAMPTZ" DEFAULT (now())
);

CREATE TABLE "conversation_participants" (
  "conversation_id" UUID,
  "user_id" UUID,
  PRIMARY KEY ("conversation_id", "user_id")
);

CREATE TABLE "messages" (
  "id" UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  "conversation_id" UUID,
  "sender_id" UUID,
  "content" TEXT,
  "created_at" "TIMESTAMPTZ" DEFAULT (now()),
  "seen_at" "TIMESTAMPTZ"
);

CREATE TABLE "reviews" (
  "id" UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  "house_id" UUID,
  "user_id" UUID,
  "rating" SMALLINT CHECK (rating BETWEEN 1 AND 5),
  "comment" TEXT,
  "created_at" "TIMESTAMPTZ" DEFAULT (now())
);

CREATE TABLE "reports" (
  "id" UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  "reporter_id" UUID,
  "house_id" UUID,
  "reason" TEXT,
  "status" report_status DEFAULT 'OPEN',
  "created_at" "TIMESTAMPTZ" DEFAULT (now())
);

CREATE TABLE "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  "actor_id" UUID,
  "actor_role" user_role,
  "action_type" TEXT,
  "entity_type" TEXT,
  "entity_id" TEXT,
  "before_data" JSONB,
  "after_data" JSONB,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" "TIMESTAMPTZ" DEFAULT (now())
);

CREATE TABLE "login_logs" (
  "id" UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id" UUID,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "success" BOOLEAN,
  "created_at" "TIMESTAMPTZ" DEFAULT (now())
);

ALTER TABLE "districts" ADD FOREIGN KEY ("city_id") REFERENCES "cities" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "houses" ADD FOREIGN KEY ("owner_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "houses" ADD FOREIGN KEY ("city_id") REFERENCES "cities" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "houses" ADD FOREIGN KEY ("district_id") REFERENCES "districts" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "house_images" ADD FOREIGN KEY ("house_id") REFERENCES "houses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "house_videos" ADD FOREIGN KEY ("house_id") REFERENCES "houses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "house_amenities" ADD FOREIGN KEY ("house_id") REFERENCES "houses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "house_amenities" ADD FOREIGN KEY ("amenity_id") REFERENCES "amenities" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "favorites" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "favorites" ADD FOREIGN KEY ("house_id") REFERENCES "houses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "conversation_participants" ADD FOREIGN KEY ("conversation_id") REFERENCES "conversations" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "conversation_participants" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "messages" ADD FOREIGN KEY ("conversation_id") REFERENCES "conversations" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "messages" ADD FOREIGN KEY ("sender_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reviews" ADD FOREIGN KEY ("house_id") REFERENCES "houses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reviews" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reports" ADD FOREIGN KEY ("reporter_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reports" ADD FOREIGN KEY ("house_id") REFERENCES "houses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "login_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;
