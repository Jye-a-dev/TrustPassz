import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Singleton Supabase Client configuration for Realtime Deal Room subscriptions.
 * Utilizes Next.js public environment variables with resilient fallback defaults.
 */
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://trustpassz-escrow.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-anon-key";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();
