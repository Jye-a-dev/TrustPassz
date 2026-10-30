-- apps/server/prisma/migrations/20261031_dualchain_schema.sql
-- ============================================================================
-- TRUSTPASSZ DUAL-CHAIN ESCROW MIGRATION (TASK-b-03)
-- Adds Solana & EVM Dual-chain mapping columns to deals table in Neon PostgreSQL
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE chain_type_enum AS ENUM ('BASE_SEPOLIA', 'SOLANA_DEVNET', 'SOLANA_MAINNET');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE deals
    ADD COLUMN IF NOT EXISTS chain_type chain_type_enum NOT NULL DEFAULT 'BASE_SEPOLIA',
    ADD COLUMN IF NOT EXISTS solana_pda_address VARCHAR(64),
    ADD COLUMN IF NOT EXISTS buyer_wallet VARCHAR(100),
    ADD COLUMN IF NOT EXISTS seller_wallet VARCHAR(100),
    ADD COLUMN IF NOT EXISTS deposit_tx_hash VARCHAR(128);

ALTER TABLE deals
    ALTER COLUMN onchain_deal_id TYPE VARCHAR(128),
    ALTER COLUMN settle_tx_hash TYPE VARCHAR(128),
    ALTER COLUMN dispute_tx_hash TYPE VARCHAR(128);

CREATE INDEX IF NOT EXISTS idx_deals_chain_type ON deals (chain_type);
CREATE INDEX IF NOT EXISTS idx_deals_solana_pda_address ON deals (solana_pda_address);

