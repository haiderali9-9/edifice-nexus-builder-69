
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

// Function to reset database to initial state
export async function resetDatabase() {
  try {
    // Clear existing data from tables
    // Delete from tables in order that won't violate foreign key constraints
    const tables = [
      'task_assignments',
      'task_resources',
      'tasks',
      'resource_allocations',
      'team_members',
      'documents',
      'financial_transactions',
      'invoices',
      'issues',
      'schedule_events',
      'reports',
      'notifications',
      'team_invitations',
      'projects',
      'resources'
    ];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
        
      if (error && error.message !== 'No rows found') {
        console.error(`Error clearing ${table}:`, error);
      }
    }
    
    // Re-create default admin user
    await createDefaultAdmin();
    
    return { success: true, message: 'Database reset successfully' };
  } catch (error) {
    console.error('Error resetting database:', error);
    return { success: false, message: 'Failed to reset database' };
  }
}

// Uncomment this line to create the admin user when needed
// createDefaultAdmin();

export { supabase };
