
// Re-export supabase client from the integrations directory
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/types/supabase';

// Type-safe client
export const typedSupabase = supabase;

// Create a default admin user (email: admin@edifice.com, password: Admin123!)
async function createDefaultAdmin() {
  try {
    // Check if admin user exists first
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Sign up the admin user
      const { data, error } = await supabase.auth.signUp({
        email: 'admin@edifice.com',
        password: 'Admin123!',
        options: {
          data: {
            first_name: 'Admin',
            last_name: 'User',
          }
        }
      });
      
      if (error) {
        console.error('Error creating admin user:', error);
        return;
      }
      
      if (data.user) {
        // Set the admin role for this user
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: 'admin'
          });
          
        if (roleError) {
          console.error('Error setting admin role:', roleError);
        } else {
          console.log('Default admin created successfully');
        }
      }
    }
  } catch (err) {
    console.error('Error in admin creation:', err);
  }
}

// Uncomment this line to create the admin user when needed
// createDefaultAdmin();

export { supabase };
