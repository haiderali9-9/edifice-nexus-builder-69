
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with the project URL and anon key
export const supabase = createClient(
  'https://clowkphpdyuamzscmztv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsb3drcGhwZHl1YW16c2NtenR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1MzYxNzUsImV4cCI6MjA2MDExMjE3NX0.77tk7GP5CBQTaYxWSw82AzwJfTfG-G2mkorlXz5U1Ys'
);
