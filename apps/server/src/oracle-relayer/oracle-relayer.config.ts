/**
 * oracle-relayer.config.ts
 * Reads, validates, and exports typed Oracle Relayer environment config.
 * Throws at bootstrap if any required variable is missing or malformed.
 */

import { Logger } from '@nestjs/common';

const logger = new Logger('OracleRelayerConfig');
const DEV_FALLBACK_PRIVATE_KEY: `0x${string}` =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

export interface OracleRelayerConfig {
  /** 0x-prefixed hex private key of the Oracle Relayer wallet */
  privateKey: `0x${string}`;
  /** Checksummed contract address of DigitalEscrow on Base Sepolia */
  contractAddress: `0x${string}`;
  /** HTTP or WS RPC endpoint for Base Sepolia */
  rpcUrl: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(
      `[OracleRelayer] Missing required environment variable: ${key}`,
    );
  }
  return value.trim();
}

function validateHex(value: string, label: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]+$/.test(value)) {
    throw new Error(
      `[OracleRelayer] ${label} must be a valid 0x-prefixed hex string, got: ${value.substring(0, 10)}...`,
    );
  }
  return value as `0x${string}`;
}

function validateAddress(value: string, label: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(
      `[OracleRelayer] ${label} must be a valid 20-byte Ethereum address (42 hex chars), got: ${value}`,
    );
  }
  return value as `0x${string}`;
}

/**
 * Resolves and validates all oracle relayer config from process.env.
 * Call once at module bootstrap — throws on misconfiguration.
 */
export function loadOracleRelayerConfig(): OracleRelayerConfig {
  const isDev = process.env.NODE_ENV !== 'production';
  let rawPrivateKey = process.env.ORACLE_RELAYER_PRIVATE_KEY;

  if (!rawPrivateKey || rawPrivateKey.trim() === '') {
    if (isDev) {
      logger.warn(
        '[OracleRelayer] ORACLE_RELAYER_PRIVATE_KEY is not defined. Using local development fallback wallet key.',
      );
      rawPrivateKey = DEV_FALLBACK_PRIVATE_KEY;
    } else {
      rawPrivateKey = requireEnv('ORACLE_RELAYER_PRIVATE_KEY');
    }
  }

  const rawContractAddress = requireEnv('ESCROW_CONTRACT_ADDRESS');
  const rpcUrl = requireEnv('BASE_SEPOLIA_RPC_URL');

  const privateKey = validateHex(rawPrivateKey, 'ORACLE_RELAYER_PRIVATE_KEY');

  // Private key must be 32 bytes = 64 hex chars after 0x prefix
  if (privateKey.length !== 66) {
    throw new Error(
      `[OracleRelayer] ORACLE_RELAYER_PRIVATE_KEY must be 32 bytes (66 chars including 0x prefix)`,
    );
  }

  const contractAddress = validateAddress(
    rawContractAddress,
    'ESCROW_CONTRACT_ADDRESS',
  );

  if (!rpcUrl.startsWith('http') && !rpcUrl.startsWith('ws')) {
    throw new Error(
      `[OracleRelayer] BASE_SEPOLIA_RPC_URL must be a valid HTTP or WS URL, got: ${rpcUrl}`,
    );
  }

  return { privateKey, contractAddress, rpcUrl };
}
