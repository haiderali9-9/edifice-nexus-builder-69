
import React, { useState, useCallback, useRef } from 'react';
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
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Task } from '@/types';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import TaskNode from './TaskNode';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { 
  Save, 
  ZoomIn, 
  ZoomOut, 
  CornerUpLeft, 
  ChevronRight, 
  Info 
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  data: { 
    task: Task;
    connectionCondition?: string;
  };
};

type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  markerEnd: {
    type: MarkerType;
  };
  animated?: boolean;
  label?: string;
  style?: React.CSSProperties;
  data?: {
    condition?: string;
    type?: 'success' | 'conditional' | 'default';
  };
};

type ConnectionType = 'success' | 'conditional' | 'default';

const ProjectWorkflow: React.FC<ProjectWorkflowProps> = ({ projectId, tasks, onWorkflowSaved }) => {
  const { toast } = useToast();
  const reactFlowInstance = useReactFlow();
  const [selectedConnection, setSelectedConnection] = useState<{
    source: string;
    target: string;
    type: ConnectionType;
    condition?: string;
  } | null>(null);
  
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
      
      return (dependencies || []).map((dep) => {
        // Determine the edge type and style based on the condition
        let edgeStyle: React.CSSProperties = {};
        let sourceHandle = 'source-success';
        let animated = true;
        
        if (dep.condition) {
          sourceHandle = 'source-conditional';
          edgeStyle = { stroke: '#F59E0B' };
        }
        
        return {
          id: `e-${dep.source_task_id}-${dep.target_task_id}`,
          source: dep.source_task_id,
          target: dep.target_task_id,
          sourceHandle: sourceHandle,
          targetHandle: 'target-default',
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          animated,
          style: edgeStyle,
          label: dep.condition || undefined,
          data: {
            condition: dep.condition || undefined,
            type: dep.condition ? 'conditional' : 'success'
          }
        };
      });
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
    (connection: Connection) => {
      // Store the connection details for the dialog
      setSelectedConnection({
        source: connection.source || '',
        target: connection.target || '',
        type: (connection.sourceHandle?.includes('conditional') ? 'conditional' : 'success') as ConnectionType,
      });
    },
    []
  );

  // Handle creating new connection with condition
  const handleCreateConnection = () => {
    if (!selectedConnection) return;
    
    const { source, target, type, condition } = selectedConnection;
    
    const edgeId = `e-${source}-${target}`;
    const sourceHandle = type === 'conditional' ? 'source-conditional' : 'source-success';
    const edgeStyle = type === 'conditional' ? { stroke: '#F59E0B' } : undefined;
    
    const newEdge: Edge = {
      id: edgeId,
      source,
      target,
      sourceHandle,
      targetHandle: 'target-default',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      style: edgeStyle,
      data: {
        condition,
        type
      }
    };
    
    if (condition) {
      newEdge.label = condition;
    }
    
    setEdges(eds => addEdge(newEdge, eds));
    setSelectedConnection(null);
  };

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
        condition: edge.data?.condition || null,
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
          <Panel position="top-left" className="bg-white p-2 rounded-md shadow-sm border border-gray-200">
            <div className="flex flex-col gap-2 text-xs">
              <div className="font-medium">Connection Types:</div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span>Success Path (Bottom)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span>Conditional Path (Right)</span>
              </div>
            </div>
          </Panel>
          <Controls />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      </CardContent>

      {/* Connection Configuration Dialog */}
      <Dialog open={!!selectedConnection} onOpenChange={(open) => !open && setSelectedConnection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Connection</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center mb-4">
              <div className="w-2/5">
                <Label htmlFor="connection-type">Connection Type</Label>
                <Select 
                  value={selectedConnection?.type || 'success'} 
                  onValueChange={(value) => 
                    setSelectedConnection(prev => 
                      prev ? { ...prev, type: value as ConnectionType } : null
                    )
                  }
                >
                  <SelectTrigger id="connection-type" className="mt-2">
                    <SelectValue placeholder="Select connection type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">Success Path</SelectItem>
                    <SelectItem value="conditional">Conditional Path</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <ChevronRight className="mx-4 text-gray-400" />
              
              <div className="w-2/5">
                <div className="text-sm font-medium">Target Task</div>
                <div className="mt-2 text-sm p-2 border rounded-md">
                  {tasks.find(t => t.id === selectedConnection?.target)?.name || 'Unknown Task'}
                </div>
              </div>
            </div>
            
            {selectedConnection?.type === 'conditional' && (
              <div className="mb-4">
                <Label htmlFor="condition">Condition</Label>
                <Input
                  id="condition"
                  value={selectedConnection.condition || ''}
                  onChange={(e) => 
                    setSelectedConnection(prev => 
                      prev ? { ...prev, condition: e.target.value } : null
                    )
                  }
                  placeholder="e.g., If status = Delayed, If priority = Critical"
                  className="mt-2"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateConnection}>Create Connection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProjectWorkflow;
