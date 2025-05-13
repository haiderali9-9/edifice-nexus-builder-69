
import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Task } from '@/types';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import TaskNode from './TaskNode';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Save, ZoomIn, ZoomOut, CornerUpLeft } from 'lucide-react';

// Define node types
const nodeTypes = {
  taskNode: TaskNode,
};

interface ProjectWorkflowProps {
  projectId: string;
  tasks: Task[];
  onWorkflowSaved?: () => void;
}

type WorkflowNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { task: Task };
};

type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  markerEnd: {
    type: MarkerType;
  };
  animated?: boolean;
};

const ProjectWorkflow: React.FC<ProjectWorkflowProps> = ({ projectId, tasks, onWorkflowSaved }) => {
  const { toast } = useToast();

  // Create initial nodes from tasks
  const createInitialNodes = (): WorkflowNode[] => {
    return tasks.map((task, index) => ({
      id: task.id,
      type: 'taskNode',
      position: { x: 100, y: 100 + (index * 150) },
      data: { task },
    }));
  };

  // Create initial edges from task dependencies
  const createInitialEdges = async (): Promise<WorkflowEdge[]> => {
    try {
      const { data: dependencies, error } = await supabase
        .from('task_dependencies')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      
      return (dependencies || []).map((dep) => ({
        id: `e-${dep.source_task_id}-${dep.target_task_id}`,
        source: dep.source_task_id,
        target: dep.target_task_id,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        animated: true,
      }));
    } catch (err) {
      console.error('Error loading task dependencies:', err);
      return [];
    }
  };

  // Set up nodes and edges states
  const [nodes, setNodes, onNodesChange] = useNodesState(createInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load initial edges on component mount
  React.useEffect(() => {
    createInitialEdges().then(initialEdges => {
      setEdges(initialEdges);
    });
  }, [projectId, tasks]);

  // Handle new connections between nodes
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({
      ...connection,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      animated: true
    }, eds)),
    [setEdges]
  );

  // Save the workflow task dependencies
  const saveWorkflow = async () => {
    try {
      // First delete all existing dependencies for this project
      const { error: deleteError } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('project_id', projectId);
      
      if (deleteError) throw deleteError;
      
      // Create dependency records from edges
      const dependencies = edges.map(edge => ({
        project_id: projectId,
        source_task_id: edge.source,
        target_task_id: edge.target,
        created_at: new Date().toISOString(),
      }));
      
      // Skip if no dependencies to create
      if (dependencies.length === 0) {
        toast({
          title: "Workflow Saved",
          description: "Task workflow has been updated with no dependencies.",
        });
        if (onWorkflowSaved) onWorkflowSaved();
        return;
      }
      
      // Insert new dependencies
      const { error: insertError } = await supabase
        .from('task_dependencies')
        .insert(dependencies);
      
      if (insertError) throw insertError;
      
      toast({
        title: "Workflow Saved",
        description: `Task workflow saved with ${dependencies.length} task dependencies.`,
      });
      
      if (onWorkflowSaved) onWorkflowSaved();
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast({
        title: "Error",
        description: "Failed to save workflow. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="h-[600px]">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle>Task Workflow</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setNodes(createInitialNodes())}>
            <CornerUpLeft className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button size="sm" onClick={saveWorkflow}>
            <Save className="h-4 w-4 mr-2" />
            Save Workflow
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-[550px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      </CardContent>
    </Card>
  );
};

export default ProjectWorkflow;
