// Re-export supabase client from the integrations directory
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/types/supabase';

// Type-safe client
export const typedSupabase = supabase;

// Create a default admin user (email: admin@edifice.com, password: Admin123!)
async function createDefaultAdmin() {
  try {
    // Check if admin user exists first
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@edifice.com')
      .maybeSingle();
    
    // If admin profile exists, we can skip the creation process
    if (data) {
      console.log("Admin profile already exists");
      return;
    }
    
    console.log("Admin profile not found, creating one...");
    
    // Try to sign up the admin user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@edifice.com',
      password: 'Admin123!',
      options: {
        data: {
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin'
        }
      }
    });
    
    if (signUpError) {
      // If the error is not due to rate limiting or existing user, log it
      if (!signUpError.message.includes('security purposes') && 
          !signUpError.message.includes('already registered')) {
        console.error("Error creating admin account:", signUpError);
      }
      
      // Try to sign in instead to check if user exists
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@edifice.com',
        password: 'Admin123!'
      });
      
      if (signInData?.user) {
        // User exists, ensure they have a profile and admin role
        await ensureAdminProfile(signInData.user.id);
        await supabase.auth.signOut();
      } else if (signInError) {
        // If it's not just "email not confirmed", log the error
        if (!signInError.message.includes('Email not confirmed')) {
          console.error("Error signing in to admin:", signInError);
        }
      }
    } else if (signUpData?.user) {
      // User created, create admin profile
      await ensureAdminProfile(signUpData.user.id);
    }
  } catch (err) {
    console.error('Error in admin creation:', err);
  }
}

// Helper function to ensure admin profile and role exists
async function ensureAdminProfile(userId: string) {
  try {
    // Create or update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@edifice.com',
        role: 'admin',
        is_active: true,
        is_email_confirmed: true
      }, { onConflict: 'id' });
    
    if (profileError) {
      console.error('Error creating admin profile:', profileError);
    }
    
    // Ensure admin role exists
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'admin'
      }, { onConflict: 'user_id, role' });
    
    if (roleError && roleError.code !== '23505') { // Ignore duplicate key errors
      console.error('Error setting admin role:', roleError);
    }
  } catch (error) {
    console.error('Error ensuring admin profile:', error);
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
