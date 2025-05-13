
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Issue } from "@/types";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar } from "lucide-react";

interface RecentIssuesProps {
  issues: Issue[];
}

const RecentIssues = ({ issues }: RecentIssuesProps) => {
  // Sort by date (most recent first) and filter non-resolved
  const recentIssues = issues
    .filter((issue) => issue.status !== "Resolved")
    .sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime())
    .slice(0, 4);

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-blue-100 text-blue-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Open":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Recent Issues</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentIssues.map((issue) => (
          <div key={issue.id} className="p-3 border border-gray-200 rounded-md">
            <div className="flex items-start justify-between mb-2">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <h3 className="font-medium">{issue.title}</h3>
              </div>
              <Badge variant="outline" className={getPriorityClass(issue.priority)}>
                {issue.priority}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mb-2 truncate">{issue.description}</p>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{new Date(issue.report_date).toLocaleDateString()}</span>
              </div>
              <Badge variant="outline" className={getStatusClass(issue.status)}>
                {issue.status}
              </Badge>
            </div>
          </div>
        ))}
        {recentIssues.length === 0 && (
          <div className="text-center py-8 text-gray-500">No active issues</div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentIssues;
