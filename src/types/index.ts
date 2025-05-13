
// Types for project entities
export interface Task {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  start_date?: string;
  end_date?: string;
  created_at: string;
  task_assignments?: TaskAssignment[];
  task_resources?: TaskResource[];
  dependencies?: TaskDependency[];
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string;
  user?: User;
}

export interface TaskResource {
  id: string;
  task_id: string;
  resource_id: string;
  hours?: number;
  days?: number;
  quantity?: number;
  resource?: Resource;
}

export interface TaskDependency {
  id: string;
  project_id: string;
  source_task_id: string;
  target_task_id: string;
  created_at: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  project_id: string | null;
  upload_date: string;
  uploaded_by: string | null;
  projects?: {
    name: string;
  };
  created_at?: string; 
}

export interface Issue {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'Open' | 'In Progress' | 'Resolved' | string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  report_date: string;
  resolution_date?: string;
  reported_by: string | User;
  assigned_to?: string | User;
  created_at: string;
  projects?: {
    name: string;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  client: string;
  location: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed';
  completion: number;
  manager_id: string;
  created_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Resource {
  id: string;
  name: string;
  type: 'Material' | 'Equipment' | 'Labor' | string;
  quantity: number;
  unit: string;
  cost: number;
  status: 'Available' | 'Low Stock' | 'Out of Stock' | string;
  returnable: boolean;
  resource_allocations?: ResourceAllocation[];
  created_at?: string;
  available?: number;
  allocated?: number;
  hour_rate?: number;
  day_rate?: number;
}

export interface ResourceAllocation {
  id: string;
  resource_id: string;
  project_id: string;
  quantity: number;
  created_at?: string;
  consumed?: boolean;
  projects?: {
    name: string;
  };
  days?: number;
  hours?: number;
}

export interface Expense {
  id: string;
  project_id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  approved: boolean;
  paid_by: string;
  created_at?: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  project_id: string;
  type: string;
  date: string;
  start_time: string;
  end_time: string;
  description?: string;
  resource_ids?: string[];
  created_at: string;
  projects?: {
    name: string;
  };
}
