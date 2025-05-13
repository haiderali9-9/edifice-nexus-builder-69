
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/services/projectService";
import { Project } from "@/types";
import { useToast } from "./use-toast";

export function useProjects() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get all projects
  const { 
    data: projects = [], 
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });

  // Get a single project
  const getProject = (id: string) => {
    return useQuery({
      queryKey: ['project', id],
      queryFn: () => projectService.getProjectById(id),
    });
  };

  // Create a new project
  const createProjectMutation = useMutation({
    mutationFn: (newProject: Omit<Project, 'id' | 'created_at'>) => {
      return projectService.createProject(newProject);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project Created",
        description: "The project has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update an existing project
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, project }: { id: string, project: Partial<Project> }) => {
      return projectService.updateProject(id, project);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
      toast({
        title: "Project Updated",
        description: "The project has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete a project
  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => {
      return projectService.deleteProject(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project Deleted",
        description: "The project has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update project completion based on task completion
  const updateProjectCompletionMutation = useMutation({
    mutationFn: (projectId: string) => {
      return projectService.updateProjectCompletion(projectId);
    },
    onSuccess: (data, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast({
        title: "Project Progress Updated",
        description: `Project completion is now at ${data}%.`,
      });
    },
    onError: (error) => {
      console.error("Error updating project completion:", error);
      toast({
        title: "Error",
        description: "Failed to update project completion.",
        variant: "destructive",
      });
    },
  });

  // Get project tasks stats
  const getProjectTasksStats = (projectId: string) => {
    return useQuery({
      queryKey: ['projectTasksStats', projectId],
      queryFn: () => projectService.getProjectTasksStats(projectId),
    });
  };

  return {
    projects,
    isLoading,
    error,
    refetchProjects: refetch,
    getProject,
    createProject: createProjectMutation.mutate,
    updateProject: updateProjectMutation.mutate,
    deleteProject: deleteProjectMutation.mutate,
    updateProjectCompletion: updateProjectCompletionMutation.mutate,
    getProjectTasksStats,
  };
}
