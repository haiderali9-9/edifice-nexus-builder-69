
// Re-export supabase client from the integrations directory
import { supabase } from "@/integrations/supabase/client";
import { Database } from '@/types/supabase';

// Type-safe client
export const typedSupabase = supabase as unknown as ReturnType<typeof supabase.from> & {
  rpc: <T = any>(fn: string, params?: object) => Promise<{ data: T | null; error: Error | null }>;
};

export { supabase };
