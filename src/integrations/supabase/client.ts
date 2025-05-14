
import { createClient } from "@supabase/supabase-js";

// Check for environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://clowkphpdyuamzscmztv.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";

// Create the Supabase client
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
