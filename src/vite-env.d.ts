
/// <reference types="vite/client" />

// Add declarations for Supabase RPC functions
interface PostgrestRPCResponse<T> {
  data: T | null;
  error: Error | null;
}

declare global {
  interface SupabaseClient {
    rpc<T = any>(fn: string, params?: object): Promise<PostgrestRPCResponse<T>>;
  }
}
