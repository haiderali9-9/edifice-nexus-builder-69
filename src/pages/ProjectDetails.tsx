
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Project, Task, Document } from "@/types";

// Import new component files
import ProjectHeader from "@/components/projects/ProjectHeader";
import ProjectOverviewCards from "@/components/projects/ProjectOverviewCards";
import ProjectProgress from "@/components/projects/ProjectProgress";
import ProjectTasksTab from "@/components/projects/ProjectTasksTab";
import ProjectWorkflowTab from "@/components/projects/ProjectWorkflowTab";
import ProjectIssuesTab from "@/components/projects/ProjectIssuesTab";
import ProjectDocumentsTab from "@/components/projects/ProjectDocumentsTab";
import ProjectTeam from "@/components/projects/ProjectTeam";
import ProjectResources from "@/components/projects/ProjectResources";

// Import modals
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
    retry: 1,
    staleTime: 30000,
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

  // Handle task deletion
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
  
  // Handle workflow saved
  const handleWorkflowSaved = () => {
    refetchTasks();
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
  
  return (
    <PageLayout>
      {/* Project Header */}
      <ProjectHeader project={project} />

      {/* Project Overview Cards */}
      <ProjectOverviewCards
        startDate={project.start_date}
        endDate={project.end_date}
        budget={project.budget}
        completedTasks={completedTasks}
        totalTasks={totalTasks}
      />

      {/* Project Progress */}
      <ProjectProgress 
        completion={project.completion}
        completedTasks={completedTasks}
        totalTasks={totalTasks}
      />

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
          <ProjectTasksTab 
            tasks={tasks}
            isLoading={tasksLoading}
            onAddTask={() => setShowNewTaskModal(true)}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        </TabsContent>
        
        <TabsContent value="workflow">
          <ProjectWorkflowTab
            projectId={projectId!}
            tasks={tasks}
            onWorkflowSaved={handleWorkflowSaved}
            onAddTaskClick={() => setShowNewTaskModal(true)}
          />
        </TabsContent>
        
        <TabsContent value="issues">
          <ProjectIssuesTab projectId={projectId!} />
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
          <ProjectDocumentsTab 
            documents={documents}
            isLoading={documentsLoading}
            documentSelector={
              <DocumentSelector
                projectId={projectId!}
                onDocumentSelected={handleDocumentSelected}
              />
            }
          />
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
