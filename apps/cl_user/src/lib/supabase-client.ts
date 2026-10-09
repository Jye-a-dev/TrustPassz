import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Singleton Supabase Client configuration for Realtime Deal Room subscriptions.
 * Resiliently checks whether live Supabase credentials are provided. If running
 * with fallback or mock keys ("mock-anon-key", dummy URLs), it gracefully uses
 * an in-memory client to prevent WebSocket connection failures in the browser console.
 */
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isLiveConfig = Boolean(
  rawUrl &&
    rawKey &&
    !rawUrl.includes("trustpassz-escrow.supabase.co") &&
    rawKey !== "mock-anon-key" &&
    rawKey !== "your-public-supabase-anon-key",
);

class MockRealtimeChannel {
  topic: string;
  private listeners: Map<string, Array<(payload: any) => void>> = new Map();

  constructor(topic: string) {
    this.topic = topic;
  }

  on(_type: string, filter: { event: string }, callback: (payload: any) => void): this {
    const event = filter.event;
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    return this;
  }

  subscribe(callback?: (status: "SUBSCRIBED" | "CLOSED" | "CHANNEL_ERROR") => void): this {
    if (callback) {
      setTimeout(() => callback("SUBSCRIBED"), 0);
    }
    return this;
  }

  async send(data: { type: string; event: string; payload: any }): Promise<"ok" | "error"> {
    const list = this.listeners.get(data.event);
    if (list) {
      list.forEach((cb) => {
        try {
          cb({ payload: data.payload, event: data.event, type: data.type });
        } catch {}
      });
    }
    return "ok";
  }

  unsubscribe(): Promise<"ok"> {
    this.listeners.clear();
    return Promise.resolve("ok");
  }
}

function createMockSupabaseClient(): SupabaseClient {
  const channels = new Map<string, MockRealtimeChannel>();

  const mockClient = {
    channel(name: string, _opts?: any) {
      if (!channels.has(name)) {
        channels.set(name, new MockRealtimeChannel(name));
      }
      return channels.get(name)!;
    },
    removeChannel(channel: any) {
      const topic = channel?.topic;
      if (topic) {
        channels.delete(topic);
      }
      return Promise.resolve("ok");
    },
    removeAllChannels() {
      channels.clear();
      return Promise.resolve([]);
    },
    getChannels() {
      return Array.from(channels.values());
    },
    auth: {
      async getSession() {
        return { data: { session: null }, error: null };
      },
      onAuthStateChange() {
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
  };

  return mockClient as unknown as SupabaseClient;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    if (isLiveConfig) {
      supabaseInstance = createClient(rawUrl, rawKey, {
        realtime: {
          params: {
            eventsPerSecond: 20,
          },
        },
        auth: {
          persistSession: typeof window !== "undefined",
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } else {
      supabaseInstance = createMockSupabaseClient();
    }
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();
