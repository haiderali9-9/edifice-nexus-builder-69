
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Report } from "@/services/reportService";
import { LineChart, BarChart, PieChart } from "recharts";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { AlertCircle, CheckCircle2, Clock, DollarSign } from "lucide-react";

interface ReportDisplayProps {
  report: Report;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report }) => {
  // Early return if report has no data
  if (!report.data) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
        <h3 className="text-lg font-medium">No data available</h3>
        <p className="text-gray-500">This report doesn't contain any data.</p>
      </div>
    );
  }

  // Render different report types
  switch (report.type) {
    case "progress":
      return <ProgressReportDisplay report={report} />;
    case "budget":
      return <BudgetReportDisplay report={report} />;
    case "resource":
      return <ResourceReportDisplay report={report} />;
    case "safety":
      return <SafetyReportDisplay report={report} />;
    case "productivity":
      return <ProductivityReportDisplay report={report} />;
    case "satisfaction":
      return <SatisfactionReportDisplay report={report} />;
    default:
      return (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
          <h3 className="text-lg font-medium">Unknown Report Type</h3>
          <p className="text-gray-500">Report type not recognized.</p>
        </div>
      );
  }
};

const ProgressReportDisplay: React.FC<{ report: Report }> = ({ report }) => {
  const data = report.data as any;
  
  // Prepare data for chart
  const chartData = [
    { name: "Complete", value: data.completionPercentage },
    { name: "Remaining", value: 100 - data.completionPercentage }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tasks Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.tasksCompleted} / {data.tasksTotal}
            </div>
            <Progress 
              value={data.tasksTotal > 0 ? (data.tasksCompleted / data.tasksTotal) * 100 : 0} 
              className="h-2 mt-2" 
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completion Percentage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.completionPercentage}%</div>
            <Progress 
              value={data.completionPercentage} 
              className="h-2 mt-2" 
              indicatorClassName={`${
                data.completionPercentage >= 75 ? 'bg-green-500' : 
                data.completionPercentage >= 50 ? 'bg-yellow-500' : 
                'bg-orange-500'
              }`}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Days Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <Clock className="mr-2 h-5 w-5 text-gray-400" />
              {data.daysRemaining}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              End date: {new Date(data.endDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.milestones.map((milestone: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{milestone.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      milestone.status === "Completed" 
                        ? "bg-green-100 text-green-800" 
                        : milestone.status === "In Progress" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {milestone.status}
                    </span>
                  </TableCell>
                  <TableCell>{milestone.dueDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const BudgetReportDisplay: React.FC<{ report: Report }> = ({ report }) => {
  const data = report.data as any;
  
  // Prepare data for charts
  const pieData = data.expenses.map((expense: any) => ({
    name: expense.category,
    value: expense.amount
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <DollarSign className="h-5 w-5 text-gray-400" />
              {data.totalBudget.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <DollarSign className="h-5 w-5 text-gray-400" />
              {data.totalSpent.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {data.percentageUsed}% of budget used
            </div>
            <Progress 
              value={data.percentageUsed} 
              className="h-2 mt-2" 
              indicatorClassName={`${
                data.percentageUsed > 90 ? 'bg-red-500' : 
                data.percentageUsed > 75 ? 'bg-orange-500' : 
                'bg-green-500'
              }`}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Remaining Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <DollarSign className="h-5 w-5 text-gray-400" />
              {data.remaining.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expenses Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.expenses.map((expense: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{expense.category}</TableCell>
                  <TableCell>${expense.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="mr-2">{expense.percentage}%</span>
                      <Progress value={expense.percentage} className="h-2 w-24" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const ResourceReportDisplay: React.FC<{ report: Report }> = ({ report }) => {
  const data = report.data as any;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalResources}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Average Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageUtilization}%</div>
            <Progress 
              value={data.averageUtilization} 
              className="h-2 mt-2" 
              indicatorClassName={`${
                data.averageUtilization > 90 ? 'bg-red-500' : 
                data.averageUtilization > 75 ? 'bg-green-500' : 
                data.averageUtilization > 50 ? 'bg-yellow-500' : 
                'bg-orange-500'
              }`}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Allocated</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.resources.map((resource: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{resource.name}</TableCell>
                  <TableCell>{resource.type}</TableCell>
                  <TableCell>{resource.allocated}</TableCell>
                  <TableCell>{resource.available}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="mr-2">{resource.utilizationRate}%</span>
                      <Progress 
                        value={resource.utilizationRate} 
                        className="h-2 w-24" 
                        indicatorClassName={`${
                          resource.utilizationRate > 90 ? 'bg-red-500' : 
                          resource.utilizationRate > 75 ? 'bg-green-500' : 
                          resource.utilizationRate > 50 ? 'bg-yellow-500' : 
                          'bg-orange-500'
                        }`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const SafetyReportDisplay: React.FC<{ report: Report }> = ({ report }) => {
  const data = report.data as any;
  
  // Prepare data for chart
  const pieData = Object.entries(data.incidentsByPriority).map(([priority, count]) => ({
    name: priority,
    value: count as number
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalIncidents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              {data.resolvedIncidents}
            </div>
            <Progress 
              value={(data.resolvedIncidents / data.totalIncidents) * 100} 
              className="h-2 mt-2" 
              indicatorClassName="bg-green-500"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
              {data.openIncidents}
            </div>
            <Progress 
              value={(data.openIncidents / data.totalIncidents) * 100} 
              className="h-2 mt-2" 
              indicatorClassName="bg-orange-500"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incidents by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(data.incidentsByPriority).map(([priority, count]: [string, any]) => (
                <TableRow key={priority}>
                  <TableCell className="font-medium">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      priority === "Critical" 
                        ? "bg-red-100 text-red-800" 
                        : priority === "High" 
                        ? "bg-orange-100 text-orange-800" 
                        : priority === "Medium" 
                        ? "bg-yellow-100 text-yellow-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {priority}
                    </span>
                  </TableCell>
                  <TableCell>{count}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="mr-2">
                        {Math.round((count / data.totalIncidents) * 100)}%
                      </span>
                      <Progress 
                        value={(count / data.totalIncidents) * 100} 
                        className="h-2 w-24" 
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Incidents by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(data.incidentsByProject).map(([project, count]: [string, any]) => (
                <TableRow key={project}>
                  <TableCell className="font-medium">{project}</TableCell>
                  <TableCell>{count}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="mr-2">
                        {Math.round((count / data.totalIncidents) * 100)}%
                      </span>
                      <Progress 
                        value={(count / data.totalIncidents) * 100} 
                        className="h-2 w-24" 
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const ProductivityReportDisplay: React.FC<{ report: Report }> = ({ report }) => {
  const data = report.data as any;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tasks Completed Per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.tasksCompletedPerDay}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Average Task Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageTaskCompletionTime} days</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Resource Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.resourceEfficiency}%</div>
            <Progress value={data.resourceEfficiency} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Schedule Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">{data.projectsOnSchedule}</div>
                  <p className="text-sm text-gray-500 mt-2">Projects On Schedule</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500">{data.projectsBehindSchedule}</div>
                  <p className="text-sm text-gray-500 mt-2">Projects Behind Schedule</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SatisfactionReportDisplay: React.FC<{ report: Report }> = ({ report }) => {
  const data = report.data as any;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Average Client Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-3xl font-bold">{data.averageRating}</div>
              <div className="ml-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-xl ${i < Math.round(data.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.clientFeedback.map((feedback: any, i: number) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-medium">{feedback.client}</div>
                      <div className="text-xs text-gray-500">{feedback.project}</div>
                    </div>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`${i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm italic text-gray-600">"{feedback.feedback}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportDisplay;
