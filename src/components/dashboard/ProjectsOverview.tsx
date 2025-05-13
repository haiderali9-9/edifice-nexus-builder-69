
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/types";
import { Building, Calendar, MapPin } from "lucide-react";
import { Progress } from "../ui/progress";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface ProjectsOverviewProps {
  projects: Project[];
}

const ProjectsOverview = ({ projects }: ProjectsOverviewProps) => {
  // Fetch tasks for each project to calculate real completion percentage
  const { data: projectsWithTasks = [] } = useQuery({
    queryKey: ['projectsWithTasks'],
    queryFn: async () => {
      // Get project ids
      const projectIds = projects.map(project => project.id);
      
      if (projectIds.length === 0) return projects;
      
      // Fetch tasks for each project
      const { data: tasksData, error } = await supabase
        .from('tasks')
        .select('project_id, status')
        .in('project_id', projectIds);
      
      if (error) throw error;
      
      // Calculate completion percentages based on tasks
      return projects.map(project => {
        const projectTasks = tasksData.filter(task => task.project_id === project.id);
        const totalTasks = projectTasks.length;
        
        if (totalTasks === 0) {
          // If no tasks, use the existing completion value
          return project;
        }
        
        const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;
        const calculatedCompletion = Math.round((completedTasks / totalTasks) * 100);
        
        return {
          ...project,
          completion: calculatedCompletion,
          _totalTasks: totalTasks,
          _completedTasks: completedTasks
        };
      });
    },
    // Only run this query if we have projects
    enabled: projects.length > 0,
    // Use the projects data as fallback
    placeholderData: projects,
  });

  // Sort projects by completion percentage (highest first)
  const sortedProjects = [...projectsWithTasks]
    .sort((a, b) => b.completion - a.completion)
    .slice(0, 5); // Show top 5 projects

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-medium">Active Projects</CardTitle>
        <Link
          to="/projects"
          className="text-sm text-construction-600 hover:text-construction-800 transition-colors"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-5">
        {sortedProjects.map((project) => (
          <Link to={`/projects/${project.id}`} key={project.id} className="block hover:bg-gray-50 rounded-md p-2 -mx-2 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-construction-100 p-2 rounded">
                    <Building className="h-4 w-4 text-construction-700" />
                  </div>
                  <div>
                    <h3 className="font-medium">{project.name}</h3>
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      {project.location}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="text-xs text-gray-600">
                    {new Date(project.end_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Progress 
                  value={project.completion} 
                  className="h-2" 
                  indicatorClassName={`${
                    project.completion >= 100 
                      ? 'bg-green-500' 
                      : project.completion >= 75 
                        ? 'bg-emerald-500' 
                        : project.completion >= 50 
                          ? 'bg-amber-500' 
                          : project.completion >= 25 
                            ? 'bg-orange-500' 
                            : 'bg-red-500'
                  }`} 
                />
                <span className="text-sm font-medium w-12 text-right">
                  {project.completion}%
                </span>
              </div>
              {/* Show task count if available */}
              {'_totalTasks' in project && (
                <div className="text-xs text-gray-500">
                  {(project as any)._completedTasks} of {(project as any)._totalTasks} tasks complete
                </div>
              )}
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

export default ProjectsOverview;
