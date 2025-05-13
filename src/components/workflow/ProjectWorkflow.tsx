
import React, { useState, useCallback, useEffect } from 'react';
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
  NodeChange,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Task } from '@/types';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import TaskNode from './TaskNode';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { 
  Save, 
  ZoomIn, 
  ZoomOut, 
  CornerUpLeft, 
  ChevronRight, 
  Info,
  CircleAlert,
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { cn } from '@/lib/utils';

// Define node types
const nodeTypes = {
  taskNode: TaskNode,
};

interface ProjectWorkflowProps {
  projectId: string;
  tasks: Task[];
  onWorkflowSaved?: () => void;
}

type WorkflowNode = Node<{ 
  task: Task;
  connectionCondition?: string;
}>;

type WorkflowEdge = Edge<{
  condition?: string;
  type?: 'success' | 'conditional' | 'default';
}>;

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
  const createInitialNodes = useCallback((): WorkflowNode[] => {
    return tasks.map((task, index) => ({
      id: task.id,
      type: 'taskNode',
      position: { x: 50, y: 100 + (index * 150) },
      data: { task },
    }));
  }, [tasks]);

  // Create initial edges from task dependencies
  const fetchDependencies = useCallback(async (): Promise<WorkflowEdge[]> => {
    try {
      const { data: dependencies, error } = await supabase
        .from('task_dependencies')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      
      if (!dependencies || dependencies.length === 0) {
        return [];
      }
      
      return dependencies.map((dep) => {
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
          sourceHandle,
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
  }, [projectId]);

  // Set up nodes and edges states
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Initialize nodes and edges on component mount
  useEffect(() => {
    const initialNodes = createInitialNodes();
    setNodes(initialNodes);
    
    fetchDependencies().then(initialEdges => {
      setEdges(initialEdges);
      // After loading edges, optimize layout
      setTimeout(optimizeLayout, 100);
    });
  }, [createInitialNodes, fetchDependencies, setNodes, setEdges]);
  
  // Optimize layout to show dependencies clearly
  const optimizeLayout = useCallback(() => {
    if (nodes.length === 0 || edges.length === 0) return;
    
    // Build dependency graph
    const dependencyMap = new Map<string, string[]>();
    const reverseDependencyMap = new Map<string, string[]>();
    
    edges.forEach(edge => {
      // Forward dependencies
      if (!dependencyMap.has(edge.source)) {
        dependencyMap.set(edge.source, []);
      }
      dependencyMap.get(edge.source)!.push(edge.target);
      
      // Reverse dependencies for layout
      if (!reverseDependencyMap.has(edge.target)) {
        reverseDependencyMap.set(edge.target, []);
      }
      reverseDependencyMap.get(edge.target)!.push(edge.source);
    });
    
    // Find root nodes (no incoming edges)
    const rootNodes = nodes
      .map(node => node.id)
      .filter(id => !reverseDependencyMap.has(id) || reverseDependencyMap.get(id)!.length === 0);
    
    // Assign levels to nodes (distance from root)
    const nodeLevels = new Map<string, number>();
    const assignLevels = (nodeId: string, level: number) => {
      // If node already has a level assigned, take the maximum
      if (nodeLevels.has(nodeId)) {
        nodeLevels.set(nodeId, Math.max(nodeLevels.get(nodeId)!, level));
      } else {
        nodeLevels.set(nodeId, level);
      }
      
      // Process children
      if (dependencyMap.has(nodeId)) {
        dependencyMap.get(nodeId)!.forEach(childId => {
          assignLevels(childId, level + 1);
        });
      }
    };
    
    // Start level assignment from root nodes
    rootNodes.forEach(rootId => assignLevels(rootId, 0));
    
    // For any nodes without levels (disconnected), assign level 0
    nodes.forEach(node => {
      if (!nodeLevels.has(node.id)) {
        nodeLevels.set(node.id, 0);
      }
    });
    
    // Group nodes by level
    const nodesByLevel = new Map<number, string[]>();
    nodeLevels.forEach((level, nodeId) => {
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(nodeId);
    });
    
    // Calculate positions based on levels
    const newNodes = [...nodes];
    const levelSpacing = 250; // Horizontal spacing between levels
    const nodeSpacing = 150;  // Vertical spacing between nodes at same level
    
    // Position nodes by level
    nodesByLevel.forEach((nodeIds, level) => {
      const levelX = level * levelSpacing + 50;
      
      nodeIds.forEach((nodeId, idx) => {
        const nodeIndex = newNodes.findIndex(n => n.id === nodeId);
        if (nodeIndex !== -1) {
          newNodes[nodeIndex] = {
            ...newNodes[nodeIndex],
            position: {
              x: levelX,
              y: idx * nodeSpacing + 50
            }
          };
        }
      });
    });
    
    setNodes(newNodes);
  }, [nodes, edges, setNodes]);

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
  const handleCreateConnection = useCallback(() => {
    if (!selectedConnection) return;
    
    const { source, target, type, condition } = selectedConnection;
    
    const edgeId = `e-${source}-${target}`;
    const sourceHandle = type === 'conditional' ? 'source-conditional' : 'source-success';
    const edgeStyle = type === 'conditional' ? { stroke: '#F59E0B' } : undefined;
    
    const newEdge: WorkflowEdge = {
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
      label: condition,
      data: {
        condition,
        type
      }
    };
    
    setEdges(eds => addEdge(newEdge, eds));
    setSelectedConnection(null);
    
    // Update layout after adding a new connection
    setTimeout(optimizeLayout, 100);
  }, [selectedConnection, setEdges, optimizeLayout]);

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
        <div>
          <CardTitle>Task Workflow</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Connect tasks to define dependencies and execution order
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={optimizeLayout}>
            <ZoomIn className="h-4 w-4 mr-2" />
            Auto Layout
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              const initialNodes = createInitialNodes();
              setNodes(initialNodes);
              setEdges([]);
            }}
          >
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
          minZoom={0.5}
          maxZoom={2}
        >
          <Panel position="top-left" className="bg-white p-3 rounded-md shadow-sm border border-gray-200 max-w-xs">
            <div className="flex flex-col gap-2 text-xs">
              <div className="font-medium text-sm border-b pb-1">Workflow Guide</div>
              <div className="space-y-2">
                <div>
                  <div className="font-medium">Connection Types:</div>
                  <div className="flex items-center mt-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span>Success Path (Bottom) - Tasks run in sequence</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span>Conditional Path (Right) - Tasks run if condition is met</span>
                  </div>
                </div>
                
                <div>
                  <div className="font-medium">Parallel Execution:</div>
                  <div className="text-xs text-gray-600">
                    Tasks with no dependencies between them can run in parallel.
                    Tasks connected by arrows must complete in sequence.
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CircleAlert className="h-4 w-4 text-amber-500 mr-1" />
                  <span className="text-amber-700">Drag nodes to position them. Connect nodes by dragging from handles.</span>
                </div>
              </div>
            </div>
          </Panel>
          <Controls />
          <MiniMap 
            nodeStrokeWidth={3} 
            zoomable 
            pannable 
            nodeColor={(node) => {
              const task = node.data?.task;
              if (!task) return '#eee';
              
              switch (task.status) {
                case 'Completed': return '#22c55e';
                case 'In Progress': return '#3b82f6';
                case 'Delayed': return '#ef4444';
                default: return '#94a3b8';
              }
            }}
          />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      </CardContent>

      {/* Connection Configuration Dialog */}
      <Dialog open={!!selectedConnection} onOpenChange={(open) => !open && setSelectedConnection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Task Connection</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center mb-4">
              <div className="w-2/5">
                <Label htmlFor="source-task">Source Task</Label>
                <div className="mt-2 text-sm p-2 border rounded-md bg-gray-50">
                  {tasks.find(t => t.id === selectedConnection?.source)?.name || 'Unknown Task'}
                </div>
              </div>
              
              <ChevronRight className="mx-4 text-gray-400" />
              
              <div className="w-2/5">
                <Label htmlFor="target-task">Target Task</Label>
                <div className="mt-2 text-sm p-2 border rounded-md bg-gray-50">
                  {tasks.find(t => t.id === selectedConnection?.target)?.name || 'Unknown Task'}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
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
                  <SelectItem value="success">Success Path (Sequential Execution)</SelectItem>
                  <SelectItem value="conditional">Conditional Path (Run If Condition Met)</SelectItem>
                </SelectContent>
              </Select>
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
                  placeholder="e.g., If previous task status = Completed, If priority = Critical"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Define when this task should execute after the source task.
                </p>
              </div>
            )}
            
            <div className={cn(
              "p-3 rounded-md text-sm mt-2",
              selectedConnection?.type === 'success' 
                ? "bg-blue-50 text-blue-800"
                : "bg-amber-50 text-amber-800"
            )}>
              <div className="flex items-start">
                <Info className="h-4 w-4 mr-2 mt-0.5" />
                <div>
                  {selectedConnection?.type === 'success' ? (
                    <>This task will run <strong>after</strong> the source task is completed.</>
                  ) : (
                    <>This task will only run if the specified condition is met.</>
                  )}
                </div>
              </div>
            </div>
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
