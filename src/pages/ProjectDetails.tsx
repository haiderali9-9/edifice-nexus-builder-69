
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, Calendar, Users, MapPin, DollarSign, 
  ClipboardList, AlertCircle, Loader2, Plus, File, 
  FileText, Download, Package, Trash2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ProjectTeam from "@/components/projects/ProjectTeam";
import ProjectResources from "@/components/projects/ProjectResources";
import ProjectIssues from "@/components/projects/ProjectIssues";
import ProjectWorkflow from "@/components/workflow/ProjectWorkflow";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Project, Task, Document } from "@/types";
import NewTaskModal from "@/components/tasks/NewTaskModal";
import EditTaskModal from "@/components/tasks/EditTaskModal";
import DocumentSelector from "@/components/documents/DocumentSelector";

const ProjectDetails = () => {
  
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get the initial tab from location state if available
  const initialTab = location.state?.initialTab || 'tasks';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Show/hide modal states
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Fetch project data from Supabase with proper error handling
  const { data: project, isLoading: projectLoading, isError: projectError, refetch: refetchProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .maybeSingle();
        
        if (error) throw error;
        if (!data) throw new Error("Project not found");
        
        return data as Project;
      } catch (error) {
        console.error("Error fetching project:", error);
        throw error;
      }
    },
    enabled: !!projectId,
    retry: 1, // Limit retries to avoid excessive requests on failure
    staleTime: 30000, // Cache data for 30 seconds to avoid excessive refreshes
  });

  // Fetch project tasks
  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!projectId,
  });

  // Fetch project documents
  const { data: documents, isLoading: documentsLoading, refetch: refetchDocuments } = useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('upload_date', { ascending: false });
      
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!projectId,
  });
  
  // Calculate project progress based on completed tasks
  useEffect(() => {
    if (tasks && tasks.length > 0 && project) {
      const completedTasks = tasks.filter(task => task.status === "Completed").length;
      const totalTasks = tasks.length;
      const completionPercentage = Math.round((completedTasks / totalTasks) * 100);
      
      // Only update if the completion percentage has changed
      if (completionPercentage !== project.completion) {
        updateProjectCompletion(completionPercentage);
      }
    }
  }, [tasks, project]);

  // Function to update project completion in Supabase
  const updateProjectCompletion = async (completionPercentage: number) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ completion: completionPercentage })
        .eq('id', projectId);
      
      if (error) throw error;
      
      // Refetch project data to update UI
      refetchProject();
    } catch (error) {
      console.error("Error updating project completion:", error);
      toast({
        title: "Error",
        description: "Failed to update project completion.",
        variant: "destructive",
      });
    }
  };
  
  // If project not found, show error
  if (projectError || (!projectLoading && !project)) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-gray-500 mb-6">The project you are looking for does not exist or has been removed.</p>
          <Button onClick={() => navigate("/projects")}>
            Back to Projects
          </Button>
        </div>
      </PageLayout>
    );
  }

  if (projectLoading) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <Loader2 className="h-12 w-12 animate-spin text-construction-600 mb-4" />
          <p className="text-gray-500">Loading project details...</p>
        </div>
      </PageLayout>
    );
  }
  
  // Calculate stats
  const completedTasks = tasks ? tasks.filter(task => task.status === "Completed").length : 0;
  const totalTasks = tasks ? tasks.length : 0;
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Planning":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Planning</Badge>;
      case "In Progress":
        return <Badge variant="outline" className="bg-green-100 text-green-800">In Progress</Badge>;
      case "On Hold":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">On Hold</Badge>;
      case "Completed":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Calculate days remaining
  const daysRemaining = () => {
    const today = new Date();
    const endDate = new Date(project.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Handle task creation
  const handleTaskCreated = () => {
    toast({
      title: "Task Created",
      description: "New task has been added to the project.",
    });
    refetchTasks();
  };

  // Handle task editing
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowEditTaskModal(true);
  };

  const handleTaskUpdated = () => {
    toast({
      title: "Task Updated",
      description: "Task has been updated successfully.",
    });
    refetchTasks();
  };

  // New function to handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    try {
      // First delete related task assignments
      const { error: assignmentError } = await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId);
      
      if (assignmentError) throw assignmentError;
      
      // Then delete related task resources
      const { error: resourceError } = await supabase
        .from('task_resources')
        .delete()
        .eq('task_id', taskId);
      
      if (resourceError) throw resourceError;
      
      // Also delete any task dependencies
      const { error: dependencyError } = await supabase
        .from('task_dependencies')
        .delete()
        .or(`source_task_id.eq.${taskId},target_task_id.eq.${taskId}`);
        
      if (dependencyError) throw dependencyError;
      
      // Finally delete the task
      const { error: taskError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (taskError) throw taskError;
      
      toast({
        title: "Task Deleted",
        description: "Task has been removed from the project.",
      });
      
      refetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle document selection
  const handleDocumentSelected = () => {
    toast({
      title: "Document Linked",
      description: "Document has been linked to the project.",
    });
    refetchDocuments();
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case "Not Started":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Not Started</Badge>;
      case "In Progress":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "Completed":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case "Delayed":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Delayed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case "Contract":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "Blueprint":
        return <File className="h-4 w-4 text-cyan-500" />;
      case "Permit":
        return <File className="h-4 w-4 text-green-500" />;
      case "Invoice":
        return <FileText className="h-4 w-4 text-amber-500" />;
      case "Report":
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Handle workflow saved
  const handleWorkflowSaved = () => {
    refetchTasks();
  };

  return (
    <PageLayout>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-gray-500 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">{project.location}</span>
              <span className="mx-2 text-gray-300">•</span>
              <span className="text-gray-500">Client: {project.client}</span>
            </div>
          </div>
          <div className="flex items-center">
            {getStatusBadge(project.status)}
            <Button
              className="ml-4"
              onClick={() => {
                navigate('/projects', { state: { editProject: project.id } });
              }}
            >
              Edit Project
            </Button>
          </div>
        </div>
      </div>

      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Timeline</p>
                <p className="text-lg font-medium">{daysRemaining()} days left</p>
                <p className="text-xs text-gray-500">
                  {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="text-lg font-medium">{formatCurrency(project.budget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <ClipboardList className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tasks</p>
                <p className="text-lg font-medium">{completedTasks} / {totalTasks}</p>
                <p className="text-xs text-gray-500">
                  {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full mr-4">
                <Package className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Resources</p>
                <p className="text-lg font-medium">
                  <span className="text-sm text-gray-400">View in Resources tab</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Progress */}
      <Card className="mb-6">
        <CardHeader className="pb-0">
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">{project.completion}% Complete</span>
              <span className="text-gray-500">{completedTasks} of {totalTasks} tasks completed</span>
            </div>
            <Progress value={project.completion} indicatorClassName="bg-construction-600" />
          </div>
        </CardContent>
      </Card>

      {/* Project Tabs */}
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle>Project Tasks</CardTitle>
              <Button size="sm" onClick={() => setShowNewTaskModal(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Task
              </Button>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task Name</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks && tasks.length > 0 ? (
                      tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.name}</TableCell>
                          <TableCell>{task.start_date ? new Date(task.start_date).toLocaleDateString() : 'Not set'}</TableCell>
                          <TableCell>{task.end_date ? new Date(task.end_date).toLocaleDateString() : 'Not set'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              task.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                              task.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                              task.priority === 'Medium' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>{getTaskStatusBadge(task.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditTask(task)} title="Edit Task">
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteTask(task.id)}
                                title="Delete Task"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                          No tasks added to this project yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="workflow">
          {tasks && tasks.length > 0 ? (
            <ProjectWorkflow 
              projectId={projectId!} 
              tasks={tasks} 
              onWorkflowSaved={handleWorkflowSaved}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">No Tasks Available</p>
                <p className="text-gray-500 mb-6">Add tasks to the project before creating a workflow.</p>
                <Button onClick={() => setShowNewTaskModal(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Task
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="issues">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle>Project Issues</CardTitle>
              <Button 
                size="sm" 
                onClick={() => navigate(`/issues`, { state: { projectId: project.id } })}
              >
                <Plus className="h-4 w-4 mr-2" /> Report Issue
              </Button>
            </CardHeader>
            <CardContent>
              {projectId && <ProjectIssues projectId={projectId} />}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Project Resources</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ProjectResources projectId={project.id} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle>Project Documents</CardTitle>
              <DocumentSelector
                projectId={projectId!}
                onDocumentSelected={handleDocumentSelected}
              />
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents && documents.length > 0 ? (
                    documents.map((document) => (
                      <Card key={document.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="p-6">
                            <div className="flex items-center gap-2 mb-2">
                              {getDocumentTypeIcon(document.type)}
                              <span className="font-medium">{document.name}</span>
                            </div>
                            <div className="text-xs text-gray-500 mb-4">
                              {new Date(document.upload_date).toLocaleString()}
                            </div>
                            <Badge variant="outline">{document.type}</Badge>
                          </div>
                          <div className="bg-gray-50 p-4 flex justify-between items-center">
                            <span className="text-sm text-gray-500">{document.name.split('.').pop()?.toUpperCase()}</span>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                              <a href={document.url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download</span>
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12 text-gray-500">
                      No documents linked to this project yet
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="team">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Project Team</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ProjectTeam projectId={project.id} projectName={project.name} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task Modals */}
      {showNewTaskModal && (
        <NewTaskModal
          isOpen={showNewTaskModal}
          onClose={() => setShowNewTaskModal(false)}
          projectId={projectId!}
          onTaskCreated={handleTaskCreated}
        />
      )}

      {showEditTaskModal && selectedTask && (
        <EditTaskModal
          isOpen={showEditTaskModal}
          onClose={() => setShowEditTaskModal(false)}
          task={selectedTask}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
    </PageLayout>
  );
};

export default ProjectDetails;
