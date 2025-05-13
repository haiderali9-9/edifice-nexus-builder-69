
-- Add is_active column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'is_active') THEN
    ALTER TABLE public.profiles ADD COLUMN is_active boolean DEFAULT false;
  END IF;
END $$;

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First check if the user_roles table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'user_roles') THEN
    -- Check if the current user has the admin role in user_roles
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    );
  ELSE
    -- Fallback: check if the user has role='admin' in profiles table
    RETURN EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    );
  END IF;
END;
$$;

-- Create user_roles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user_roles') THEN
    CREATE TABLE public.user_roles (
      id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id uuid REFERENCES auth.users(id) NOT NULL,
      role text NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      UNIQUE (user_id, role)
    );
  END IF;
END $$;

-- Ensure RLS is enabled for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for user_roles
DO $$
BEGIN
  -- Check if the policy exists before trying to create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles' 
    AND policyname = 'admins_can_read_all_roles'
  ) THEN
    CREATE POLICY admins_can_read_all_roles ON public.user_roles
      FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;
