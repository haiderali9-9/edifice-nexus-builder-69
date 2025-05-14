
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// Define AuthResponse type inline since it's not directly exported
interface AuthResponse {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: Error | null;
}

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string | null;
  position?: string;
  department?: string;
  role?: string;
  [key: string]: any; // Allow for additional properties
}

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean; // Add isAdmin property 
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, userData?: any) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>; // Add updateProfile method
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
  signIn: async () => ({ data: { user: null, session: null }, error: null }) as AuthResponse,
  signUp: async () => ({ data: { user: null, session: null }, error: null }) as AuthResponse,
  signOut: async () => { },
  refreshSession: async () => { },
  updateProfile: async () => { }
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception while fetching profile:', error);
      return null;
    }
  };

  // Check if the user has admin role
  const checkAdminRole = async (userId: string) => {
    try {
      // Using RPC function created in migrations to check if user is admin
      const { data, error } = await supabase.rpc('is_admin');
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      return data || false;
    } catch (error) {
      console.error('Exception while checking admin role:', error);
      return false;
    }
  };

  // Update user profile
  const updateProfile = async (profileData: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...profileData } : null);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Initial session check
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        // Get session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session) {
          setSession(session);
          setUser(session.user);
          
          // Fetch profile
          if (session.user) {
            const profileData = await fetchUserProfile(session.user.id);
            setProfile(profileData);
            
            // Check if user is admin
            const adminStatus = await checkAdminRole(session.user.id);
            setIsAdmin(adminStatus);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.info('Auth state changed:', event);
        
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          const profileData = await fetchUserProfile(session.user.id);
          setProfile(profileData);
          
          // Check if user is admin
          const adminStatus = await checkAdminRole(session.user.id);
          setIsAdmin(adminStatus);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        
        setIsLoading(false);
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (response.error) {
        throw response.error;
      }

      return response;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      // Create the auth user
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        }
      });

      if (response.error) {
        throw response.error;
      }

      return response;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Force refresh session
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }
      
      setSession(data.session);
      setUser(data.session?.user || null);
      
      if (data.session?.user) {
        const profileData = await fetchUserProfile(data.session.user.id);
        setProfile(profileData);
        
        // Check if user is admin
        const adminStatus = await checkAdminRole(data.session.user.id);
        setIsAdmin(adminStatus);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  const value = {
    user,
    session,
    profile,
    isLoading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    refreshSession,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
