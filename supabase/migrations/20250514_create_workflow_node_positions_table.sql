
-- Create the workflow_node_positions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.workflow_node_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    position_x NUMERIC NOT NULL DEFAULT 0,
    position_y NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(project_id, task_id)
);

-- Enable row level security
ALTER TABLE public.workflow_node_positions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to view node positions
CREATE POLICY "Allow authenticated users to view node positions" 
ON public.workflow_node_positions 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policy to allow authenticated users to insert node positions
CREATE POLICY "Allow authenticated users to insert node positions" 
ON public.workflow_node_positions 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create policy to allow authenticated users to update node positions
CREATE POLICY "Allow authenticated users to update node positions" 
ON public.workflow_node_positions 
FOR UPDATE 
TO authenticated 
USING (true);
