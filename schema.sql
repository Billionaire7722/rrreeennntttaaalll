-- =============================================================================
-- Rental Platform — PostgreSQL Database Schema
-- Generated: 2026-03-07
-- Compatible with dbdiagram.io SQL import
-- =============================================================================

-- -----------------------------------------------------------------------------
-- EXTENSIONS
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- -----------------------------------------------------------------------------
-- TYPES / ENUMS
-- -----------------------------------------------------------------------------

-- User role: SUPER_ADMIN has full access; USER is a regular registered member
CREATE TYPE role AS ENUM ('SUPER_ADMIN', 'USER');

-- -----------------------------------------------------------------------------
-- TABLE: users
-- Stores all registered users (both regular users and super-admins)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT        NOT NULL,
    username        TEXT        NOT NULL UNIQUE,
    email           TEXT        NOT NULL UNIQUE,
    phone           TEXT,
    password        TEXT        NOT NULL,   -- bcrypt hashed
    avatar_url      TEXT,
    cover_url       TEXT,
    role            role        NOT NULL DEFAULT 'USER',
    status          TEXT        NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | BANNED
    locked_until    TIMESTAMPTZ,            -- temporary lock timestamp
    name_updated_at TIMESTAMPTZ,            -- timestamp of last name change
    bio             TEXT,                   -- user bio
    deleted_at      TIMESTAMPTZ,            -- soft delete
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  users                IS 'All registered platform users';
COMMENT ON COLUMN users.role           IS 'SUPER_ADMIN or USER';
COMMENT ON COLUMN users.status         IS 'ACTIVE or BANNED';
COMMENT ON COLUMN users.locked_until   IS 'Non-null means the account is temporarily locked until this timestamp';
COMMENT ON COLUMN users.name_updated_at IS 'Timestamp of the last time the user changed their name';
COMMENT ON COLUMN users.bio            IS 'Short biography of the user';
COMMENT ON COLUMN users.deleted_at     IS 'Soft-delete timestamp; NULL means the record is active';

CREATE INDEX idx_users_email    ON users (email);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_role     ON users (role);

-- -----------------------------------------------------------------------------
-- TABLE: houses
-- Property listings uploaded by users or pre-seeded by admins
-- -----------------------------------------------------------------------------
CREATE TABLE houses (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_id         TEXT        NOT NULL UNIQUE,  -- stable external/seed ID
    name                TEXT        NOT NULL,
    property_type       TEXT,       -- house | apartment | condominium | commercial space | hotel | room/mini apartment
    building_name       TEXT,
    address             TEXT        NOT NULL,
    district            TEXT        NOT NULL,
    city                TEXT        NOT NULL,
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
    price               INTEGER,    -- VND per month
    payment_method      TEXT,
    bedrooms            INTEGER,
    frontage            DOUBLE PRECISION,  -- frontage in m²
    square              DOUBLE PRECISION,  -- area in m²
    -- Up to 7 Cloudinary image URLs
    image_url_1         TEXT,
    image_url_2         TEXT,
    image_url_3         TEXT,
    image_url_4         TEXT,
    image_url_5         TEXT,
    image_url_6         TEXT,
    image_url_7         TEXT,
    -- Up to 2 Cloudinary video URLs
    video_url_1         TEXT,
    video_url_2         TEXT,
    description         TEXT,
    status              TEXT        DEFAULT 'available',  -- available | rented
    is_private_bathroom BOOLEAN     NOT NULL DEFAULT FALSE,
    contact_phone       TEXT,
    owner_id            UUID,       -- FK -> users (nullable: set null on owner deletion)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,            -- soft delete

    CONSTRAINT fk_houses_owner
        FOREIGN KEY (owner_id)
        REFERENCES users (id)
        ON DELETE SET NULL
);

COMMENT ON TABLE  houses                 IS 'Property listings available for rent';
COMMENT ON COLUMN houses.original_id     IS 'Stable external identifier used during seeding or import';
COMMENT ON COLUMN houses.property_type   IS 'house | apartment | condominium | commercial space | hotel | room/mini apartment';
COMMENT ON COLUMN houses.price           IS 'Monthly rent in Vietnamese Dong (VND)';
COMMENT ON COLUMN houses.owner_id        IS 'User who created/owns this listing; NULL if owner was deleted';
COMMENT ON COLUMN houses.deleted_at      IS 'Soft-delete timestamp; NULL means the listing is active';

CREATE INDEX idx_houses_city     ON houses (city);
CREATE INDEX idx_houses_district ON houses (district);
CREATE INDEX idx_houses_price    ON houses (price);
CREATE INDEX idx_houses_owner_id ON houses (owner_id);
CREATE INDEX idx_houses_status   ON houses (status);

-- -----------------------------------------------------------------------------
-- TABLE: favorites
-- Junction table: a user saves/hearts a house listing
-- -----------------------------------------------------------------------------
CREATE TABLE favorites (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID        NOT NULL,
    house_id   UUID        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_favorites_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_favorites_house
        FOREIGN KEY (house_id)
        REFERENCES houses (id)
        ON DELETE CASCADE,

    -- A user can favorite a listing only once
    CONSTRAINT uq_favorites_user_house UNIQUE (user_id, house_id)
);

COMMENT ON TABLE favorites IS 'Saved (hearted) property listings per user';

CREATE INDEX idx_favorites_user_id  ON favorites (user_id);
CREATE INDEX idx_favorites_house_id ON favorites (house_id);

-- -----------------------------------------------------------------------------
-- TABLE: messages
-- In-app chat messages between a user (viewer) and a super-admin
-- -----------------------------------------------------------------------------
CREATE TABLE messages (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID        NOT NULL,   -- the viewer/user who owns the conversation thread
    receiver_id  UUID,                   -- the designated recipient (admin)
    sender_id    UUID,                   -- actual sender (may differ in admin-initiated threads)
    sender_role  role        NOT NULL DEFAULT 'USER',
    content      TEXT        NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    seen_at      TIMESTAMPTZ,            -- when the message was read
    seen_by_role role,                   -- which role marked it as seen

    CONSTRAINT fk_messages_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_messages_receiver
        FOREIGN KEY (receiver_id)
        REFERENCES users (id)
        ON DELETE SET NULL
);

COMMENT ON TABLE  messages              IS 'Chat messages between users and admins';
COMMENT ON COLUMN messages.user_id      IS 'The user (viewer) who owns the thread';
COMMENT ON COLUMN messages.receiver_id  IS 'Recipient user (typically the admin)';
COMMENT ON COLUMN messages.sender_role  IS 'Role of the sender at send time';
COMMENT ON COLUMN messages.seen_at      IS 'Timestamp when the message was first read';
COMMENT ON COLUMN messages.seen_by_role IS 'Role of the reader who first marked it seen';

CREATE INDEX idx_messages_user_id     ON messages (user_id);
CREATE INDEX idx_messages_receiver_id ON messages (receiver_id);
CREATE INDEX idx_messages_created_at  ON messages (created_at DESC);

-- -----------------------------------------------------------------------------
-- TABLE: audit_logs
-- Immutable record of every significant data-mutation event
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id     UUID,                   -- user who performed the action (nullable for system)
    actor_role   TEXT,
    action_type  TEXT        NOT NULL,   -- CREATE | UPDATE | DELETE | LOGIN | etc.
    entity_type  TEXT        NOT NULL,   -- e.g. 'House', 'User', 'Message'
    entity_id    TEXT        NOT NULL,   -- UUID of the affected record (stored as TEXT for flexibility)
    before_data  JSONB,                  -- snapshot before the change
    after_data   JSONB,                  -- snapshot after the change
    ip_address   TEXT,
    user_agent   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  audit_logs            IS 'Immutable audit trail of all significant actions';
COMMENT ON COLUMN audit_logs.actor_id   IS 'User who triggered this event; NULL for system/automated actions';
COMMENT ON COLUMN audit_logs.before_data IS 'JSONB snapshot of the record before mutation';
COMMENT ON COLUMN audit_logs.after_data  IS 'JSONB snapshot of the record after mutation';

CREATE INDEX idx_audit_logs_actor_id    ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_entity      ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at  ON audit_logs (created_at DESC);

-- -----------------------------------------------------------------------------
-- TABLE: login_logs
-- Tracks every login attempt (both successful and failed)
-- -----------------------------------------------------------------------------
CREATE TABLE login_logs (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID,                     -- NULL if the user was not found
    role       TEXT,
    ip_address TEXT,
    user_agent TEXT,
    success    BOOLEAN     NOT NULL,     -- TRUE = login ok, FALSE = failed attempt
    timestamp  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  login_logs          IS 'Record of every login attempt for security auditing';
COMMENT ON COLUMN login_logs.user_id  IS 'References the user if they were identified; NULL for unrecognized accounts';
COMMENT ON COLUMN login_logs.success  IS 'TRUE for successful logins, FALSE for failed attempts';

CREATE INDEX idx_login_logs_user_id  ON login_logs (user_id);
CREATE INDEX idx_login_logs_success  ON login_logs (success);
CREATE INDEX idx_login_logs_timestamp ON login_logs (timestamp DESC);
