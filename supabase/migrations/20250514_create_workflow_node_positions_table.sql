
CREATE TABLE IF NOT EXISTS public.workflow_node_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    task_id UUID NOT NULL,
    position_x FLOAT NOT NULL,
    position_y FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (project_id, task_id)
);

-- Add RLS policies
ALTER TABLE public.workflow_node_positions ENABLE ROW LEVEL SECURITY;

-- Create policy for full access
CREATE POLICY "Full access to authenticated users"
ON public.workflow_node_positions
FOR ALL
TO authenticated
USING (true);

-- Add foreign keys
ALTER TABLE public.workflow_node_positions
    ADD CONSTRAINT fk_workflow_node_positions_project
    FOREIGN KEY (project_id)
    REFERENCES public.projects(id)
    ON DELETE CASCADE;

ALTER TABLE public.workflow_node_positions
    ADD CONSTRAINT fk_workflow_node_positions_task
    FOREIGN KEY (task_id)
    REFERENCES public.tasks(id)
    ON DELETE CASCADE;

-- Comment on table
COMMENT ON TABLE public.workflow_node_positions IS 'Stores position information for task nodes in project workflow diagrams';
