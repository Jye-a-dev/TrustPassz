/**
 * oracle-relayer.config.ts
 * Reads, validates, and exports typed Oracle Relayer environment config.
 * Throws at bootstrap if any required variable is missing or malformed.
 */

import { Logger } from '@nestjs/common';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const logger = new Logger('OracleRelayerConfig');

// Known default Anvil / Hardhat test wallet addresses (strictly banned in production)
const DEFAULT_TEST_ADDRESS_DENYLIST = new Set([
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
]);

export interface OracleRelayerConfig {
  /** 0x-prefixed hex private key of the Oracle Relayer wallet */
  privateKey: `0x${string}`;
  /** Checksummed contract address of DigitalEscrow on Base Sepolia */
  contractAddress: `0x${string}`;
  /** HTTP or WS RPC endpoint for Base Sepolia */
  rpcUrl: string;
  /** Optional Alchemy API Key for fallback RPC */
  alchemyApiKey?: string;
  /** Optional Infura API Key for fallback RPC */
  infuraApiKey?: string;
  /** Optional custom Alchemy RPC URL */
  alchemyRpcUrl?: string;
  /** Optional custom Infura RPC URL */
  infuraRpcUrl?: string;
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
  const isProd = process.env.NODE_ENV === 'production';
  let rawPrivateKey = process.env.ORACLE_RELAYER_PRIVATE_KEY;

  if (!rawPrivateKey || rawPrivateKey.trim() === '') {
    if (!isProd) {
      logger.warn(
        '[OracleRelayer] ORACLE_RELAYER_PRIVATE_KEY is missing. Generated ephemeral in-memory wallet key for development.',
      );
      rawPrivateKey = generatePrivateKey();
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

  // Reject insecure test accounts in production environments
  if (isProd) {
    try {
      const derivedAccount = privateKeyToAccount(privateKey);
      if (
        DEFAULT_TEST_ADDRESS_DENYLIST.has(derivedAccount.address.toLowerCase())
      ) {
        throw new Error(
          `[OracleRelayer] CRITICAL SECURITY ERROR: Well-known Anvil/Hardhat test private key (${derivedAccount.address}) is strictly rejected in production!`,
        );
      }
    } catch (err: any) {
      if (err.message.includes('CRITICAL SECURITY ERROR')) throw err;
      throw new Error(`[OracleRelayer] Invalid private key: ${err.message}`);
    }
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

  const alchemyApiKey = process.env.ALCHEMY_API_KEY?.trim() || undefined;
  const infuraApiKey = process.env.INFURA_API_KEY?.trim() || undefined;
  const alchemyRpcUrl = process.env.ALCHEMY_RPC_URL?.trim() || undefined;
  const infuraRpcUrl = process.env.INFURA_RPC_URL?.trim() || undefined;

  return {
    privateKey,
    contractAddress,
    rpcUrl,
    alchemyApiKey,
    infuraApiKey,
    alchemyRpcUrl,
    infuraRpcUrl,
  };
}
