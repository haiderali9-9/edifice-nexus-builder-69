
// src/integrations/supabase/client.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://clowkphpdyuamzscmztv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsb3drcGhwZHl1YW16c2NtenR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1MzYxNzUsImV4cCI6MjA2MDExMjE3NX0.77tk7GP5CBQTaYxWSw82AzwJfTfG-G2mkorlXz5U1Ys";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage
  }
});

// Also export as supabaseClient for backward compatibility
export const supabaseClient = supabase;
