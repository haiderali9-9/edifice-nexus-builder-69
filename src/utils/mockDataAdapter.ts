
import { Project, Task, Resource, Expense, Document, Issue, ResourceAllocation } from "../types";

// This utility converts the old mock data format to match our database schema
export const adaptProject = (project: any): Project => ({
  id: project.id,
  name: project.name,
  description: project.description,
  client: project.client,
  location: project.location,
  start_date: project.startDate || project.start_date,
  end_date: project.endDate || project.end_date,
  budget: project.budget,
  status: project.status,
  completion: project.completion,
  manager_id: project.manager?.id || project.manager_id
});

export const adaptTask = (task: any): Task => ({
  id: task.id,
  project_id: task.projectId || task.project_id,
  name: task.name,
  description: task.description,
  status: task.status,
  priority: task.priority,
  start_date: task.startDate || task.start_date,
  end_date: task.endDate || task.end_date,
  created_at: task.created_at || new Date().toISOString(),
  task_assignments: task.assignedTo?.map((user: any) => ({
    id: `${task.id}-${user.id}`,
    task_id: task.id,
    user_id: user.id
  }))
});

export const adaptResource = (resource: any): Resource => ({
  id: resource.id,
  name: resource.name,
  type: resource.type,
  quantity: resource.quantity,
  unit: resource.unit,
  cost: resource.cost,
  status: resource.status,
  returnable: resource.returnable !== undefined ? resource.returnable : resource.type === 'Equipment',
  created_at: resource.created_at || new Date().toISOString(),
  resource_allocations: resource.allocated?.map((allocation: any) => ({
    id: `${resource.id}-${allocation.projectId || allocation.project_id}`,
    resource_id: resource.id,
    project_id: allocation.projectId || allocation.project_id,
    quantity: allocation.quantity
  }))
});

export const adaptDocument = (document: any): Document => ({
  id: document.id,
  project_id: document.projectId || document.project_id,
  name: document.name,
  type: document.type,
  upload_date: document.uploadDate || document.upload_date,
  url: document.url,
  uploaded_by: document.uploadedBy || document.uploaded_by,
  created_at: document.created_at || new Date().toISOString()
});

export const adaptIssue = (issue: any): Issue => ({
  id: issue.id,
  project_id: issue.projectId || issue.project_id,
  title: issue.title,
  description: issue.description,
  reported_by: issue.reportedBy || issue.reported_by,
  assigned_to: issue.assignedTo || issue.assigned_to,
  report_date: issue.reportDate || issue.report_date,
  status: issue.status,
  priority: issue.priority,
  resolution_date: issue.resolutionDate || issue.resolution_date,
  created_at: issue.created_at || new Date().toISOString()
});

// Use these adapter functions when retrieving mock data
// Example: const adaptedProjects = mockProjects.map(adaptProject);
