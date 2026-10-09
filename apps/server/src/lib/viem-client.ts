/**
 * viem-client.ts
 *
 * Production Viem client infrastructure with multi-RPC fallback transport.
 * Mitigates HTTP 429 (Rate Limit) errors and node outages on Base Sepolia by
 * cascading queries across prioritized endpoints:
 *   1. Primary: Base Sepolia Public RPC (BASE_SEPOLIA_RPC_URL)
 *   2. Secondary: Alchemy Base Sepolia (ALCHEMY_API_KEY / ALCHEMY_RPC_URL)
 *   3. Tertiary: Infura Base Sepolia (INFURA_API_KEY / INFURA_RPC_URL)
 *   4. Quaternary: PublicNode community backup
 */

import {
  createPublicClient,
  createWalletClient,
  fallback,
  http,
  type Account,
  type Chain,
  type Transport,
} from 'viem';
import { baseSepolia } from 'viem/chains';
import { Logger } from '@nestjs/common';
import type {
  ViemPublicClient,
  ViemWalletClient,
} from '../oracle-relayer/oracle-relayer.types';

const logger = new Logger('ViemClientFactory');

export interface FallbackRpcEndpoints {
  primaryRpcUrl?: string;
  alchemyApiKey?: string;
  alchemyRpcUrl?: string;
  infuraApiKey?: string;
  infuraRpcUrl?: string;
}

export interface ViemClientFactoryOptions {
  chain?: Chain;
  endpoints?: FallbackRpcEndpoints;
  requestTimeoutMs?: number;
  retryCountPerNode?: number;
  retryDelayMs?: number;
}

/**
 * Resolves candidate RPC URLs strictly ordered by priority.
 */
export function resolveRpcUrls(endpoints?: FallbackRpcEndpoints): string[] {
  const primaryUrl =
    endpoints?.primaryRpcUrl ||
    process.env.BASE_SEPOLIA_RPC_URL ||
    'https://sepolia.base.org';

  const alchemyKey = endpoints?.alchemyApiKey || process.env.ALCHEMY_API_KEY;
  const alchemyUrl =
    endpoints?.alchemyRpcUrl ||
    process.env.ALCHEMY_RPC_URL ||
    (alchemyKey
      ? `https://base-sepolia.g.alchemy.com/v2/${alchemyKey}`
      : undefined);

  const infuraKey = endpoints?.infuraApiKey || process.env.INFURA_API_KEY;
  const infuraUrl =
    endpoints?.infuraRpcUrl ||
    process.env.INFURA_RPC_URL ||
    (infuraKey ? `https://base-sepolia.infura.io/v3/${infuraKey}` : undefined);

  const publicNodeUrl = 'https://base-sepolia-rpc.publicnode.com';

  const uniqueUrls: string[] = [];
  const seen = new Set<string>();

  for (const url of [primaryUrl, alchemyUrl, infuraUrl, publicNodeUrl]) {
    if (url && typeof url === 'string' && url.trim().length > 0) {
      const sanitized = url.trim();
      if (!seen.has(sanitized)) {
        seen.add(sanitized);
        uniqueUrls.push(sanitized);
      }
    }
  }

  return uniqueUrls;
}

/**
 * Creates a Viem fallback transport configured for transparent failover on HTTP 429.
 */
export function createViemFallbackTransport(
  endpoints?: FallbackRpcEndpoints,
  options?: Omit<ViemClientFactoryOptions, 'endpoints'>,
): Transport {
  const urls = resolveRpcUrls(endpoints);
  const timeout = options?.requestTimeoutMs ?? 10_000;
  const retryCount = options?.retryCountPerNode ?? 2;
  const retryDelay = options?.retryDelayMs ?? 1_000;

  logger.log(
    `Configuring Viem fallback transport across ${urls.length} RPC endpoint(s). Primary: ${urls[0]}`,
  );

  const transports = urls.map((url) =>
    http(url, {
      timeout,
      retryCount,
      retryDelay,
    }),
  );

  return fallback(transports, {
    rank: false, // Maintain deterministic order: Primary -> Alchemy -> Infura -> Backup
    retryCount: 3,
    retryDelay: 1_000,
  });
}

/**
 * Creates a PublicClient wired to the multi-RPC fallback transport.
 */
export function createFallbackPublicClient(
  options?: ViemClientFactoryOptions,
): ViemPublicClient {
  const chain = options?.chain ?? baseSepolia;
  const transport = createViemFallbackTransport(options?.endpoints, options);

  return createPublicClient({
    chain,
    transport,
  });
}

/**
 * Creates a WalletClient wired to the multi-RPC fallback transport.
 */
export function createFallbackWalletClient(
  account: Account,
  options?: ViemClientFactoryOptions,
): ViemWalletClient {
  const chain = options?.chain ?? baseSepolia;
  const transport = createViemFallbackTransport(options?.endpoints, options);

  return createWalletClient({
    account,
    chain,
    transport,
  });
}
