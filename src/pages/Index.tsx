
import React, { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import StatCard from "@/components/dashboard/StatCard";
import {
  Building,
  Calendar,
  DollarSign,
  BarChart,
  Box,
  AlertTriangle,
} from "lucide-react";
import ProjectsOverview from "@/components/dashboard/ProjectsOverview";
import ProgressChart from "@/components/dashboard/ProgressChart";
import BudgetChart from "@/components/dashboard/BudgetChart";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";
import ResourceStatus from "@/components/dashboard/ResourceStatus";
import RecentIssues from "@/components/dashboard/RecentIssues";
import { Project, Task, Resource, Issue } from "@/types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    activeProjects: 0,
    totalProjects: 0,
    totalBudget: 0,
    resourceUtilization: 0,
    openIssues: 0,
    monthlyProgress: [],
    budgetDistribution: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("*");
        
        if (projectsError) throw projectsError;
        
        // Fetch tasks with assignments
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select(`
            *,
            task_assignments (
              id,
              user_id
            )
          `);
        
        if (tasksError) throw tasksError;
        
        // Fetch resources
        const { data: resourcesData, error: resourcesError } = await supabase
          .from("resources")
          .select("*");
        
        if (resourcesError) throw resourcesError;
        
        // Fetch issues
        const { data: issuesData, error: issuesError } = await supabase
          .from("issues")
          .select("*");
        
        if (issuesError) throw issuesError;
        
        // Process projects data
        const projects = projectsData as Project[];
        const activeProjectsData = projects.filter(p => p.status === "In Progress");
        
        // Calculate dashboard stats
        const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
        
        // For simplicity, we'll calculate resource utilization as a percentage of allocated resources
        const { data: allocationsData } = await supabase.from("resource_allocations").select("*");
        const allocations = allocationsData || [];
        const totalResources = resourcesData?.length || 0;
        const allocatedResources = new Set(allocations.map(a => a.resource_id)).size;
        const resourceUtilization = totalResources > 0 ? Math.round((allocatedResources / totalResources) * 100) : 0;
        
        // Count open issues
        const openIssues = issuesData ? issuesData.filter(i => i.status === "Open").length : 0;
        
        // Generate sample monthly progress data (in a real app, this would be calculated from task completion data)
        // This is a placeholder - in a real app you would aggregate this from actual task/project progress
        const monthlyProgress = [
          { month: "Jan", completed: 5, planned: 8 },
          { month: "Feb", completed: 7, planned: 10 },
          { month: "Mar", completed: 12, planned: 15 },
          { month: "Apr", completed: 9, planned: 12 },
          { month: "May", completed: 18, planned: 20 },
          { month: "Jun", completed: 16, planned: 22 },
        ];
        
        // Generate budget distribution data
        // This is a placeholder - in a real app you would aggregate this from actual expense/budget data
        const budgetDistribution = [
          { name: "Labor", value: totalBudget * 0.4 },
          { name: "Materials", value: totalBudget * 0.35 },
          { name: "Equipment", value: totalBudget * 0.15 },
          { name: "Other", value: totalBudget * 0.1 },
        ];
        
        // Update state with fetched data
        setActiveProjects(activeProjectsData);
        setTasks(tasksData as Task[]);
        setResources(resourcesData as Resource[]);
        setIssues(issuesData as Issue[]);
        setDashboardStats({
          activeProjects: activeProjectsData.length,
          totalProjects: projects.length,
          totalBudget,
          resourceUtilization,
          openIssues,
          monthlyProgress,
          budgetDistribution,
        });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          {isLoading 
            ? "Loading dashboard data..." 
            : "Welcome back to your construction management overview."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Active Projects"
          value={dashboardStats.activeProjects}
          icon={Building}
          description={`${dashboardStats.totalProjects} total projects`}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />

        <StatCard
          title="Total Budget"
          value={formatCurrency(dashboardStats.totalBudget)}
          icon={DollarSign}
          description="Across all projects"
          color="green"
        />

        <StatCard
          title="Resource Utilization"
          value={`${dashboardStats.resourceUtilization}%`}
          icon={Box}
          trend={{ value: 4, isPositive: false }}
          color="yellow"
        />

        <StatCard
          title="Open Issues"
          value={dashboardStats.openIssues}
          icon={AlertTriangle}
          description="Requiring attention"
          trend={{ value: 10, isPositive: true }}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ProgressChart data={dashboardStats.monthlyProgress} />
        <BudgetChart data={dashboardStats.budgetDistribution} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ProjectsOverview projects={activeProjects} />
        <UpcomingTasks tasks={tasks} />
        <RecentIssues issues={issues} />
      </div>

      <div className="mb-6">
        <ResourceStatus resources={resources} />
      </div>
    </PageLayout>
  );
};

export default Dashboard;
