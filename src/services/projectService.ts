
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types";

export const projectService = {
  // Get all projects
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Project[] || [];
  },
  
  // Get a single project by ID
  async getProjectById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Project;
  },
  
  // Create a new project
  async createProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .insert(project)
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },
  
  // Update an existing project
  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .update(project)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },
  
  // Delete a project
  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
  
  // Update project completion based on task completion
  async updateProjectCompletion(projectId: string): Promise<number> {
    // Get all tasks for the project
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("status")
      .eq("project_id", projectId);
    
    if (tasksError) throw tasksError;
    
    // Calculate completion percentage
    const totalTasks = tasks.length;
    if (totalTasks === 0) return 0;
    
    const completedTasks = tasks.filter(task => task.status === "Completed").length;
    const completionPercentage = Math.round((completedTasks / totalTasks) * 100);
    
    // Update the project with the new completion percentage
    const { data, error } = await supabase
      .from("projects")
      .update({ completion: completionPercentage })
      .eq("id", projectId)
      .select("completion")
      .single();
    
    if (error) throw error;
    return data.completion;
  },
  
  // Get project tasks with completion statistics
  async getProjectTasksStats(projectId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
  }> {
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("status")
      .eq("project_id", projectId);
    
    if (error) throw error;
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === "Completed").length;
    const completionPercentage = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;
    
    return { totalTasks, completedTasks, completionPercentage };
  }
};
