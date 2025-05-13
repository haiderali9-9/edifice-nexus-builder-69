
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

// Types for report generation parameters
export interface ReportParams {
  type: "progress" | "budget" | "resource" | "safety" | "productivity" | "satisfaction";
  title?: string;
  description?: string;
  projectId?: string;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
}

// Report data interfaces for different report types
export interface ProjectProgressReportData {
  projectName: string;
  tasksTotal: number;
  tasksCompleted: number;
  completionPercentage: number;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  milestones: Array<{
    name: string;
    status: string;
    dueDate: string;
  }>;
}

export interface BudgetReportData {
  projectName: string;
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
  expenses: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export interface ResourceReportData {
  resources: Array<{
    name: string;
    type: string;
    allocated: number;
    available: number;
    utilizationRate: number;
  }>;
  totalResources: number;
  averageUtilization: number;
}

export interface SafetyReportData {
  totalIncidents: number;
  resolvedIncidents: number;
  openIncidents: number;
  incidentsByPriority: Record<string, number>;
  incidentsByProject: Record<string, number>;
}

export interface ProductivityReportData {
  tasksCompletedPerDay: number;
  averageTaskCompletionTime: number;
  resourceEfficiency: number;
  projectsOnSchedule: number;
  projectsBehindSchedule: number;
}

export interface SatisfactionReportData {
  averageRating: number;
  clientFeedback: Array<{
    client: string;
    project: string;
    rating: number;
    feedback: string;
  }>;
}

// Union type for all report data
export type ReportData = 
  | ProjectProgressReportData 
  | BudgetReportData 
  | ResourceReportData 
  | SafetyReportData 
  | ProductivityReportData 
  | SatisfactionReportData;

// Report type that matches database structure
export interface Report {
  id: string;
  title: string;
  description: string | null;
  type: "progress" | "budget" | "resource" | "safety" | "productivity" | "satisfaction";
  generated_at: string;
  generated_by: string | null;
  project_id: string | null;
  date_range_start: string | null;
  date_range_end: string | null;
  data: ReportData | null;
  file_url: string | null;
  is_archived: boolean | null;
}

// Helper function to safely convert database data to our Report type
function convertToReport(dbReport: any): Report {
  return {
    ...dbReport,
    // Parse the JSON data to our ReportData type, with a fallback to null if invalid
    data: dbReport.data ? dbReport.data as ReportData : null,
    // Ensure the type is valid or default to "progress"
    type: isValidReportType(dbReport.type) ? dbReport.type : "progress"
  };
}

// Type guard to validate report type
function isValidReportType(type: string): type is Report["type"] {
  return ["progress", "budget", "resource", "safety", "productivity", "satisfaction"].includes(type);
}

export const reportService = {
  // Fetch all reports for the current user
  async getReports(): Promise<Report[]> {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("generated_at", { ascending: false });

    if (error) throw error;
    
    // Convert each report to our expected format
    return (data || []).map(report => convertToReport(report));
  },

  // Fetch a single report by ID
  async getReportById(id: string): Promise<Report | null> {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data ? convertToReport(data) : null;
  },

  // Generate and save a new report
  async generateReport(params: ReportParams): Promise<Report> {
    const { type, projectId, dateRangeStart, dateRangeEnd } = params;
    
    // Default title if not provided
    const title = params.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${format(new Date(), "MMMM yyyy")}`;
    
    // Generate report data based on type
    const reportData = await this.generateReportData(type, projectId, dateRangeStart, dateRangeEnd);
    
    // Save report to database
    const { data, error } = await supabase
      .from("reports")
      .insert({
        title,
        description: params.description,
        type,
        project_id: projectId,
        date_range_start: dateRangeStart ? dateRangeStart.toISOString() : null,
        date_range_end: dateRangeEnd ? dateRangeEnd.toISOString() : null,
        data: reportData,
      })
      .select()
      .single();
    
    if (error) throw error;
    return convertToReport(data);
  },

  // Delete a report
  async deleteReport(id: string): Promise<void> {
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  },

  // Archive a report
  async archiveReport(id: string, archive: boolean = true): Promise<void> {
    const { error } = await supabase
      .from("reports")
      .update({ is_archived: archive })
      .eq("id", id);
    
    if (error) throw error;
  },

  // Generate report data based on report type
  async generateReportData(
    type: ReportParams["type"],
    projectId?: string,
    dateRangeStart?: Date,
    dateRangeEnd?: Date
  ): Promise<ReportData> {
    switch (type) {
      case "progress":
        return this.generateProgressReport(projectId);
      case "budget":
        return this.generateBudgetReport(projectId);
      case "resource":
        return this.generateResourceReport();
      case "safety":
        return this.generateSafetyReport();
      case "productivity":
        return this.generateProductivityReport();
      case "satisfaction":
        return this.generateSatisfactionReport();
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }
  },

  // Generate progress report data
  async generateProgressReport(projectId?: string): Promise<ProjectProgressReportData> {
    let query = supabase.from("projects").select(`
      id,
      name,
      start_date,
      end_date,
      completion,
      tasks:tasks(id, name, status)
    `);

    if (projectId) {
      query = query.eq("id", projectId);
    }

    const { data, error } = await query.single();

    if (error) throw error;

    const tasksTotal = data.tasks ? data.tasks.length : 0;
    const tasksCompleted = data.tasks ? data.tasks.filter((task: any) => task.status === "Completed").length : 0;
    
    // Calculate days remaining
    const endDate = new Date(data.end_date);
    const today = new Date();
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24)));

    return {
      projectName: data.name,
      tasksTotal,
      tasksCompleted,
      completionPercentage: tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0,
      startDate: data.start_date,
      endDate: data.end_date,
      daysRemaining,
      milestones: data.tasks ? data.tasks.slice(0, 5).map((task: any) => ({
        name: task.name,
        status: task.status,
        dueDate: "N/A" // We don't have milestone due dates in the current schema
      })) : [],
    };
  },

  // Generate budget report data
  async generateBudgetReport(projectId?: string): Promise<BudgetReportData> {
    // Get project budget information
    let projectQuery = supabase.from("projects").select(`
      id,
      name,
      budget
    `);

    if (projectId) {
      projectQuery = projectQuery.eq("id", projectId);
    }

    const { data: projectData, error: projectError } = await projectQuery.single();

    if (projectError) throw projectError;

    // Get financial transactions for the project
    const { data: transactionsData, error: transactionsError } = await supabase
      .from("financial_transactions")
      .select("*")
      .eq("project_id", projectData.id)
      .eq("type", "expense");

    if (transactionsError) throw transactionsError;

    // Calculate total spent
    const totalSpent = transactionsData.reduce((sum: number, transaction: any) => sum + transaction.amount, 0);
    
    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    transactionsData.forEach((transaction: any) => {
      const category = transaction.category || "Uncategorized";
      expensesByCategory[category] = (expensesByCategory[category] || 0) + transaction.amount;
    });

    // Format expenses for the report
    const expenses = Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0
    }));

    return {
      projectName: projectData.name,
      totalBudget: projectData.budget,
      totalSpent,
      remaining: projectData.budget - totalSpent,
      percentageUsed: projectData.budget > 0 ? Math.round((totalSpent / projectData.budget) * 100) : 0,
      expenses
    };
  },

  // Generate resource allocation report data
  async generateResourceReport(): Promise<ResourceReportData> {
    const { data, error } = await supabase
      .from("resources")
      .select(`
        id,
        name,
        type,
        quantity,
        status,
        resource_allocations:resource_allocations(quantity, project_id)
      `);

    if (error) throw error;

    const resources = data.map((resource: any) => {
      const allocated = resource.resource_allocations
        ? resource.resource_allocations.reduce((sum: number, allocation: any) => sum + allocation.quantity, 0)
        : 0;
      
      const available = Math.max(0, resource.quantity - allocated);
      const utilizationRate = resource.quantity > 0 ? Math.round((allocated / resource.quantity) * 100) : 0;

      return {
        name: resource.name,
        type: resource.type,
        allocated,
        available,
        utilizationRate
      };
    });

    // Calculate average utilization
    const totalUtilization = resources.reduce((sum, resource) => sum + resource.utilizationRate, 0);
    const averageUtilization = resources.length > 0 ? Math.round(totalUtilization / resources.length) : 0;

    return {
      resources,
      totalResources: resources.length,
      averageUtilization
    };
  },

  // Generate safety report data
  async generateSafetyReport(): Promise<SafetyReportData> {
    const { data, error } = await supabase
      .from("issues")
      .select(`
        id,
        status,
        priority,
        project_id,
        projects:project_id(name)
      `);

    if (error) throw error;

    const totalIncidents = data.length;
    const resolvedIncidents = data.filter((issue: any) => issue.status === "Resolved").length;
    const openIncidents = totalIncidents - resolvedIncidents;

    // Count incidents by priority
    const incidentsByPriority: Record<string, number> = {};
    data.forEach((issue: any) => {
      incidentsByPriority[issue.priority] = (incidentsByPriority[issue.priority] || 0) + 1;
    });

    // Count incidents by project
    const incidentsByProject: Record<string, number> = {};
    data.forEach((issue: any) => {
      const projectName = issue.projects?.name || "Unknown";
      incidentsByProject[projectName] = (incidentsByProject[projectName] || 0) + 1;
    });

    return {
      totalIncidents,
      resolvedIncidents,
      openIncidents,
      incidentsByPriority,
      incidentsByProject
    };
  },

  // Generate productivity report data
  async generateProductivityReport(): Promise<ProductivityReportData> {
    // Get all tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("*");

    if (tasksError) throw tasksError;

    // Get all projects
    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("id, name, start_date, end_date, status, completion");

    if (projectsError) throw projectsError;

    // Calculate tasks completed in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const completedTasks = tasksData.filter((task: any) => 
      task.status === "Completed" && new Date(task.created_at) >= thirtyDaysAgo
    );

    const tasksCompletedPerDay = completedTasks.length / 30;

    // Calculate projects on or behind schedule
    const today = new Date();
    let projectsOnSchedule = 0;
    let projectsBehindSchedule = 0;

    projectsData.forEach((project: any) => {
      const endDate = new Date(project.end_date);
      const totalDays = (new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 3600 * 24);
      const daysElapsed = (today.getTime() - new Date(project.start_date).getTime()) / (1000 * 3600 * 24);
      
      const expectedProgress = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
      
      if (project.completion >= expectedProgress || project.status === "Completed") {
        projectsOnSchedule++;
      } else {
        projectsBehindSchedule++;
      }
    });

    return {
      tasksCompletedPerDay: parseFloat(tasksCompletedPerDay.toFixed(2)),
      averageTaskCompletionTime: 5, // Placeholder as we don't track actual completion time
      resourceEfficiency: 75, // Placeholder value
      projectsOnSchedule,
      projectsBehindSchedule
    };
  },

  // Generate client satisfaction report (simplified as we don't have client feedback data)
  async generateSatisfactionReport(): Promise<SatisfactionReportData> {
    // Get all projects to use as proxy for client feedback
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, client, completion");

    if (error) throw error;

    // Simulate client feedback based on project completion
    const clientFeedback = data.map((project: any) => ({
      client: project.client,
      project: project.name,
      rating: Math.min(5, Math.max(1, Math.round(project.completion / 20))),
      feedback: this.generateFeedbackText(Math.min(5, Math.max(1, Math.round(project.completion / 20))))
    }));

    // Calculate average rating
    const totalRating = clientFeedback.reduce((sum, feedback) => sum + feedback.rating, 0);
    const averageRating = clientFeedback.length > 0 
      ? parseFloat((totalRating / clientFeedback.length).toFixed(1))
      : 0;

    return {
      averageRating,
      clientFeedback
    };
  },

  // Helper method to generate feedback text based on rating
  generateFeedbackText(rating: number): string {
    const feedbackOptions = [
      [
        "Significant delays and issues with the project.",
        "Not satisfied with progress and communication.",
        "Multiple problems need immediate attention."
      ],
      [
        "Project is behind schedule. Concerned about completion.",
        "Some issues need to be addressed promptly.",
        "Communication could be improved."
      ],
      [
        "Project is progressing adequately.",
        "Some minor issues, but overall acceptable.",
        "More regular updates would be appreciated."
      ],
      [
        "Project is running smoothly with good communication.",
        "Minor adjustments needed but overall satisfied.",
        "Team has been responsive to our needs."
      ],
      [
        "Excellent project management and execution.",
        "Very satisfied with progress and communication.",
        "Project exceeds our expectations."
      ]
    ];

    const ratingIndex = Math.min(4, Math.max(0, rating - 1));
    const options = feedbackOptions[ratingIndex];
    return options[Math.floor(Math.random() * options.length)];
  }
};
