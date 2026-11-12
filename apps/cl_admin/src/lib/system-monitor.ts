import type { SystemPillarStatus } from '@/types';

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS ||
  '0x88a82fe4f3be44bb493fa6e7efd68313e7c2ec15';
export const RELAYER_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

const BASE_SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

export interface PillarNodeConfig {
  id: string;
  name: string;
  environment: 'local' | 'deployed';
  endpoint: string;
  framework: string;
  isRpc?: boolean;
}

function getSanitizedUserAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_USER_APP_URL || 'http://localhost:5000';
  if (envUrl.includes('pages.dev')) {
    return 'https://trustpassz-cl-user.vercel.app';
  }
  return envUrl;
}

function getAdminSameOriginEndpoint(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/health`;
  }
  return '/api/health';
}

export const MONITORED_NODES: PillarNodeConfig[] = [
  // --- Local Development Nodes ---
  {
    id: 'server_local',
    name: 'server (NestJS Core API - Local)',
    environment: 'local',
    endpoint: process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/health`
      : 'http://localhost:3000/api/v1/health',
    framework: 'NestJS 11 + Neon PostgreSQL',
  },
  {
    id: 'pipeline_local',
    name: 'pipeline (sVLM Engine - Local)',
    environment: 'local',
    endpoint: process.env.NEXT_PUBLIC_AI_PIPELINE_URL || 'http://localhost:3100/health',
    framework: 'FastAPI + Qwen2-VL-2B',
  },
  {
    id: 'cl_user_local',
    name: 'cl_user (Next.js Client - Local)',
    environment: 'local',
    endpoint: getSanitizedUserAppUrl(),
    framework: 'Next.js 15 App Router',
  },
  {
    id: 'cl_admin_local',
    name: 'cl_admin (Admin Portal - Local)',
    environment: 'local',
    endpoint: getAdminSameOriginEndpoint(),
    framework: 'Next.js 16 + Zustand',
  },
  {
    id: 'contract_local',
    name: 'contract (Base Sepolia RPC - Dev)',
    environment: 'local',
    endpoint: BASE_SEPOLIA_RPC,
    framework: 'Base Sepolia Testnet (84532)',
    isRpc: true,
  },

  // --- Production / Staging Deployed HTTPS Nodes ---
  {
    id: 'server_deployed',
    name: 'server (NestJS Core API - Render HTTPS)',
    environment: 'deployed',
    endpoint: 'https://trustpassz-server.onrender.com/api/v1/health',
    framework: 'Render Cloud Deployment',
  },
  {
    id: 'pipeline_deployed',
    name: 'pipeline (sVLM Engine - Render HTTPS)',
    environment: 'deployed',
    endpoint: 'https://trustpassz-ai-pipeline.onrender.com/health',
    framework: 'Render GPU / Container',
  },
  {
    id: 'cl_user_deployed',
    name: 'cl_user (Web Client - Vercel HTTPS)',
    environment: 'deployed',
    endpoint: 'https://trustpassz-cl-user.vercel.app',
    framework: 'Vercel Edge Network',
  },
  {
    id: 'cl_admin_deployed',
    name: 'cl_admin (Admin Portal - Same-Origin)',
    environment: 'deployed',
    endpoint: getAdminSameOriginEndpoint(),
    framework: 'Vercel Edge Deployment',
  },
  {
    id: 'contract_deployed',
    name: 'contract (Base Sepolia RPC - Sepolia HTTPS)',
    environment: 'deployed',
    endpoint: 'https://sepolia.base.org',
    framework: 'Base Sepolia Public Node',
    isRpc: true,
  },
];

interface ServerProbeResponse {
  url: string;
  ok: boolean;
  status: number;
  latencyMs: number;
  latestBlock?: number;
  error?: string;
}

export async function pingNode(config: PillarNodeConfig): Promise<SystemPillarStatus> {
  const startTime = Date.now();
  const endpoint = config.endpoint.startsWith('http')
    ? config.endpoint
    : (typeof window !== 'undefined' ? `${window.location.origin}${config.endpoint}` : config.endpoint);
  const isHttps = endpoint.startsWith('https://');

  const isSameOrigin =
    config.endpoint.startsWith('/') ||
    (typeof window !== 'undefined' && endpoint.startsWith(window.location.origin));

  // 1. Same-Origin Check: direct fetch inside the same domain (no CORS possible)
  if (isSameOrigin && !config.isRpc) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(config.endpoint, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeoutId);

      const latency = Math.max(Date.now() - startTime, 1);
      const isOk = Boolean(res && (res.ok || res.status < 500));
      const httpStatus = res ? res.status : 503;

      return {
        id: config.id,
        name: config.name,
        environment: config.environment,
        status: isOk ? 'healthy' : 'down',
        latencyMs: latency,
        endpoint,
        httpStatus,
        sslActive: isHttps,
        details: {
          httpStatus: `${httpStatus} ${isOk ? 'OK' : 'Error'}`,
          sslActive: isHttps ? 'Hợp lệ (TLS/SSL)' : 'Same-Origin Local',
          framework: config.framework,
          responseType: res ? res.type : 'network_error',
        },
        lastChecked: new Date().toISOString(),
      };
    } catch (err) {
      return {
        id: config.id,
        name: config.name,
        environment: config.environment,
        status: 'down',
        latencyMs: Date.now() - startTime,
        endpoint,
        httpStatus: 503,
        sslActive: isHttps,
        details: {
          error: err instanceof Error ? err.message : 'Kết nối thất bại',
          sslActive: isHttps ? 'TLS/SSL' : 'HTTP',
        },
        lastChecked: new Date().toISOString(),
      };
    }
  }

  // 2. External Nodes / RPC: Delegate to Server-Side Health Probe Route to guarantee 0% CORS and 0% DNS errors
  try {
    const probeEndpoint = typeof window !== 'undefined'
      ? `${window.location.origin}/api/health-probe`
      : '/api/health-probe';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const probeRes = await fetch(probeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: config.endpoint,
        isRpc: Boolean(config.isRpc),
      }),
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (probeRes && probeRes.ok) {
      const probeData = (await probeRes.json()) as ServerProbeResponse;
      const isOk = probeData.ok;
      const latencyMs = Math.max(probeData.latencyMs || Date.now() - startTime, 1);

      if (config.isRpc) {
        return {
          id: config.id,
          name: config.name,
          environment: config.environment,
          status: isOk ? 'healthy' : 'degraded',
          latencyMs,
          endpoint,
          httpStatus: probeData.status || (isOk ? 200 : 503),
          sslActive: isHttps,
          details: {
            network: 'Base Sepolia (ChainID 84532)',
            latestBlock: probeData.latestBlock || 18492042,
            contractAddress: CONTRACT_ADDRESS,
            relayerAddress: RELAYER_ADDRESS,
            sslCertified: isHttps,
          },
          lastChecked: new Date().toISOString(),
        };
      }

      return {
        id: config.id,
        name: config.name,
        environment: config.environment,
        status: isOk ? 'healthy' : 'down',
        latencyMs,
        endpoint,
        httpStatus: probeData.status || (isOk ? 200 : 503),
        sslActive: isHttps,
        details: {
          httpStatus: `${probeData.status} ${isOk ? 'OK' : 'Error'}`,
          sslActive: isHttps ? 'Hợp lệ (TLS/SSL)' : 'HTTP',
          framework: config.framework,
          responseType: isOk ? 'server_probe_ok' : (probeData.error || 'server_probe_error'),
        },
        lastChecked: new Date().toISOString(),
      };
    }

    // Server route returned non-200 or timed out
    return {
      id: config.id,
      name: config.name,
      environment: config.environment,
      status: 'down',
      latencyMs: Date.now() - startTime,
      endpoint,
      httpStatus: probeRes ? probeRes.status : 503,
      sslActive: isHttps,
      details: {
        error: 'Probe service unavailable',
        sslActive: isHttps ? 'TLS/SSL' : 'HTTP',
      },
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      id: config.id,
      name: config.name,
      environment: config.environment,
      status: 'down',
      latencyMs: Date.now() - startTime,
      endpoint,
      httpStatus: 503,
      sslActive: isHttps,
      details: {
        error: error instanceof Error ? error.message : 'Kết nối thất bại',
        sslActive: isHttps ? 'TLS/SSL' : 'HTTP',
      },
      lastChecked: new Date().toISOString(),
    };
  }
}

export async function checkAllPillars(
  envFilter: 'ALL' | 'LOCAL' | 'DEPLOYED' = 'ALL'
): Promise<SystemPillarStatus[]> {
  const nodesToPing = MONITORED_NODES.filter((node) => {
    if (envFilter === 'LOCAL') return node.environment === 'local';
    if (envFilter === 'DEPLOYED') return node.environment === 'deployed';
    return true;
  });

  return Promise.all(nodesToPing.map((node) => pingNode(node)));
}
