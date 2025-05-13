
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, User, AlertTriangle } from 'lucide-react';
import { Issue } from '@/types';

interface IssueDetailsProps {
  issue: Issue;
}

const IssueDetails: React.FC<IssueDetailsProps> = ({ issue }) => {
  const [open, setOpen] = React.useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Open</Badge>;
      case "In Progress":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "Resolved":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Critical</Badge>;
      case "High":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">High</Badge>;
      case "Medium":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Medium</Badge>;
      case "Low":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const formatUserName = (user: any) => {
    if (!user) return 'Unassigned';
    if (user === "unassigned") return "Unassigned";
    if (typeof user === 'string') return user;
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
          <span className="sr-only">View Details</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{issue.title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {getStatusBadge(issue.status)}
            {getPriorityBadge(issue.priority)}
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{issue.description || 'No description provided.'}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Reported on</p>
                  <p>{formatDate(issue.report_date)}</p>
                </div>
              </div>
              
              {issue.resolution_date && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Resolved on</p>
                    <p>{formatDate(issue.resolution_date)}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Reported by</p>
                  <p>{formatUserName(issue.reported_by)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned to</p>
                  <p>{formatUserName(issue.assigned_to)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IssueDetails;
