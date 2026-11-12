import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface ProbeTarget {
  url: string;
  isRpc?: boolean;
}

export interface ProbeResult {
  url: string;
  ok: boolean;
  status: number;
  latencyMs: number;
  latestBlock?: number;
  error?: string;
}

const ALLOWED_HOSTNAMES = [
  'trustpassz-server.onrender.com',
  'trustpassz-ai-pipeline.onrender.com',
  'trustpassz.vercel.app',
  'trustpassz-cl-user.vercel.app',
  'sepolia.base.org',
  'base-sepolia-rpc.publicnode.com',
  'localhost',
  '127.0.0.1',
];

function isAllowedUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return ALLOWED_HOSTNAMES.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

async function probeSingleUrl(target: ProbeTarget): Promise<ProbeResult> {
  const { url, isRpc } = target;

  if (!isAllowedUrl(url)) {
    return {
      url,
      ok: false,
      status: 400,
      latencyMs: 0,
      error: 'URL is not in allowed probe whitelist',
    };
  }

  const startTime = Date.now();

  if (isRpc) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const rpcRes = await fetch(url, {
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
      const latencyMs = Math.max(Date.now() - startTime, 1);
      const rpcData = (await rpcRes.json()) as { result?: string };
      const latestBlock = rpcData?.result ? parseInt(rpcData.result, 16) : undefined;

      return {
        url,
        ok: Boolean(rpcData?.result),
        status: rpcRes.status,
        latencyMs,
        latestBlock,
      };
    } catch (err) {
      return {
        url,
        ok: false,
        status: 503,
        latencyMs: Math.max(Date.now() - startTime, 1),
        error: err instanceof Error ? err.message : 'RPC probe failed',
      };
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'TrustPassz-Admin-HealthProbe/1.0',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.max(Date.now() - startTime, 1);

    return {
      url,
      ok: res.ok || res.status < 500,
      status: res.status,
      latencyMs,
    };
  } catch (err) {
    return {
      url,
      ok: false,
      status: 503,
      latencyMs: Math.max(Date.now() - startTime, 1),
      error: err instanceof Error ? err.message : 'HTTP probe connection failed',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      url?: string;
      isRpc?: boolean;
      targets?: ProbeTarget[];
    };

    if (Array.isArray(body.targets) && body.targets.length > 0) {
      const results = await Promise.all(body.targets.map(probeSingleUrl));
      return NextResponse.json({ ok: true, results }, { status: 200 });
    }

    const singleUrl = body.url;
    if (!singleUrl) {
      return NextResponse.json(
        { ok: false, error: 'Missing required target URL' },
        { status: 400 }
      );
    }

    const result = await probeSingleUrl({
      url: singleUrl,
      isRpc: Boolean(body.isRpc),
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Invalid probe request payload',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url = searchParams.get('url');
  const isRpc = searchParams.get('isRpc') === 'true';

  if (!url) {
    return NextResponse.json(
      { ok: false, error: 'Query parameter "url" is required' },
      { status: 400 }
    );
  }

  const result = await probeSingleUrl({ url, isRpc });
  return NextResponse.json(result, { status: 200 });
}
