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
      
      // Check if the user already exists
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@edifice.com',
        password: 'Admin123!'
      });
      
      if (error && error.message === 'Email not confirmed') {
        // User exists but email not confirmed - get the user
        const { data: userData } = await supabase.auth.signUp({
          email: 'admin@edifice.com',
          password: 'Admin123!',
          options: {
            data: {
              first_name: 'Admin',
              last_name: 'User',
              email_confirmed: true // Explicitly set confirmed flag
            }
          }
        });
        
        if (userData?.user) {
          // Create or update the profile with special admin confirmation flag
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: userData.user.id,
              first_name: 'Admin',
              last_name: 'User',
              email: 'admin@edifice.com',
              role: 'admin',
              is_active: true,
              is_email_confirmed: true // Special flag to bypass email confirmation
            }, { onConflict: 'id' });
            
          if (profileError) {
            console.error('Error creating admin profile:', profileError);
          } else {
            console.log('Admin profile created with confirmation flag');
          }
          
          // Insert into user_roles
          const { error: roleError } = await supabase
            .from('user_roles')
            .upsert({
              user_id: userData.user.id,
              role: 'admin'
            }, { onConflict: 'user_id' });
            
          if (roleError && roleError.code !== '23505') {
            console.error('Error setting admin role:', roleError);
          }
          
          // Try signing in now that we've confirmed the email
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'admin@edifice.com',
            password: 'Admin123!'
          });
          
          if (signInError) {
            console.error('Admin sign-in after setup still failing:', signInError);
            
            // Try updating user data directly
            await supabase.auth.updateUser({
              data: { email_confirmed: true }
            });
          }
        }
      } else if (error && error.message !== 'Invalid login credentials') {
        console.error("Error checking admin account:", error);
      } else if (data?.user) {
        // User exists and can sign in, make sure profile exists
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profileError || !profileData) {
          // Create profile if it doesn't exist
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              first_name: 'Admin',
              last_name: 'User',
              email: 'admin@edifice.com',
              role: 'admin',
              is_active: true,
              is_email_confirmed: true
            });
            
          if (insertError) {
            console.error('Error creating admin profile:', insertError);
          }
        }
        
        // Make sure user has admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: data.user.id,
            role: 'admin'
          }, { onConflict: 'user_id' });
          
        if (roleError && roleError.code !== '23505') {
          console.error('Error setting admin role:', roleError);
        }
        
        // Sign out after checking
        await supabase.auth.signOut();
      } else {
        // Admin doesn't exist, create it
        const { data: adminData, error: createError } = await supabase.auth.signUp({
          email: 'admin@edifice.com',
          password: 'Admin123!',
          options: {
            data: {
              first_name: 'Admin',
              last_name: 'User',
              email_confirmed: true  // Set this explicitly
            }
          }
        });
        
        if (createError) {
          console.error("Error creating admin account:", createError);
          return;
        }
        
        if (adminData?.user) {
          // Create profile with special admin confirmation flag
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: adminData.user.id,
              first_name: 'Admin',
              last_name: 'User',
              email: 'admin@edifice.com',
              role: 'admin',
              is_active: true,
              is_email_confirmed: true // Special flag to bypass email confirmation
            });
            
          if (profileError) {
            console.error('Error creating admin profile:', profileError);
          }
          
          // Insert into user_roles
          const { error: roleError } = await supabase
            .from('user_roles')
            .upsert({
              user_id: adminData.user.id,
              role: 'admin'
            });
            
          if (roleError) {
            console.error('Error setting admin role:', roleError);
          }
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

// Run this on startup to ensure admin user exists AND create the RPC function
createDefaultAdmin();
createRpcFunction();

export { supabase };
