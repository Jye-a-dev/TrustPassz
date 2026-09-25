-- apps/server/prisma/migrations/init_schema.sql
-- ============================================================================
-- TRUSTPASSZ UNIFIED DATABASE INITIALIZATION DDL (PostgreSQL)
-- Target: apps/server | Task: TASK-03 (Neon PostgreSQL Core Relational Engine)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ENUMS
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('USER', 'ADMIN', 'ARBITRATOR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE deal_state_enum AS ENUM ('PENDING', 'DEPOSITED', 'IN_INSPECTION', 'SETTLED', 'REFUNDED', 'DISPUTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE asset_type_enum AS ENUM ('SOURCE_CODE', 'LICENSE_KEY', 'ACCOUNT_CREDENTIAL', 'DESIGN_ASSET', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE dispute_status_enum AS ENUM ('OPENED', 'AI_PROCESSING', 'AI_RESOLVED', 'ADMIN_ESCALATED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE arbitration_verdict_enum AS ENUM ('APPROVE_PAYOUT', 'TRIGGER_REFUND', 'ESCALATE_TO_ADMIN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE product_status_enum AS ENUM ('DRAFT', 'ACTIVE', 'RESERVED', 'SOLD_OUT', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM ('PENDING_PAYMENT', 'PAID_ESCROW', 'PROCESSING', 'SHIPPING', 'IN_INSPECTION', 'COMPLETED', 'DISPUTED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE bargain_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- 2. TRIGGER FUNCTION FOR UPDATED_AT TIMESTAMP
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) UNIQUE,
    "phone" VARCHAR(20) UNIQUE,
    "wallet_address" VARCHAR(42) UNIQUE,
    "display_name" VARCHAR(100),
    "avatar_url" TEXT,
    "role" user_role_enum NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "storefronts" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "seller_id" UUID UNIQUE NOT NULL,
    "slug" VARCHAR(100) UNIQUE NOT NULL,
    "shop_name" VARCHAR(150) NOT NULL,
    "bio" TEXT,
    "custom_config" JSONB NOT NULL DEFAULT '{"theme":"dark","social_links":{},"banner_url":null,"canvas_layout":[]}'::jsonb,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_storefronts_seller FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "products" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "seller_id" UUID NOT NULL,
    "storefront_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "base_price" NUMERIC(18, 4) NOT NULL,
    "floor_price" NUMERIC(18, 4),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'VND',
    "status" product_status_enum NOT NULL DEFAULT 'ACTIVE',
    "spec_attributes" JSONB NOT NULL DEFAULT '{"tags":[],"media_gallery":[],"ai_defect_fingerprints":[],"delivery_method":"INSTANT_VAULT"}'::jsonb,
    "rule_config" JSONB NOT NULL DEFAULT '{"inspection_hours":12,"allow_bargain":true,"deposit_fee_rate":1.0,"anti_boom_deposit_amount":0}'::jsonb,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_seller FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT,
    CONSTRAINT fk_products_storefront FOREIGN KEY ("storefront_id") REFERENCES "storefronts"("id") ON DELETE SET NULL,
    CONSTRAINT chk_products_base_price CHECK ("base_price" >= 0)
);

CREATE TABLE IF NOT EXISTS "deals" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "onchain_deal_id" VARCHAR(66) UNIQUE,
    "seller_id" UUID NOT NULL,
    "buyer_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "amount" NUMERIC(18, 4) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'VND',
    "state" deal_state_enum NOT NULL DEFAULT 'PENDING',
    "inspection_duration" INTEGER NOT NULL DEFAULT 86400,
    "deposited_at" TIMESTAMPTZ,
    "inspection_deadline" TIMESTAMPTZ,
    "payment_order_code" BIGINT UNIQUE,
    "payment_ref_id" VARCHAR(100),
    "webhook_idempotency_key" VARCHAR(128) UNIQUE,
    "settle_tx_hash" VARCHAR(66),
    "dispute_tx_hash" VARCHAR(66),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_deals_seller FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT,
    CONSTRAINT fk_deals_buyer FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE SET NULL,
    CONSTRAINT chk_deals_amount_positive CHECK ("amount" > 0),
    CONSTRAINT chk_deals_duration_positive CHECK ("inspection_duration" > 0)
);

CREATE TABLE IF NOT EXISTS "orders" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "order_number" VARCHAR(64) UNIQUE NOT NULL,
    "deal_id" UUID UNIQUE NOT NULL,
    "buyer_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "status" order_status_enum NOT NULL DEFAULT 'PENDING_PAYMENT',
    "total_amount" NUMERIC(18, 4) NOT NULL,
    "shipping_info" JSONB NOT NULL DEFAULT '{"is_physical":false,"recipient_email":null,"shipping_address":null,"carrier_tracking_code":null,"carrier_name":null,"shipping_fee":0}'::jsonb,
    "payment_metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_deal FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE RESTRICT,
    CONSTRAINT fk_orders_buyer FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT,
    CONSTRAINT fk_orders_seller FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT,
    CONSTRAINT fk_orders_product FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "bargain_offers" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "product_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "offered_price" NUMERIC(18, 4) NOT NULL,
    "status" bargain_status_enum NOT NULL DEFAULT 'PENDING',
    "negotiation_data" JSONB NOT NULL DEFAULT '{"buyer_note":"","ai_suggested":false,"session_socket_id":null}'::jsonb,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bargain_product FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
    CONSTRAINT fk_bargain_buyer FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "digital_assets" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "deal_id" UUID UNIQUE NOT NULL,
    "asset_type" asset_type_enum NOT NULL DEFAULT 'SOURCE_CODE',
    "encrypted_content" TEXT NOT NULL,
    "encryption_iv" VARCHAR(64) NOT NULL,
    "auth_tag" VARCHAR(64) NOT NULL,
    "content_hash" VARCHAR(64),
    "file_name" VARCHAR(255),
    "file_size_bytes" BIGINT,
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "max_access_limit" INTEGER NOT NULL DEFAULT 1,
    "unlocked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_digital_assets_deal FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE,
    CONSTRAINT chk_assets_access_count CHECK ("access_count" >= 0)
);

CREATE TABLE IF NOT EXISTS "dispute_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "deal_id" UUID NOT NULL,
    "initiator_id" UUID NOT NULL,
    "status" dispute_status_enum NOT NULL DEFAULT 'OPENED',
    "reason" TEXT NOT NULL,
    "evidence_urls" JSONB NOT NULL DEFAULT '[]',
    "ai_verdict" arbitration_verdict_enum,
    "ai_confidence_score" NUMERIC(5, 4),
    "ai_explanation" TEXT,
    "ai_analyzed_at" TIMESTAMPTZ,
    "admin_verdict" arbitration_verdict_enum,
    "resolved_by_id" UUID,
    "resolution_note" TEXT,
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_disputes_deal FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE RESTRICT,
    CONSTRAINT fk_disputes_initiator FOREIGN KEY ("initiator_id") REFERENCES "users"("id") ON DELETE RESTRICT,
    CONSTRAINT fk_disputes_resolver FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL,
    CONSTRAINT chk_confidence_score_range CHECK ("ai_confidence_score" >= 0 AND "ai_confidence_score" <= 1)
);

-- ============================================================================
-- 4. ATTACH AUTOMATIC UPDATED_AT TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS trg_users_updated_at ON "users";
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_storefronts_updated_at ON "storefronts";
CREATE TRIGGER trg_storefronts_updated_at BEFORE UPDATE ON "storefronts" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_products_updated_at ON "products";
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON "products" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_deals_updated_at ON "deals";
CREATE TRIGGER trg_deals_updated_at BEFORE UPDATE ON "deals" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON "orders";
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON "orders" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_digital_assets_updated_at ON "digital_assets";
CREATE TRIGGER trg_digital_assets_updated_at BEFORE UPDATE ON "digital_assets" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_dispute_logs_updated_at ON "dispute_logs";
CREATE TRIGGER trg_dispute_logs_updated_at BEFORE UPDATE ON "dispute_logs" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. B-TREE & GIN INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_deals_seller_id ON "deals"("seller_id");
CREATE INDEX IF NOT EXISTS idx_deals_buyer_id ON "deals"("buyer_id");
CREATE INDEX IF NOT EXISTS idx_deals_state ON "deals"("state");
CREATE INDEX IF NOT EXISTS idx_deals_onchain_deal_id ON "deals"("onchain_deal_id");
CREATE INDEX IF NOT EXISTS idx_deals_payment_order_code ON "deals"("payment_order_code");
CREATE INDEX IF NOT EXISTS idx_digital_assets_deal_id ON "digital_assets"("deal_id");
CREATE INDEX IF NOT EXISTS idx_dispute_logs_deal_id ON "dispute_logs"("deal_id");
CREATE INDEX IF NOT EXISTS idx_dispute_logs_status ON "dispute_logs"("status");
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON "products"("seller_id");
CREATE INDEX IF NOT EXISTS idx_products_status ON "products"("status");
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON "orders"("buyer_id");
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON "orders"("seller_id");
CREATE INDEX IF NOT EXISTS idx_orders_status ON "orders"("status");
CREATE INDEX IF NOT EXISTS idx_bargain_offers_product ON "bargain_offers"("product_id");

CREATE INDEX IF NOT EXISTS idx_products_spec_gin ON "products" USING GIN ("spec_attributes");
CREATE INDEX IF NOT EXISTS idx_orders_shipping_gin ON "orders" USING GIN ("shipping_info");
CREATE INDEX IF NOT EXISTS idx_dispute_logs_evidence_gin ON "dispute_logs" USING GIN ("evidence_urls");
