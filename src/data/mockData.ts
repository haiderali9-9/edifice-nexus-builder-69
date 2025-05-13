import { Project, User, Task, Resource, Expense, Document, Issue } from '../types';

export const users: User[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@edifice.com',
    role: 'Project Manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  },
  {
    id: '2',
    name: 'Maria Rodriguez',
    email: 'maria.rodriguez@edifice.com',
    role: 'Architect',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
  },
  {
    id: '3',
    name: 'David Lee',
    email: 'david.lee@edifice.com',
    role: 'Civil Engineer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
  },
  {
    id: '4',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@edifice.com',
    role: 'Procurement Manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  },
  {
    id: '5',
    name: 'Michael Brown',
    email: 'michael.brown@edifice.com',
    role: 'Construction Supervisor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
  },
];

export const projects: Project[] = [
  {
    id: '1',
    name: 'City Center Tower',
    description: 'A 30-story commercial tower in downtown.',
    client: 'Metropolis Developments',
    location: 'Downtown Metro City',
    start_date: '2024-01-15',
    end_date: '2026-06-30',
    budget: 42000000,
    status: 'In Progress',
    completion: 35,
    manager_id: users[0].id,
  },
  {
    id: '2',
    name: 'Riverside Residences',
    description: 'Luxury residential complex with 120 units.',
    client: 'River View Properties',
    location: 'Riverside District',
    start_date: '2023-09-10',
    end_date: '2025-11-20',
    budget: 28500000,
    status: 'In Progress',
    completion: 45,
    manager_id: users[0].id,
  },
  {
    id: '3',
    name: 'Tech Park Phase II',
    description: 'Expansion of the technology park with 5 new buildings.',
    client: 'Technopark Inc.',
    location: 'Innovation District',
    start_date: '2024-03-01',
    end_date: '2026-12-15',
    budget: 56000000,
    status: 'Planning',
    completion: 5,
    manager_id: users[0].id,
  },
  {
    id: '4',
    name: 'Community Hospital Renovation',
    description: 'Complete renovation of the east wing of Community Hospital.',
    client: 'Metro Health Services',
    location: 'Eastside',
    start_date: '2023-11-10',
    end_date: '2024-10-25',
    budget: 12800000,
    status: 'In Progress',
    completion: 60,
    manager_id: users[0].id,
  },
  {
    id: '5',
    name: 'Green Valley Bridge',
    description: 'Construction of a new bridge connecting Green Valley to the city center.',
    client: 'Municipal Transport Authority',
    location: 'Green Valley',
    start_date: '2023-08-05',
    end_date: '2025-04-30',
    budget: 18600000,
    status: 'In Progress',
    completion: 70,
    manager_id: users[0].id,
  },
];

// Create task assignments based on users
const createTaskAssignments = (taskId: string, userIds: string[]) => {
  return userIds.map(userId => ({
    id: `${taskId}-${userId}`,
    task_id: taskId,
    user_id: userId
  }));
};

export const tasks: Task[] = [
  {
    id: '101',
    project_id: '1',
    name: 'Foundation Excavation',
    description: 'Excavate the site for laying foundation.',
    status: 'Completed',
    priority: 'High',
    start_date: '2024-01-20',
    end_date: '2024-03-15',
    task_assignments: createTaskAssignments('101', [users[4].id, users[2].id]),
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '102',
    project_id: '1',
    name: 'Steel Framework Installation',
    description: 'Install the main steel framework for the tower.',
    status: 'In Progress',
    priority: 'Critical',
    start_date: '2024-03-20',
    end_date: '2024-07-30',
    task_assignments: createTaskAssignments('102', [users[4].id]),
    created_at: '2024-03-15T10:00:00Z'
  },
  {
    id: '103',
    project_id: '1',
    name: 'Concrete Pouring - Floors 1-10',
    description: 'Pour and cure concrete for floors 1-10.',
    status: 'Not Started',
    priority: 'High',
    start_date: '2024-06-15',
    end_date: '2024-09-30',
    task_assignments: createTaskAssignments('103', [users[4].id]),
    created_at: '2024-05-01T10:00:00Z'
  },
  {
    id: '201',
    project_id: '2',
    name: 'Site Preparation',
    description: 'Clear the site and prepare for construction.',
    status: 'Completed',
    priority: 'High',
    start_date: '2023-09-15',
    end_date: '2023-10-30',
    task_assignments: createTaskAssignments('201', [users[4].id]),
    created_at: '2023-09-10T10:00:00Z'
  },
  {
    id: '202',
    project_id: '2',
    name: 'Foundation Work',
    description: 'Lay the foundations for all residential blocks.',
    status: 'Completed',
    priority: 'Critical',
    start_date: '2023-11-01',
    end_date: '2024-01-15',
    task_assignments: createTaskAssignments('202', [users[2].id, users[4].id]),
    created_at: '2023-10-25T10:00:00Z'
  },
  {
    id: '203',
    project_id: '2',
    name: 'Building Structures - Block A & B',
    description: 'Construct the main structures for Blocks A and B.',
    status: 'In Progress',
    priority: 'High',
    start_date: '2024-01-20',
    end_date: '2024-06-30',
    task_assignments: createTaskAssignments('203', [users[4].id]),
    created_at: '2024-01-15T10:00:00Z'
  },
];

// Create resource allocations
const createResourceAllocations = (resourceId: string, allocations: { project_id: string, quantity: number }[]) => {
  return allocations.map((allocation, index) => ({
    id: `${resourceId}-${index}`,
    resource_id: resourceId,
    project_id: allocation.project_id,
    quantity: allocation.quantity
  }));
};

export const resources: Resource[] = [
  {
    id: '1001',
    name: 'Concrete (High Grade)',
    type: 'Material',
    quantity: 1500,
    unit: 'cubic meters',
    cost: 120,
    status: 'Available',
    returnable: false,
    resource_allocations: createResourceAllocations('1001', [
      { project_id: '1', quantity: 600 },
      { project_id: '2', quantity: 450 }
    ]),
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '1002',
    name: 'Structural Steel',
    type: 'Material',
    quantity: 800,
    unit: 'tons',
    cost: 1800,
    status: 'Low Stock',
    returnable: false,
    resource_allocations: createResourceAllocations('1002', [
      { project_id: '1', quantity: 500 },
      { project_id: '5', quantity: 200 }
    ]),
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '1003',
    name: 'Tower Crane',
    type: 'Equipment',
    quantity: 3,
    unit: 'units',
    cost: 12000,
    status: 'Available',
    returnable: true,
    resource_allocations: createResourceAllocations('1003', [
      { project_id: '1', quantity: 1 },
      { project_id: '2', quantity: 1 }
    ]),
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '1004',
    name: 'Skilled Construction Workers',
    type: 'Labor',
    quantity: 120,
    unit: 'workers',
    cost: 250,
    status: 'Available',
    returnable: false,
    resource_allocations: createResourceAllocations('1004', [
      { project_id: '1', quantity: 45 },
      { project_id: '2', quantity: 35 },
      { project_id: '4', quantity: 20 },
      { project_id: '5', quantity: 15 }
    ]),
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '1005',
    name: 'Electrical Wiring',
    type: 'Material',
    quantity: 25000,
    unit: 'meters',
    cost: 3,
    status: 'Available',
    returnable: false,
    resource_allocations: createResourceAllocations('1005', [
      { project_id: '1', quantity: 8000 },
      { project_id: '2', quantity: 7000 },
      { project_id: '4', quantity: 4000 }
    ]),
    created_at: '2024-01-01T10:00:00Z'
  },
];

export const expenses: Expense[] = [
  {
    id: '10001',
    project_id: '1',
    category: 'Materials',
    amount: 580000,
    date: '2024-02-15',
    description: 'Initial concrete and steel purchase',
    approved: true,
    paid_by: 'Accounts Payable',
    created_at: '2024-02-15T10:00:00Z'
  },
  {
    id: '10002',
    project_id: '1',
    category: 'Equipment Rental',
    amount: 45000,
    date: '2024-02-20',
    description: 'Tower crane rental - 3 months advance',
    approved: true,
    paid_by: 'Accounts Payable',
    created_at: '2024-02-20T10:00:00Z'
  },
  {
    id: '10003',
    project_id: '2',
    category: 'Labor',
    amount: 320000,
    date: '2024-01-31',
    description: 'January labor costs',
    approved: true,
    paid_by: 'Accounts Payable',
    created_at: '2024-01-31T10:00:00Z'
  },
  {
    id: '10004',
    project_id: '2',
    category: 'Permits',
    amount: 75000,
    date: '2023-09-05',
    description: 'Construction permits and local authority fees',
    approved: true,
    paid_by: 'Project Manager',
    created_at: '2023-09-05T10:00:00Z'
  },
  {
    id: '10005',
    project_id: '4',
    category: 'Materials',
    amount: 230000,
    date: '2024-01-10',
    description: 'Medical-grade fixtures and materials',
    approved: false,
    paid_by: 'Pending Approval',
    created_at: '2024-01-10T10:00:00Z'
  },
];

export const documents: Document[] = [
  {
    id: 'doc1',
    project_id: '1',
    name: 'City Center Tower - Architectural Blueprints',
    type: 'Blueprint',
    upload_date: '2023-12-10',
    url: '#',
    uploaded_by: 'Maria Rodriguez',
    created_at: '2023-12-10T10:00:00Z'
  },
  {
    id: 'doc2',
    project_id: '1',
    name: 'City Center Tower - Construction Permit',
    type: 'Permit',
    upload_date: '2023-12-15',
    url: '#',
    uploaded_by: 'John Smith',
    created_at: '2023-12-15T10:00:00Z'
  },
  {
    id: 'doc3',
    project_id: '2',
    name: 'Riverside Residences - Structural Analysis',
    type: 'Report',
    upload_date: '2023-08-30',
    url: '#',
    uploaded_by: 'David Lee',
    created_at: '2023-08-30T10:00:00Z'
  },
  {
    id: 'doc4',
    project_id: '2',
    name: 'Riverside Residences - Client Contract',
    type: 'Contract',
    upload_date: '2023-09-01',
    url: '#',
    uploaded_by: 'John Smith',
    created_at: '2023-09-01T10:00:00Z'
  },
  {
    id: 'doc5',
    project_id: '4',
    name: 'Hospital Renovation - Health Department Approval',
    type: 'Permit',
    upload_date: '2023-10-25',
    url: '#',
    uploaded_by: 'Sarah Johnson',
    created_at: '2023-10-25T10:00:00Z'
  },
];

export const issues: Issue[] = [
  {
    id: 'issue1',
    project_id: '1',
    title: 'Foundation Material Quality Issue',
    description: 'The delivered concrete doesn\'t meet the specified quality standards.',
    reported_by: users[4],
    assigned_to: users[3],
    report_date: '2024-02-10',
    status: 'Resolved',
    priority: 'Critical',
    resolution_date: '2024-02-15',
    created_at: '2024-02-10T10:00:00Z'
  },
  {
    id: 'issue2',
    project_id: '1',
    title: 'Steel Delivery Delay',
    description: 'Primary steel supplier is reporting 3-week delay in delivery.',
    reported_by: users[3],
    assigned_to: users[0],
    report_date: '2024-03-05',
    status: 'In Progress',
    priority: 'High',
    created_at: '2024-03-05T10:00:00Z'
  },
  {
    id: 'issue3',
    project_id: '2',
    title: 'Unexpected Drainage Issue',
    description: 'Found poor soil drainage that wasn\'t in the initial surveys.',
    reported_by: users[2],
    assigned_to: users[2],
    report_date: '2023-11-20',
    status: 'Resolved',
    priority: 'Medium',
    resolution_date: '2023-12-10',
    created_at: '2023-11-20T10:00:00Z'
  },
  {
    id: 'issue4',
    project_id: '4',
    title: 'Hospital Equipment Compatibility',
    description: 'New electrical systems not compatible with existing hospital equipment.',
    reported_by: users[0],
    report_date: '2024-01-15',
    status: 'Open',
    priority: 'High',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'issue5',
    project_id: '5',
    title: 'Bridge Support Recalculation Needed',
    description: 'Recent geological survey suggests we need to recalculate load bearing.',
    reported_by: users[2],
    assigned_to: users[2],
    report_date: '2024-02-28',
    status: 'In Progress',
    priority: 'Critical',
    created_at: '2024-02-28T10:00:00Z'
  },
];

// Dashboard stats data
export const dashboardStats = {
  totalProjects: projects.length,
  activeProjects: projects.filter(p => p.status === 'In Progress').length,
  totalBudget: projects.reduce((sum, project) => sum + project.budget, 0),
  expensesToDate: expenses.reduce((sum, expense) => sum + expense.amount, 0),
  resourceUtilization: 68, // Percentage
  openIssues: issues.filter(issue => issue.status !== 'Resolved').length,
  delayedTasks: tasks.filter(task => task.status === 'Delayed').length,
  upcomingDeadlines: 4,
  monthlyProgress: [
    { month: 'Jan', planned: 8, actual: 7 },
    { month: 'Feb', planned: 15, actual: 12 },
    { month: 'Mar', planned: 22, actual: 20 },
    { month: 'Apr', planned: 28, actual: 25 },
  ],
  budgetDistribution: [
    { category: 'Labor', value: 40 },
    { category: 'Materials', value: 30 },
    { category: 'Equipment', value: 15 },
    { category: 'Permits', value: 5 },
    { category: 'Other', value: 10 },
  ],
};
