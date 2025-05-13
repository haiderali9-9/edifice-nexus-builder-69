
-- Create function to add user roles (bypassing RLS)
CREATE OR REPLACE FUNCTION public.add_user_role(user_id_param UUID, role_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id_param, role_param)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Function to create needed table and constraints if they don't exist
CREATE OR REPLACE FUNCTION public.create_add_user_role_function()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create the user_roles table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
  
  -- Ensure user_roles has a unique constraint on (user_id, role)
  ALTER TABLE IF EXISTS public.user_roles
  ADD CONSTRAINT IF NOT EXISTS user_role_unique UNIQUE (user_id, role);
  
  RETURN TRUE;
END;
$$;
