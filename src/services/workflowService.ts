
import { supabase } from "@/lib/supabase";
import { Task } from "@/types";

interface TaskDependency {
  project_id: string;
  source_task_id: string;
  target_task_id: string;
  condition?: string | null;
  created_at?: string;
}

interface NodePosition {
  project_id: string;
  task_id: string;
  position_x: number;
  position_y: number;
}

export const workflowService = {
  // Get task dependencies for a project
  async getTaskDependencies(projectId: string): Promise<TaskDependency[]> {
    const { data, error } = await supabase
      .from("task_dependencies")
      .select("*")
      .eq("project_id", projectId);

    if (error) throw error;
    return data as TaskDependency[] || [];
  },

  // Save task dependencies for a project
  async saveTaskDependencies(dependencies: TaskDependency[]): Promise<void> {
    if (dependencies.length === 0) return;

    const projectId = dependencies[0].project_id;
    
    // First delete existing dependencies
    const { error: deleteError } = await supabase
      .from("task_dependencies")
      .delete()
      .eq("project_id", projectId);

    if (deleteError) throw deleteError;

    // Insert new dependencies
    const { error } = await supabase
      .from("task_dependencies")
      .insert(dependencies);

    if (error) throw error;
  },

  // Save node positions for future reference
  async saveNodePositions(positions: NodePosition[]): Promise<void> {
    if (positions.length === 0) return;

    const { error } = await supabase
      .from("workflow_node_positions")
      .upsert(positions, { onConflict: 'project_id,task_id' });

    if (error) throw error;
  },

  // Get saved node positions for a project
  async getNodePositions(projectId: string): Promise<NodePosition[]> {
    const { data, error } = await supabase
      .from("workflow_node_positions")
      .select("*")
      .eq("project_id", projectId);

    if (error) throw error;
    return data as NodePosition[] || [];
  },

  // Get workflow analysis - identify critical path, parallel tasks, etc.
  async analyzeWorkflow(projectId: string, tasks: Task[]): Promise<{
    criticalPath: string[];
    parallelGroups: string[][];
    bottlenecks: string[];
  }> {
    // Get dependencies
    const dependencies = await this.getTaskDependencies(projectId);
    
    // Build dependency graph
    const dependencyMap = new Map<string, string[]>();
    const reverseDependencyMap = new Map<string, string[]>();
    
    dependencies.forEach(dep => {
      // Forward dependencies
      if (!dependencyMap.has(dep.source_task_id)) {
        dependencyMap.set(dep.source_task_id, []);
      }
      dependencyMap.get(dep.source_task_id)!.push(dep.target_task_id);
      
      // Reverse dependencies
      if (!reverseDependencyMap.has(dep.target_task_id)) {
        reverseDependencyMap.set(dep.target_task_id, []);
      }
      reverseDependencyMap.get(dep.target_task_id)!.push(dep.source_task_id);
    });
    
    // Identify start and end tasks
    const startTasks = tasks
      .filter(task => !reverseDependencyMap.has(task.id) || reverseDependencyMap.get(task.id)!.length === 0)
      .map(task => task.id);
    
    const endTasks = tasks
      .filter(task => !dependencyMap.has(task.id) || dependencyMap.get(task.id)!.length === 0)
      .map(task => task.id);
    
    // Simple analysis - longest path is critical
    let criticalPath: string[] = [];
    let maxLength = 0;
    
    const findLongestPath = (taskId: string, path: string[] = []): string[] => {
      const currentPath = [...path, taskId];
      
      if (!dependencyMap.has(taskId) || dependencyMap.get(taskId)!.length === 0) {
        return currentPath;
      }
      
      let longestPath = currentPath;
      dependencyMap.get(taskId)!.forEach(nextTaskId => {
        const newPath = findLongestPath(nextTaskId, currentPath);
        if (newPath.length > longestPath.length) {
          longestPath = newPath;
        }
      });
      
      return longestPath;
    };
    
    // Find critical path from each start task
    startTasks.forEach(taskId => {
      const path = findLongestPath(taskId);
      if (path.length > maxLength) {
        criticalPath = path;
        maxLength = path.length;
      }
    });
    
    // Find parallel task groups (tasks at the same "level")
    const taskLevels = new Map<string, number>();
    const assignLevels = (taskId: string, level: number) => {
      taskLevels.set(taskId, level);
      
      if (dependencyMap.has(taskId)) {
        dependencyMap.get(taskId)!.forEach(nextTaskId => {
          // Only process if all prerequisites are assigned levels
          const prereqs = reverseDependencyMap.get(nextTaskId) || [];
          if (prereqs.every(prereqId => taskLevels.has(prereqId))) {
            assignLevels(nextTaskId, level + 1);
          }
        });
      }
    };
    
    // Start assigning levels from start tasks
    startTasks.forEach(taskId => assignLevels(taskId, 0));
    
    // Group tasks by level
    const levelGroups = new Map<number, string[]>();
    taskLevels.forEach((level, taskId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(taskId);
    });
    
    // Convert level groups to parallel groups
    const parallelGroups = Array.from(levelGroups.values());
    
    // Identify bottlenecks (tasks with many incoming or outgoing dependencies)
    const bottlenecks = tasks
      .map(task => task.id)
      .filter(taskId => {
        const incomingCount = reverseDependencyMap.get(taskId)?.length || 0;
        const outgoingCount = dependencyMap.get(taskId)?.length || 0;
        return (incomingCount > 1 && outgoingCount > 1); // Bottleneck criteria
      });
    
    return {
      criticalPath,
      parallelGroups,
      bottlenecks
    };
  }
};
