import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MoreHorizontal, AlertTriangle } from "lucide-react";
import IssueForm from "@/components/issues/IssueForm";
import IssueDetails from "@/components/issues/IssueDetails";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const Issues = () => {
  const location = useLocation();
  const initialProjectId = location.state?.projectId;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(initialProjectId || null);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { toast } = useToast();
  
  useEffect(() => {
    if (location.state?.projectId) {
      setProjectFilter(location.state.projectId);
    }
  }, [location.state]);
  
  const { data: issues, isLoading, isError, refetch } = useQuery({
    queryKey: ['issues', projectFilter],
    queryFn: async () => {
      let query = supabase
        .from('issues')
        .select(`
          *,
          reported_by:profiles!reported_by(id, first_name, last_name),
          assigned_to:profiles!assigned_to(id, first_name, last_name),
          projects:project_id(id, name)
        `);
      
      if (projectFilter) {
        query = query.eq('project_id', projectFilter);
      }
      
      const { data, error } = await query.order('report_date', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-simple'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const filteredIssues = issues ? issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (issue.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter ? issue.status === statusFilter : true;
    const matchesPriority = priorityFilter ? issue.priority === priorityFilter : true;

    return matchesSearch && matchesStatus && matchesPriority;
  }) : [];

  const getProjectName = (projectId: string) => {
    const project = projects?.find((p) => p.id === projectId);
    return project ? project.name : "Unknown Project";
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

  const formatUserName = (user: any) => {
    if (!user) return "Unassigned";
    if (user === "unassigned") return "Unassigned";
    if (typeof user === 'string') return user;
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.id;
  };

  const handleEditIssue = (issue: any) => {
    setSelectedIssue(issue);
    setIsEditDialogOpen(true);
  };

  const handleIssueAction = async (action: string, issue: any) => {
    switch (action) {
      case 'edit':
        handleEditIssue(issue);
        break;
      case 'assign':
        toast({
          title: "Assign Issue",
          description: `Assigning issue: ${issue.title}`,
        });
        break;
      case 'resolve':
        try {
          const { error } = await supabase
            .from('issues')
            .update({ 
              status: 'Resolved',
              resolution_date: new Date().toISOString()
            })
            .eq('id', issue.id);
          
          if (error) throw error;
          
          toast({
            title: "Issue Resolved",
            description: `Issue ${issue.title} has been marked as resolved`,
          });
          
          refetch();
        } catch (error) {
          console.error("Error resolving issue:", error);
          toast({
            title: "Error",
            description: "Failed to resolve issue. Please try again.",
            variant: "destructive"
          });
        }
        break;
      default:
        break;
    }
  };
  
  const handleIssueCreated = () => {
    refetch();
    toast({
      title: "Issue Submitted",
      description: "Your issue has been reported and will be reviewed",
    });
  };

  const handleIssueUpdated = () => {
    refetch();
    setSelectedIssue(null);
    toast({
      title: "Issue Updated",
      description: "The issue has been updated successfully",
    });
  };

  if (isError) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Error Loading Issues</h2>
            <p className="text-gray-500 mb-4">There was a problem loading the issues data.</p>
            <Button 
              variant="outline" 
              onClick={() => refetch()}
            >
              Try Again
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const openCount = issues ? issues.filter(i => i.status === "Open").length : 0;
  const inProgressCount = issues ? issues.filter(i => i.status === "In Progress").length : 0;
  const resolvedCount = issues ? issues.filter(i => i.status === "Resolved").length : 0;
  const criticalCount = issues ? issues.filter(i => i.priority === "Critical" && i.status !== "Resolved").length : 0;

  return (
    <PageLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issues</h1>
          <p className="text-gray-500 mt-1">
            Track and resolve problems across all projects
          </p>
        </div>
        <IssueForm 
          onIssueCreated={handleIssueCreated} 
          initialProjectId={projectFilter || undefined}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="bg-gray-100 p-3 rounded-full mb-2">
                <AlertTriangle className="h-6 w-6 text-gray-500" />
              </div>
              <p className="text-lg font-medium">{openCount}</p>
              <p className="text-sm text-gray-500">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="bg-blue-100 p-3 rounded-full mb-2">
                <AlertTriangle className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-lg font-medium">{inProgressCount}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="bg-green-100 p-3 rounded-full mb-2">
                <AlertTriangle className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-lg font-medium">{resolvedCount}</p>
              <p className="text-sm text-gray-500">Resolved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="bg-red-100 p-3 rounded-full mb-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-lg font-medium">{criticalCount}</p>
              <p className="text-sm text-gray-500">Critical</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search issues..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {projectFilter ? getProjectName(projectFilter) : "All Projects"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setProjectFilter(null)}>
                  All Projects
                </DropdownMenuItem>
                {projects?.map(project => (
                  <DropdownMenuItem 
                    key={project.id} 
                    onClick={() => setProjectFilter(project.id)}
                  >
                    {project.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {statusFilter ? statusFilter : "All Statuses"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Open")}>
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("In Progress")}>
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Resolved")}>
                  Resolved
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {priorityFilter ? priorityFilter : "All Priorities"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setPriorityFilter(null)}>
                  All Priorities
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter("Critical")}>
                  Critical
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter("High")}>
                  High
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter("Medium")}>
                  Medium
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter("Low")}>
                  Low
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Reported By</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                      <span className="ml-3">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="max-w-[240px]">
                        <div className="font-medium">{issue.title}</div>
                        <div className="text-gray-500 text-xs truncate">{issue.description}</div>
                      </TableCell>
                      <TableCell>
                        {issue.projects ? issue.projects.name : getProjectName(issue.project_id)}
                      </TableCell>
                      <TableCell>{formatUserName(issue.reported_by)}</TableCell>
                      <TableCell>{formatUserName(issue.assigned_to)}</TableCell>
                      <TableCell>{new Date(issue.report_date).toLocaleDateString()}</TableCell>
                      <TableCell>{getPriorityBadge(issue.priority)}</TableCell>
                      <TableCell>{getStatusBadge(issue.status)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <IssueDetails issue={issue} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditIssue(issue)}>
                                Edit Issue
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleIssueAction('assign', issue)}>
                                Assign
                              </DropdownMenuItem>
                              {issue.status !== "Resolved" && (
                                <DropdownMenuItem onClick={() => handleIssueAction('resolve', issue)}>
                                  Mark as Resolved
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredIssues.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                        No issues found matching your filters
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedIssue && (
        <IssueForm
          isEditing={true}
          initialData={selectedIssue}
          initialProjectId={selectedIssue.project_id}
          onIssueCreated={handleIssueUpdated}
        />
      )}
    </PageLayout>
  );
};

export default Issues;
