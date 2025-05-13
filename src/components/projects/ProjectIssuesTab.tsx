
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProjectIssues from "@/components/projects/ProjectIssues";

interface ProjectIssuesTabProps {
  projectId: string;
}

const ProjectIssuesTab = ({ projectId }: ProjectIssuesTabProps) => {
  const navigate = useNavigate();
  
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle>Project Issues</CardTitle>
        <Button 
          size="sm" 
          onClick={() => navigate(`/issues`, { state: { projectId } })}
        >
          <Plus className="h-4 w-4 mr-2" /> Report Issue
        </Button>
      </CardHeader>
      <CardContent>
        {projectId && <ProjectIssues projectId={projectId} />}
      </CardContent>
    </Card>
  );
};

export default ProjectIssuesTab;
