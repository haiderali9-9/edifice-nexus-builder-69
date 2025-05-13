import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Issue } from '@/types';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import IssueDetails from '@/components/issues/IssueDetails';
import IssueForm from '@/components/issues/IssueForm';

interface ProjectIssuesProps {
  projectId: string;
}

const ProjectIssues: React.FC<ProjectIssuesProps> = ({ projectId }) => {
  const { toast } = useToast();
  const [selectedIssue, setSelectedIssue] = React.useState<Issue | null>(null);

  // Fetch project issues
  const { data: issues, isLoading, isError, refetch } = useQuery({
    queryKey: ['project-issues', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issues')
        .select(`
          *,
          reported_by:profiles!reported_by(id, first_name, last_name),
          assigned_to:profiles!assigned_to(id, first_name, last_name)
        `)
        .eq('project_id', projectId)
        .order('report_date', { ascending: false });
      
      if (error) throw error;
      return data as Issue[];
    },
  });

  const handleResolveIssue = async (issueId: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ 
          status: 'Resolved',
          resolution_date: new Date().toISOString()
        })
        .eq('id', issueId);
      
      if (error) throw error;
      
      toast({
        title: "Issue Resolved",
        description: "The issue has been marked as resolved."
      });
      
      refetch();
    } catch (error) {
      console.error("Error resolving issue:", error);
      toast({
        title: "Action Failed",
        description: "Could not resolve the issue. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditIssue = (issue: Issue) => {
    setSelectedIssue(issue);
  };

  const handleIssueUpdated = () => {
    refetch();
    setSelectedIssue(null);
    toast({
      title: "Issue Updated",
      description: "The issue has been updated successfully"
    });
  };

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
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium">Failed to load issues</h3>
        <p className="text-gray-500 mt-2">There was a problem loading the project issues.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => refetch()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Project Issues</h3>
        <IssueForm 
          initialProjectId={projectId}
          onIssueCreated={() => refetch()}
        />
      </div>
      
      {issues && issues.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell className="max-w-[240px]">
                  <div className="font-medium">{issue.title}</div>
                  <div className="text-gray-500 text-xs truncate">{issue.description}</div>
                </TableCell>
                <TableCell>{formatUserName(issue.reported_by)}</TableCell>
                <TableCell>{formatUserName(issue.assigned_to)}</TableCell>
                <TableCell>{new Date(issue.report_date).toLocaleDateString()}</TableCell>
                <TableCell>{getPriorityBadge(issue.priority)}</TableCell>
                <TableCell>{getStatusBadge(issue.status)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <IssueDetails issue={issue} />
                    <Button variant="ghost" size="sm" onClick={() => handleEditIssue(issue)}>
                      Edit
                    </Button>
                    {issue.status !== 'Resolved' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleResolveIssue(issue.id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-12 border rounded-md bg-gray-50">
          <p className="text-gray-500">No issues reported for this project.</p>
        </div>
      )}

      {/* Edit Issue Dialog */}
      {selectedIssue && (
        <IssueForm
          isEditing={true}
          initialData={selectedIssue}
          initialProjectId={projectId}
          onIssueCreated={handleIssueUpdated}
        />
      )}
    </div>
  );
};

export default ProjectIssues;
