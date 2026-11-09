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
    endpoint: process.env.NEXT_PUBLIC_USER_APP_URL || 'http://localhost:5000',
    framework: 'Next.js 15 App Router',
  },
  {
    id: 'cl_admin_local',
    name: 'cl_admin (Admin Portal - Local)',
    environment: 'local',
    endpoint: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5100',
    framework: 'Next.js 15 + Zustand',
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
    name: 'cl_admin (Admin Portal - Vercel HTTPS)',
    environment: 'deployed',
    endpoint: 'https://trustpassz-cl-admin.vercel.app',
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

export async function pingNode(config: PillarNodeConfig): Promise<SystemPillarStatus> {
  const startTime = Date.now();
  const isHttps = config.endpoint.startsWith('https://');

  if (config.isRpc) {
    let latestBlock = 18492042;
    let isRpcHealthy = true;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const rpcRes = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: [],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const rpcData = await rpcRes.json();
      if (rpcData?.result) {
        latestBlock = parseInt(rpcData.result, 16);
      }
    } catch {
      isRpcHealthy = false;
    }

    const latency = Date.now() - startTime;
    return {
      id: config.id,
      name: config.name,
      environment: config.environment,
      status: isRpcHealthy ? 'healthy' : 'degraded',
      latencyMs: Math.max(latency, 24),
      endpoint: config.endpoint,
      httpStatus: isRpcHealthy ? 200 : 503,
      sslActive: isHttps,
      details: {
        network: 'Base Sepolia (ChainID 84532)',
        latestBlock,
        contractAddress: CONTRACT_ADDRESS,
        relayerAddress: RELAYER_ADDRESS,
        sslCertified: isHttps,
      },
      lastChecked: new Date().toISOString(),
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(config.endpoint, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);

    const latency = Date.now() - startTime;
    const isOk = Boolean(res && (res.ok || res.status < 500));
    const httpStatus = res ? res.status : 503;

    return {
      id: config.id,
      name: config.name,
      environment: config.environment,
      status: isOk ? 'healthy' : 'down',
      latencyMs: Math.max(latency, 8),
      endpoint: config.endpoint,
      httpStatus,
      sslActive: isHttps,
      details: {
        httpStatus: `${httpStatus} ${isOk ? 'OK' : 'Error'}`,
        sslActive: isHttps ? 'Hợp lệ (TLS/SSL)' : 'Local HTTP',
        framework: config.framework,
        responseType: res ? res.type : 'network_error',
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
      endpoint: config.endpoint,
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
