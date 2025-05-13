
-- Create a table to store workflow node positions
CREATE TABLE IF NOT EXISTS workflow_node_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    position_x FLOAT NOT NULL,
    position_y FLOAT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, task_id)
);

-- Add indexes for performance
CREATE INDEX idx_workflow_node_positions_project_id ON workflow_node_positions(project_id);
CREATE INDEX idx_workflow_node_positions_task_id ON workflow_node_positions(task_id);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON workflow_node_positions
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_updated_at();

-- Allow authenticated users to perform CRUD operations
ALTER TABLE workflow_node_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to select workflow_node_positions"
    ON workflow_node_positions
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert workflow_node_positions"
    ON workflow_node_positions
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update workflow_node_positions"
    ON workflow_node_positions
    FOR UPDATE
    USING (auth.role() = 'authenticated');
