
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

// Add reports table to the list of known tables
type KnownTable = 
  | "projects" 
  | "profiles" 
  | "resources" 
  | "tasks" 
  | "documents" 
  | "financial_transactions" 
  | "invoices" 
  | "issues" 
  | "notifications" 
  | "resource_allocations" 
  | "schedule_events" 
  | "task_assignments" 
  | "task_resources" 
  | "team_invitations" 
  | "team_members" 
  | "user_roles"
  | "reports";

// Extend PostgresQueryBuilder to properly handle known tables
declare module '@supabase/supabase-js' {
  interface PostgrestQueryBuilder<Schema> {
    from<TableName extends KnownTable>(relation: TableName): PostgrestQueryBuilder<Schema>;
  }
}
