
import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Check for environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://clowkphpdyuamzscmztv.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsb3drcGhwZHl1YW16c2NtenR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1MzYxNzUsImV4cCI6MjA2MDExMjE3NX0.77tk7GP5CBQTaYxWSw82AzwJfTfG-G2mkorlXz5U1Ys";

// Create the Supabase client with configuration
export const supabase: SupabaseClient = supabaseCreateClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage
  }
});

// Also export as supabaseClient for backward compatibility if needed
export const supabaseClient = supabase;
