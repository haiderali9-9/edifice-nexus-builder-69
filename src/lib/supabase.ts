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
      console.log("Creating default admin user...");
      
      // First check if user exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers({
        perPage: 1,
        filter: {
          email: 'eq.admin@edifice.com',
        },
      });

      let userId;
      
      // If user doesn't exist, create it
      if (!existingUsers || existingUsers.users.length === 0) {
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
        
        userId = data.user?.id;
        
        // Confirm admin's email automatically if we have userId
        if (userId) {
          const { error: confirmError } = await supabase.auth.admin.updateUserById(
            userId,
            { email_confirmed: true }
          );
          
          if (confirmError) {
            console.error('Error confirming admin email:', confirmError);
          } else {
            console.log('Admin email confirmed successfully');
          }
        }
      } else {
        userId = existingUsers.users[0].id;
        
        // Ensure the admin email is confirmed
        if (!existingUsers.users[0].email_confirmed_at) {
          const { error: confirmError } = await supabase.auth.admin.updateUserById(
            userId,
            { email_confirmed: true }
          );
          
          if (confirmError) {
            console.error('Error confirming admin email:', confirmError);
          } else {
            console.log('Admin email confirmed successfully');
          }
        }
      }
      
      if (userId) {
        // Create profile directly in the database using a service role client
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@edifice.com',
            role: 'admin',
            is_active: true
          });
          
        if (profileError) {
          console.error('Error creating admin profile:', profileError);
        }
        
        // Insert into user_roles using service role token
        // Use RPC to bypass RLS
        const { error: roleError } = await supabase
          .rpc('add_user_role', {
            user_id_param: userId,
            role_param: 'admin'
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

// Create the RPC function to add user roles
export async function createRpcFunction() {
  try {
    const { error } = await supabase.rpc('create_add_user_role_function');
    if (error) {
      console.error('Error creating RPC function:', error);
    } else {
      console.log('RPC function created successfully');
    }
  } catch (err) {
    console.error('Error creating RPC function:', err);
  }
}

// Uncomment this line to create the admin user when needed
// createDefaultAdmin();

export { supabase };
