import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  Download, 
  Filter, 
  Share2, 
  MoreHorizontal,
  Calendar,
  FileText,
  Loader2
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { reportService, Report, ReportParams } from "@/services/reportService";
import { useAuth } from "@/contexts/AuthContext";
import ReportDisplay from "@/components/reports/ReportDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { DateRange } from "react-day-picker";

const Reports = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [filterType, setFilterType] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Fetch reports using react-query
  const { 
    data: reports = [], 
    isLoading: isLoadingReports,
    error: reportsError,
    refetch: refetchReports
  } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportService.getReports(),
  });

  // Fetch projects for filtering
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name');
      
      if (error) throw error;
      return data;
    },
  });

  // Filter reports by type if filter is applied
  const filteredReports = filterType
    ? reports.filter(report => report.type === filterType)
    : reports;

  // Report types configuration
  const reportTypes = [
    { 
      title: "Project Progress Report", 
      description: "Overview of all project milestones and progress", 
      icon: <LineChart className="h-10 w-10 text-blue-500" />,
      type: "progress" as const
    },
    { 
      title: "Budget Utilization Report", 
      description: "Financial breakdown of project spending", 
      icon: <PieChart className="h-10 w-10 text-green-500" />,
      type: "budget" as const
    },
    { 
      title: "Resource Allocation Report", 
      description: "Analysis of resource distribution across projects", 
      icon: <BarChart3 className="h-10 w-10 text-purple-500" />,
      type: "resource" as const
    },
    { 
      title: "Safety Incident Report", 
      description: "Summary of safety incidents and resolutions", 
      icon: <FileText className="h-10 w-10 text-red-500" />,
      type: "safety" as const
    },
    { 
      title: "Productivity Analysis", 
      description: "Team and contractor productivity metrics", 
      icon: <LineChart className="h-10 w-10 text-orange-500" />,
      type: "productivity" as const
    },
    { 
      title: "Client Satisfaction Report", 
      description: "Feedback and satisfaction metrics from clients", 
      icon: <PieChart className="h-10 w-10 text-indigo-500" />,
      type: "satisfaction" as const
    }
  ];

  const handleGenerateReport = async (reportType: ReportParams["type"]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to generate reports.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(reportType);

    try {
      const params: ReportParams = {
        type: reportType,
        projectId: selectedProjectId === "all" ? undefined : selectedProjectId || undefined,
        dateRangeStart: dateRange?.from,
        dateRangeEnd: dateRange?.to,
      };

      // Generate and save the report
      const newReport = await reportService.generateReport(params);
      
      toast({
        title: "Report Generated",
        description: `Your ${reportType} report has been created.`,
      });

      // Refetch the reports list
      refetchReports();

      // Open the newly created report
      setSelectedReport(newReport);
      setIsReportOpen(true);

    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await reportService.deleteReport(reportId);
      
      toast({
        title: "Report Deleted",
        description: "The report has been deleted successfully.",
      });
      
      // Refetch the reports list
      refetchReports();
      
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Error",
        description: "Failed to delete report.",
        variant: "destructive",
      });
    }
  };

  const handleViewReport = async (reportId: string) => {
    try {
      const report = await reportService.getReportById(reportId);
      if (report) {
        setSelectedReport(report);
        setIsReportOpen(true);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast({
        title: "Error",
        description: "Failed to load report.",
        variant: "destructive",
      });
    }
  };

  // Handle error from react-query
  useEffect(() => {
    if (reportsError) {
      toast({
        title: "Error",
        description: "Failed to load reports. Please try again.",
        variant: "destructive",
      });
    }
  }, [reportsError, toast]);

  return (
    <PageLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-gray-500 mt-1">
            Generate and analyze reports for your projects
          </p>
        </div>
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" /> 
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Date Range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" /> Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setFilterType(null)}>
                All Reports
              </DropdownMenuItem>
              {reportTypes.map((type) => (
                <DropdownMenuItem 
                  key={type.type} 
                  onSelect={() => setFilterType(type.type)}
                >
                  {type.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            Access your previously generated reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingReports ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div>
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium">No reports found</h3>
              <p className="text-sm text-gray-500 mt-1">
                Generate a new report to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.slice(0, 5).map((report) => (
                <div 
                  key={report.id} 
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${
                      report.type === 'progress' ? 'bg-blue-100 text-blue-500' :
                      report.type === 'budget' ? 'bg-green-100 text-green-500' :
                      report.type === 'resource' ? 'bg-purple-100 text-purple-500' :
                      report.type === 'safety' ? 'bg-red-100 text-red-500' :
                      report.type === 'productivity' ? 'bg-orange-100 text-orange-500' :
                      'bg-indigo-100 text-indigo-500'
                    }`}>
                      {report.type === 'progress' ? <LineChart className="h-5 w-5" /> :
                       report.type === 'budget' ? <PieChart className="h-5 w-5" /> :
                       report.type === 'resource' ? <BarChart3 className="h-5 w-5" /> :
                       report.type === 'safety' ? <FileText className="h-5 w-5" /> :
                       report.type === 'productivity' ? <LineChart className="h-5 w-5" /> :
                       <PieChart className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="text-base font-medium">{report.title}</h3>
                      <p className="text-sm text-gray-500">
                        Generated on {new Date(report.generated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => {
                      toast({
                        title: "Download Started",
                        description: "Your report is being downloaded.",
                      });
                    }}>
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => {
                      toast({
                        title: "Feature Coming Soon",
                        description: "Share functionality will be implemented soon.",
                      });
                    }}>
                      <Share2 className="h-4 w-4" />
                      <span className="sr-only">Share</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">More</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewReport(report.id)}>
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const reportType = reportTypes.find(t => t.type === report.type);
                          if (reportType) {
                            handleGenerateReport(reportType.type);
                          }
                        }}>
                          Regenerate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteReport(report.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-4">Generate New Report</h2>
      <div className="mb-4">
        <Select onValueChange={setSelectedProjectId} value={selectedProjectId ?? ""}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project: any) => (
              <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-lg bg-gray-100">
                  {report.icon}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      toast({
                        title: "Feature Coming Soon",
                        description: "Schedule functionality will be implemented soon.",
                      });
                    }}>
                      Schedule Report
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      toast({
                        title: "Feature Coming Soon",
                        description: "Customize functionality will be implemented soon.",
                      });
                    }}>
                      Customize
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardTitle className="text-lg">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-construction-600 hover:bg-construction-700"
                onClick={() => handleGenerateReport(report.type)}
                disabled={isGenerating !== null}
              >
                {isGenerating === report.type ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  'Generate Report'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Viewing Dialog */}
      {selectedReport && (
        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedReport.title}</DialogTitle>
              <DialogDescription>
                Generated on {new Date(selectedReport.generated_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              <ReportDisplay report={selectedReport} />
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsReportOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                toast({
                  title: "Download Started",
                  description: "Your report is being downloaded.",
                });
              }}>
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PageLayout>
  );
};

export default Reports;
