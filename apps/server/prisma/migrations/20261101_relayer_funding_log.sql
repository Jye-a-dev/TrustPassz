-- apps/server/prisma/migrations/20261101_relayer_funding_log.sql
-- ============================================================================
-- TRUSTPASSZ RELAYER GAS FUNDING LOGS (TASK-b-06)
-- Creates relayer_funding_logs table in Neon PostgreSQL
-- ============================================================================

DO $$ BEGIN
    ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS relayer_funding_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_hash VARCHAR(128) NOT NULL UNIQUE,
    sender_wallet VARCHAR(100) NOT NULL,
    relayer_wallet VARCHAR(100) NOT NULL,
    amount_sol DECIMAL(18, 9) NOT NULL,
    amount_lamports BIGINT NOT NULL,
    admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relayer_funding_sender ON relayer_funding_logs (sender_wallet);
CREATE INDEX IF NOT EXISTS idx_relayer_funding_relayer ON relayer_funding_logs (relayer_wallet);
CREATE INDEX IF NOT EXISTS idx_relayer_funding_created ON relayer_funding_logs (created_at);

