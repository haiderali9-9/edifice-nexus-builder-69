import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/types/supabase';
import type { User, Session } from '@supabase/auth-helpers-nextjs';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url: string | null;
  email: string | null;
  phone?: string | null;
  position?: string | null;
  department?: string | null;
  is_active?: boolean;
}

// Define Session and User types based on what Supabase returns
type User = {
  id: string;
  aud: string;
  role: string;
  email: string;
  email_confirmed_at: string;
  phone: string;
  confirmation_sent_at: string;
  confirmed_at: string;
  last_sign_in_at: string;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: {
    email: string;
    email_verified: boolean;
    first_name: string;
    last_name: string;
    phone_verified: boolean;
    sub: string;
  };
  identities: Array<any>;
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
};

type Session = {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: User;
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define admin credentials
const ADMIN_EMAIL = "admin@edifice.com";
const ADMIN_PASSWORD = "Admin123!";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Function to check if the user is an admin
  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('is_admin');
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      setIsAdmin(Boolean(data));
      return Boolean(data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST to avoid auth deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          try {
            // Use setTimeout to avoid potential auth deadlocks
            setTimeout(() => {
              fetchProfile(currentSession.user.id).catch(console.error);
              checkAdminStatus(currentSession.user.id).catch(console.error);
            }, 0);
          } catch (error) {
            console.error('Error in auth change handler:', error);
          } finally {
            setIsLoading(false);
          }
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id)
          .catch(error => {
            console.error('Error fetching profile during initial load:', error);
          })
          .finally(() => {
            setIsLoading(false);
          });
        checkAdminStatus(currentSession.user.id).catch(console.error);
      } else {
        setIsLoading(false);
      }
    }).catch(error => {
      console.error('Error getting auth session:', error);
      setIsLoading(false);
    });

    // Create admin account on startup if it doesn't exist
    createAdminAccount().catch(console.error);

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Function to create admin account if it doesn't exist
  async function createAdminAccount() {
    try {
      console.log("Checking for admin account...");
      
      // First check if admin user exists
      const { data: adminSignIn, error: checkError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });
      
      if (checkError && checkError.message !== "Invalid login credentials") {
        console.error("Error checking admin account:", checkError);
      }
      
      // If admin already exists and can sign in, we're done
      if (adminSignIn?.user) {
        console.log("Admin account exists");
        
        // Ensure the admin email is confirmed
        if (!adminSignIn.user.email_confirmed_at) {
          // Update user to confirm email directly in the auth.users table
          // This requires service role access
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            adminSignIn.user.id,
            { email_confirmed: true }
          );
          
          if (updateError) {
            console.error("Error confirming admin email:", updateError);
          } else {
            console.log("Admin email confirmed successfully");
          }
        }
        
        // Sign out immediately after checking
        await supabase.auth.signOut();
        return;
      }
      
      console.log("Creating admin account...");
      
      // Create admin account
      const { data: adminData, error: createError } = await supabase.auth.signUp({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        options: {
          data: {
            first_name: 'Admin',
            last_name: 'User',
          },
          emailRedirectTo: window.location.origin
        }
      });
      
      if (createError) {
        console.error("Error creating admin account:", createError);
        return;
      }
      
      if (adminData.user) {
        console.log("Admin account created successfully");
        
        // Confirm admin's email automatically
        const { error: confirmError } = await supabase.auth.admin.updateUserById(
          adminData.user.id,
          { email_confirmed: true }
        );
        
        if (confirmError) {
          console.error("Error confirming admin email:", confirmError);
        } else {
          console.log("Admin email confirmed successfully");
        }
        
        // Create admin profile with is_active set to true
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: adminData.user.id,
            first_name: 'Admin',
            last_name: 'User',
            email: ADMIN_EMAIL,
            role: 'admin',
            is_active: true
          });
          
        if (profileError) {
          console.error('Error creating admin profile:', profileError);
        }
        
        // Add admin role using RPC
        const { error: roleError } = await supabase
          .rpc('add_user_role', {
            user_id_param: adminData.user.id,
            role_param: 'admin'
          });
          
        if (roleError) {
          console.error('Error setting admin role:', roleError);
        }
        
        // Sign out immediately after creating admin
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error("Error in admin account creation:", error);
    }
  }

  async function fetchProfile(userId: string) {
    try {
      console.log('Fetching profile for user:', userId);
      
      // First, check if the user is an admin
      const isUserAdmin = await checkAdminStatus(userId);
      
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        console.error('Supabase error fetching profile:', profileError);
        
        // If profile doesn't exist, create one
        if (profileError.code === 'PGRST116') { // No rows returned
          await createProfile(userId);
          return;
        }
        throw profileError;
      }
      
      if (existingProfile) {
        console.log('Found existing profile:', existingProfile);

        // Special handling for admin@edifice.com - always active and admin
        const isMainAdmin = existingProfile.email === ADMIN_EMAIL;

        // Check if user is active or is an admin (admins bypass approval)
        if (existingProfile.is_active === false && !isUserAdmin && !isMainAdmin) {
          toast({
            title: 'Account Pending Approval',
            description: 'Your account is pending approval from an administrator.',
            variant: 'destructive',
          });
          await signOut();
          return;
        }

        // If they are an admin but not active, make them active
        if ((isUserAdmin || isMainAdmin) && existingProfile.is_active === false) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_active: true })
            .eq('id', userId);
            
          if (updateError) {
            console.error('Error updating admin profile to active:', updateError);
          }
          
          // Update the local profile
          setProfile({
            ...existingProfile as unknown as UserProfile,
            is_active: true,
          });
        } else {
          setProfile(existingProfile as unknown as UserProfile);
        }
      } else {
        console.warn('No profile found for user:', userId);
        await createProfile(userId);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Don't throw again, just log
    }
  }

  async function createProfile(userId: string) {
    try {
      // Get user data
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        console.error('Could not find user data for profile creation');
        return;
      }
      
      // Check if this is the admin account
      const isMainAdmin = userData.user.email === ADMIN_EMAIL;
      
      // Check if the user is first user (to make them admin) or determine if they're already an admin
      const { count: userCount, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      // If this is the first user in the system, main admin, or they're already an admin, make them active automatically
      const isFirstUser = (!countError && userCount === 0);
      const isUserAdmin = await checkAdminStatus(userId) || isMainAdmin;
      const shouldBeActive = isFirstUser || isMainAdmin;
      
      // Create the profile with is_active set appropriately
      const newProfile = {
        id: userId,
        first_name: userData.user.user_metadata?.first_name || '',
        last_name: userData.user.user_metadata?.last_name || '',
        email: userData.user.email,
        role: isFirstUser || isMainAdmin ? 'admin' : 'user',  // First user or main admin gets admin role
        avatar_url: null,
        is_active: shouldBeActive // Active if first user or admin
      };
      
      console.log('Creating new profile:', newProfile);
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert(newProfile);
        
      if (insertError) {
        console.error('Error creating profile:', insertError);
        // Don't throw again, continue with the code
      }
      
      // If this is the first user or main admin, make them an admin
      if (isFirstUser || isMainAdmin) {
        // Add admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'admin'
          });
          
        if (roleError && roleError.code !== '23505') { // Ignore unique violation errors
          console.error('Error adding admin role:', roleError);
        }
        
        setProfile(newProfile as UserProfile);
        setIsAdmin(true);
        
        toast({
          title: 'Account Created',
          description: 'Your administrator account has been set up successfully.',
          duration: 6000,
        });
      } else if (shouldBeActive) {
        // For regular users who are already admins
        setProfile(newProfile as UserProfile);
        setIsAdmin(true);
        
        toast({
          title: 'Account Created',
          description: 'Your account has been set up successfully.',
          duration: 6000,
        });
      } else {
        // For regular users, show the pending approval message
        toast({
          title: 'Registration Complete',
          description: 'Your account has been created but requires admin approval. You will be notified when your account is approved.',
          duration: 6000,
        });
        
        // Sign out the user after registration since they need approval
        await signOut();
      }
      
      console.log('Profile created successfully');
    } catch (error) {
      console.error('Error in profile creation:', error);
      // Just log the error, don't throw it again
    }
  }

  async function refreshProfile(): Promise<void> {
    if (user) {
      try {
        await fetchProfile(user.id);
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        // Special handling for admin user if email not confirmed error
        if (email === ADMIN_EMAIL && error.message.includes("Email not confirmed")) {
          // Try to confirm the email automatically for admin
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            const { error: confirmError } = await supabase.auth.admin.updateUserById(
              userData.user.id,
              { email_confirmed: true }
            );
            
            if (confirmError) {
              console.error("Error confirming admin email:", confirmError);
            } else {
              // Try signing in again
              const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({ 
                email, 
                password 
              });
              
              if (retryError) {
                toast({
                  title: 'Error signing in',
                  description: retryError.message,
                  variant: 'destructive',
                });
                setIsLoading(false);
                return;
              }
              
              // Successful retry
              console.log("Sign-in successful after confirming email:", retryData);
              return;
            }
          }
        }
        
        console.error("Sign-in error:", error);
        toast({
          title: 'Error signing in',
          description: error.message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Authentication successful, profile fetch happens in the onAuthStateChange listener
      console.log("Sign-in successful:", data);
      
      // Redirect happens in useEffect after successfully fetching profile
    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: 'Error signing in',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  }

  async function signUp(email: string, password: string, firstName: string, lastName: string) {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: window.location.origin + '/auth' // Ensure proper redirect after verification
        }
      });
      
      if (error) {
        toast({
          title: 'Error creating account',
          description: error.message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      toast({
        title: 'Verification Email Sent!',
        description: 'Please check your inbox and verify your email. After verification, an administrator will need to approve your account.',
        duration: 6000,
      });

      navigate('/auth');
      
    } catch (error: any) {
      toast({
        title: 'Error creating account',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Clear state
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(false);
      
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function updateProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      if (!user) throw new Error('No user logged in');
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  const value = {
    session,
    user,
    profile,
    isAdmin,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
