import { apiClient, API_BASE_URL } from './apiClient';
import type { HealthStatus } from '../types';

export async function checkBackendHealth(): Promise<HealthStatus> {
  const startTime = performance.now();
  try {
    const data = await apiClient<{ status: string; service: string; timestamp?: string }>(
      '/api/v1/health',
      {
        method: 'GET',
        skipAuth: true,
        timeoutMs: 4000,
      }
    );
    const latencyMs = Math.round(performance.now() - startTime);
    console.log(`[TrustPassz-Capacitor] ✅ Backend Latency: ${latencyMs}ms (${API_BASE_URL})`);
    return {
      status: data.status === 'ok' ? 'ok' : 'offline',
      service: data.service || 'TrustPassz Unified API',
      timestamp: data.timestamp || new Date().toISOString(),
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - startTime);
    console.warn(`[TrustPassz-Capacitor] ⚠️ Backend Health Check Failed (${latencyMs}ms):`, err);
    return {
      status: 'offline',
      service: 'Unavailable',
      timestamp: new Date().toISOString(),
      latencyMs,
    };
  }
}

