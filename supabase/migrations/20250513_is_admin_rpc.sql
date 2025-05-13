
-- Add RPC function to check if current user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_has_role boolean;
BEGIN
  -- Check if the current user has the admin role
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO user_has_role;
  
  RETURN user_has_role;
END;
$$;
