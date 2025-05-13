
-- Function to add a user role
CREATE OR REPLACE FUNCTION public.add_user_role(user_id_param uuid, role_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the role, ignore if it already exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id_param, role_param)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Also ensure user_roles table exists with proper constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user_roles') THEN
    CREATE TABLE public.user_roles (
      id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      role text NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      UNIQUE (user_id, role)
    );
    
    -- Add RLS policies
    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
    
    -- Allow authenticated users to read their own roles
    CREATE POLICY user_roles_select_policy ON public.user_roles
      FOR SELECT USING (auth.uid() = user_id);
      
    -- Allow admins to read all roles
    CREATE POLICY admins_read_all_roles ON public.user_roles
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
      
    -- Allow admins to insert roles
    CREATE POLICY admins_insert_roles ON public.user_roles
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;
