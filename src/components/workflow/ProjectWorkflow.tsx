
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
  Node,
  useOnSelectionChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
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
  Loader2,
  Search,
  Wand2,
  AlertTriangle,
  FileText,
  Clock,
  ArrowRight,
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
import { Badge } from '@/components/ui/badge';
import { workflowService } from '@/services/workflowService';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWorkflowInfo, setShowWorkflowInfo] = useState(false);
  const [workflowAnalysis, setWorkflowAnalysis] = useState<{
    criticalPath: string[];
    parallelGroups: string[][];
    bottlenecks: string[];
  } | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create initial nodes from tasks
  const createInitialNodes = useCallback((): WorkflowNode[] => {
    return tasks.map((task, index) => ({
      id: task.id,
      type: 'taskNode',
      position: { x: 50, y: 100 + (index * 150) },
      data: { task },
      selected: false,
    }));
  }, [tasks]);

  // Create initial edges from task dependencies
  const fetchDependencies = useCallback(async (): Promise<WorkflowEdge[]> => {
    setIsLoading(true);
    try {
      const { data: dependencies, error } = await supabase
        .from('task_dependencies')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      
      if (!dependencies || dependencies.length === 0) {
        setIsLoading(false);
        return [];
      }
      
      return dependencies.map((dep) => {
        // Determine the edge type and style based on the condition
        let edgeStyle: React.CSSProperties = {};
        let sourceHandle = 'source-success';
        let animated = true;
        
        if (dep.condition) {
          sourceHandle = 'source-conditional';
          edgeStyle = { stroke: '#F59E0B', strokeWidth: 2 };
        } else {
          edgeStyle = { stroke: '#22C55E', strokeWidth: 2 };
        }
        
        return {
          id: `e-${dep.source_task_id}-${dep.target_task_id}`,
          source: dep.source_task_id,
          target: dep.target_task_id,
          sourceHandle,
          targetHandle: 'target-default',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
          },
          animated,
          style: edgeStyle,
          label: dep.condition || undefined,
          labelStyle: { fontSize: 10, fill: '#666' },
          labelBgStyle: { fill: 'rgba(255, 255, 255, 0.8)' },
          data: {
            condition: dep.condition || undefined,
            type: dep.condition ? 'conditional' : 'success'
          }
        };
      });
    } catch (err) {
      console.error('Error loading task dependencies:', err);
      toast({
        title: "Error Loading Workflow",
        description: "Could not load workflow dependencies. Please try again.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [projectId, toast]);

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
  
  // Analyze workflow when dependencies change
  useEffect(() => {
    if (tasks.length > 0 && edges.length > 0) {
      workflowService
        .analyzeWorkflow(projectId, tasks)
        .then(analysis => {
          setWorkflowAnalysis(analysis);
        })
        .catch(err => {
          console.error('Failed to analyze workflow:', err);
        });
    } else {
      setWorkflowAnalysis(null);
    }
  }, [projectId, tasks, edges]);
  
  // Track node selection
  useOnSelectionChange({
    onChange: ({ nodes }) => {
      if (nodes.length === 1) {
        setSelectedTask(nodes[0].id);
      } else {
        setSelectedTask(null);
      }
    }
  });

  // Filter nodes based on search query
  useEffect(() => {
    if (!searchQuery) {
      // Reset all nodes to normal opacity
      setNodes(nds => nds.map(node => ({
        ...node,
        style: { ...node.style, opacity: 1 }
      })));
      return;
    }
    
    // Filter nodes and highlight matches
    setNodes(nds => nds.map(node => {
      const task = (node.data as { task: Task }).task;
      const isMatch = 
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return {
        ...node,
        style: { 
          ...node.style,
          opacity: isMatch ? 1 : 0.3,
          boxShadow: isMatch ? '0 0 8px 2px rgba(59, 130, 246, 0.6)' : undefined
        }
      };
    }));
  }, [searchQuery, setNodes]);
  
  // Optimize layout to show dependencies clearly
  const optimizeLayout = useCallback(() => {
    if (nodes.length === 0) return;
    
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
    
    // Calculate positions based on levels with animation
    const newNodes = [...nodes];
    const levelSpacing = 300; // Horizontal spacing between levels
    const nodeSpacing = 180;  // Vertical spacing between nodes at same level
    
    // Position nodes by level with smooth transition
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
            },
            // Add smooth animation
            style: { 
              ...newNodes[nodeIndex].style,
              transition: 'all 0.5s ease-in-out'
            }
          };
        }
      });
    });
    
    // Apply the new layout
    setNodes(newNodes);
    
    // Center view after a short delay
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2 });
    }, 600);
  }, [nodes, edges, setNodes, reactFlowInstance]);

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
    const edgeStyle = type === 'conditional' 
      ? { stroke: '#F59E0B', strokeWidth: 2 } 
      : { stroke: '#22C55E', strokeWidth: 2 };
    
    const newEdge: WorkflowEdge = {
      id: edgeId,
      source,
      target,
      sourceHandle,
      targetHandle: 'target-default',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
      },
      style: edgeStyle,
      label: condition,
      labelStyle: { fontSize: 10, fill: '#666' },
      labelBgStyle: { fill: 'rgba(255, 255, 255, 0.8)' },
      data: {
        condition,
        type
      }
    };
    
    setEdges(eds => addEdge(newEdge, eds));
    setSelectedConnection(null);
    
    // Notify user of successful connection
    toast({
      title: "Connection Created",
      description: "Task dependency has been created successfully.",
    });
    
    // Update layout after adding a new connection
    setTimeout(optimizeLayout, 100);
  }, [selectedConnection, setEdges, optimizeLayout, toast]);

  // Save the workflow task dependencies
  const saveWorkflow = async () => {
    setIsSaving(true);
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

      // Save node positions for future reference
      const nodePositions = nodes.map(node => ({
        project_id: projectId,
        task_id: node.id,
        position_x: node.position.x,
        position_y: node.position.y,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Save node positions to a separate table
      const { error: positionError } = await supabase
        .from('workflow_node_positions')
        .upsert(nodePositions, { onConflict: 'project_id,task_id' });

      if (positionError) {
        console.error('Error saving node positions:', positionError);
        // Continue even if positions fail to save
      }
      
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
    } finally {
      setIsSaving(false);
    }
  };

  // Load saved node positions
  const loadSavedPositions = useCallback(async () => {
    try {
      const { data: positions, error } = await supabase
        .from('workflow_node_positions')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      
      if (positions && positions.length > 0) {
        setNodes(prevNodes => {
          return prevNodes.map(node => {
            const savedPosition = positions.find(pos => pos.task_id === node.id);
            if (savedPosition) {
              return {
                ...node,
                position: {
                  x: savedPosition.position_x,
                  y: savedPosition.position_y
                }
              };
            }
            return node;
          });
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error loading saved positions:', err);
      return false;
    }
  }, [projectId, setNodes]);

  // Try to load saved positions on initial load
  useEffect(() => {
    if (nodes.length > 0) {
      loadSavedPositions().then(positionsLoaded => {
        if (!positionsLoaded) {
          // If no positions were loaded, run the auto layout
          optimizeLayout();
        }
      });
    }
  }, [nodes.length, loadSavedPositions, optimizeLayout]);

  // Function to show task details in the workflow
  const highlightTaskInWorkflow = (taskId: string) => {
    setNodes(nds => nds.map(node => ({
      ...node,
      selected: node.id === taskId,
      style: { 
        ...node.style, 
        transition: 'all 0.3s ease',
        zIndex: node.id === taskId ? 1000 : 0,
        boxShadow: node.id === taskId ? '0 0 10px 3px rgba(59, 130, 246, 0.7)' : undefined,
      }
    })));
    
    // Find the selected task node and center on it
    const taskNode = nodes.find(node => node.id === taskId);
    if (taskNode && reactFlowInstance) {
      reactFlowInstance.setCenter(
        taskNode.position.x + 100, 
        taskNode.position.y + 100, 
        { duration: 800 }
      );
    }
  };

  const getTaskById = (id: string) => {
    return tasks.find(task => task.id === id);
  };

  return (
    <Card className="h-[600px]">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-500" />
            Task Workflow
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Connect tasks to define dependencies and execution order
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowWorkflowInfo(true)}
            className="text-gray-600"
          >
            <Info className="h-4 w-4 mr-2" />
            Analysis
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={optimizeLayout}
            className="text-gray-600"
          >
            <Wand2 className="h-4 w-4 mr-2" />
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
            className="text-gray-600"
          >
            <CornerUpLeft className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            size="sm"
            onClick={saveWorkflow}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Workflow
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-[550px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-72">
              <div className="mb-4 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-8" />
              
              <div className="space-y-2">
                <Skeleton className="h-20 w-full mb-2" />
                <Skeleton className="h-20 w-full mb-2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        ) : (
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
            defaultEdgeOptions={{
              animated: true,
              style: { strokeWidth: 2 },
            }}
          >
            <Controls showInteractive={false} className="bg-white shadow-md border border-gray-100" />
            <MiniMap 
              nodeStrokeWidth={3} 
              zoomable 
              pannable 
              className="bg-white border border-gray-100 shadow-sm"
              nodeBorderRadius={2}
              maskStrokeWidth={4}
              nodeColor={(node) => {
                const task = node.data?.task as Task;
                if (!task) return '#eee';
                
                switch (task.status) {
                  case 'Completed': return '#22c55e';
                  case 'In Progress': return '#3b82f6';
                  case 'Delayed': return '#ef4444';
                  default: return '#94a3b8';
                }
              }}
            />
            <Panel position="top-left" className="bg-white p-2 rounded-md border shadow-sm m-3 w-64">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2 top-3 text-gray-400" />
                <Input 
                  placeholder="Search tasks..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
            </Panel>
            <Background color="#aaa" gap={16} size={1} />
          </ReactFlow>
        )}
      </CardContent>

      {/* Connection Configuration Dialog */}
      <Dialog open={!!selectedConnection} onOpenChange={(open) => !open && setSelectedConnection(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-blue-600">
              <ArrowRight className="h-5 w-5 mr-2" />
              Configure Task Connection
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center mb-4">
              <div className="w-2/5">
                <Label htmlFor="source-task">Source Task</Label>
                <div className="mt-2 text-sm p-2 border rounded-md bg-gray-50 font-medium">
                  {tasks.find(t => t.id === selectedConnection?.source)?.name || 'Unknown Task'}
                </div>
              </div>
              
              <ChevronRight className="mx-4 text-blue-400" />
              
              <div className="w-2/5">
                <Label htmlFor="target-task">Target Task</Label>
                <div className="mt-2 text-sm p-2 border rounded-md bg-gray-50 font-medium">
                  {tasks.find(t => t.id === selectedConnection?.target)?.name || 'Unknown Task'}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="connection-type" className="text-gray-700">Connection Type</Label>
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
                  <SelectItem value="success">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span>Success Path (Sequential Execution)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="conditional">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                      <span>Conditional Path (Run If Condition Met)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedConnection?.type === 'conditional' && (
              <div className="mb-4">
                <Label htmlFor="condition" className="text-gray-700">Condition</Label>
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
            <Button onClick={handleCreateConnection} className="bg-blue-600 hover:bg-blue-700">
              Create Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow Analysis Dialog */}
      <Dialog open={showWorkflowInfo} onOpenChange={setShowWorkflowInfo}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2 text-blue-500" />
              Workflow Analysis
            </DialogTitle>
          </DialogHeader>
          
          {!workflowAnalysis || edges.length === 0 ? (
            <div className="py-8 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Insufficient Data</h3>
              <p className="text-gray-600">
                Connect tasks to create dependencies before analyzing the workflow.
              </p>
            </div>
          ) : (
            <div className="py-4">
              {/* Critical Path */}
              <div className="mb-6">
                <h3 className="text-sm font-medium flex items-center mb-3 text-blue-800">
                  <Clock className="h-4 w-4 mr-2 text-blue-600" /> 
                  Critical Path
                </h3>
                <div className="bg-blue-50 rounded-md p-3 border border-blue-100">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {workflowAnalysis.criticalPath.map((taskId, index) => {
                      const task = getTaskById(taskId);
                      return (
                        <React.Fragment key={taskId}>
                          {index > 0 && <ArrowRight className="h-3 w-3 text-gray-400" />}
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "cursor-pointer hover:bg-blue-100",
                              task?.status === 'Completed' ? 'bg-green-50 border-green-200' :
                              task?.status === 'In Progress' ? 'bg-blue-50 border-blue-200' :
                              task?.status === 'Delayed' ? 'bg-red-50 border-red-200' :
                              'bg-gray-50 border-gray-200'
                            )}
                            onClick={() => {
                              setShowWorkflowInfo(false);
                              setTimeout(() => highlightTaskInWorkflow(taskId), 300);
                            }}
                          >
                            {task?.name || 'Unknown'}
                          </Badge>
                        </React.Fragment>
                      );
                    })}
                  </div>
                  
                  <p className="text-xs text-gray-600 mt-2">
                    The critical path is the sequence of tasks that determines the minimum project duration.
                  </p>
                </div>
              </div>
              
              {/* Parallel Groups */}
              <div className="mb-6">
                <h3 className="text-sm font-medium flex items-center mb-3 text-green-800">
                  <ZoomIn className="h-4 w-4 mr-2 text-green-600" /> 
                  Parallel Task Groups
                </h3>
                {workflowAnalysis.parallelGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="bg-green-50 rounded-md p-3 mb-3 border border-green-100">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Group {groupIndex + 1}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {group.map(taskId => {
                        const task = getTaskById(taskId);
                        return (
                          <Badge 
                            key={taskId}
                            variant="outline" 
                            className="cursor-pointer hover:bg-green-100 bg-white"
                            onClick={() => {
                              setShowWorkflowInfo(false);
                              setTimeout(() => highlightTaskInWorkflow(taskId), 300);
                            }}
                          >
                            {task?.name || 'Unknown'}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                <p className="text-xs text-gray-600 mt-1">
                  Tasks within the same group can potentially be executed in parallel.
                </p>
              </div>
              
              {/* Bottlenecks */}
              {workflowAnalysis.bottlenecks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium flex items-center mb-3 text-amber-800">
                    <AlertCircle className="h-4 w-4 mr-2 text-amber-600" /> 
                    Potential Bottlenecks
                  </h3>
                  <div className="bg-amber-50 rounded-md p-3 border border-amber-100">
                    <div className="flex flex-wrap gap-1.5">
                      {workflowAnalysis.bottlenecks.map(taskId => {
                        const task = getTaskById(taskId);
                        return (
                          <Badge 
                            key={taskId}
                            variant="outline" 
                            className="cursor-pointer hover:bg-amber-100 bg-white"
                            onClick={() => {
                              setShowWorkflowInfo(false);
                              setTimeout(() => highlightTaskInWorkflow(taskId), 300);
                            }}
                          >
                            {task?.name || 'Unknown'}
                          </Badge>
                        );
                      })}
                    </div>
                    
                    <p className="text-xs text-gray-600 mt-2">
                      These tasks have multiple dependencies and may become workflow bottlenecks.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProjectWorkflow;
