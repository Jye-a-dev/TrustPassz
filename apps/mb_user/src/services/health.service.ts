/**
 * TrustPassz Mobile - Health Service & Logger
 * Probes NestJS backend /api/v1/health status and outputs diagnostic logs to Metro/Terminal.
 * Follows Cyber-Escrow architectural standards and zero-regression principles.
 */

import { apiClient, ApiError } from '../api/apiClient';

export type HealthStatus = 'IDLE' | 'CHECKING' | 'ONLINE' | 'OFFLINE';

export interface HealthState {
  status: HealthStatus;
  host: string;
  latencyMs: number | null;
  error: string | null;
  lastChecked: Date | null;
}

export type HealthSubscriber = (state: HealthState) => void;

export interface BackendHealthResponse {
  status: string;
  timestamp?: string;
  database?: { status: string };
  microservices?: Record<string, unknown>;
}

export class HealthService {
  private static instance: HealthService | null = null;
  private subscribers: Set<HealthSubscriber> = new Set();

  private state: HealthState = {
    status: 'IDLE',
    host: '',
    latencyMs: null,
    error: null,
    lastChecked: null,
  };

  private constructor() {
    this.state.host = apiClient.getBaseUrl();
  }

  public static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  public getState(): HealthState {
    return { ...this.state };
  }

  public subscribe(subscriber: HealthSubscriber): () => void {
    this.subscribers.add(subscriber);
    subscriber(this.getState());
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  private notify(): void {
    const currentState = this.getState();
    this.subscribers.forEach((cb) => {
      try {
        cb(currentState);
      } catch {
        // Prevent subscriber errors from halting execution
      }
    });
  }

  /**
   * Dispatches GET /api/v1/health probe to verify server reachability and latency.
   * Prints high-visibility terminal logs for mobile debugging.
   */
  public async checkHealth(): Promise<HealthState> {
    const host = apiClient.getBaseUrl();
    this.state = {
      ...this.state,
      status: 'CHECKING',
      host,
      error: null,
    };
    this.notify();

    const startTime = Date.now();

    try {
      await apiClient.get<BackendHealthResponse>('/api/v1/health', {
        skipAuth: true,
        timeoutMs: 6000,
      });

      const latencyMs = Date.now() - startTime;
      this.state = {
        status: 'ONLINE',
        host,
        latencyMs,
        error: null,
        lastChecked: new Date(),
      };

      // Exact formatted log required by project directive
      console.log(
        `[TrustPassz-Mobile] 🟢 Kết nối Server thành công! Host: ${host} | Latency: ${latencyMs}ms | Status: 200 OK`,
      );

      this.notify();
      return this.getState();
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err);

      this.state = {
        status: 'OFFLINE',
        host,
        latencyMs,
        error: errorMessage,
        lastChecked: new Date(),
      };

      // Exact formatted log required by project directive
      console.warn(
        `[TrustPassz-Mobile] 🔴 MẤT KẾT NỐI SERVER: ${errorMessage}. Vui lòng kiểm tra file .env và địa chỉ IP.`,
      );

      this.notify();
      return this.getState();
    }
  }
}

export const healthService = HealthService.getInstance();

