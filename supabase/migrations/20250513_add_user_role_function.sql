
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

-- Create function to be called from JavaScript to create the add_user_role function
CREATE OR REPLACE FUNCTION public.create_add_user_role_function()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure user_roles has a unique constraint on (user_id, role)
  ALTER TABLE IF EXISTS public.user_roles
  ADD CONSTRAINT IF NOT EXISTS user_role_unique UNIQUE (user_id, role);
  
  RETURN TRUE;
END;
$$;
