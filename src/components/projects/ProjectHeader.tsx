
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { Project } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProjectHeaderProps {
  project: Project;
}

const ProjectHeader = ({ project }: ProjectHeaderProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Planning":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Planning</Badge>;
      case "In Progress":
        return <Badge variant="outline" className="bg-green-100 text-green-800">In Progress</Badge>;
      case "On Hold":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">On Hold</Badge>;
      case "Completed":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 text-gray-500 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">{project.location}</span>
            <span className="mx-2 text-gray-300">•</span>
            <span className="text-gray-500">Client: {project.client}</span>
          </div>
        </div>
        <div className="flex items-center">
          {getStatusBadge(project.status)}
          <Button
            className="ml-4"
            onClick={() => {
              navigate('/projects', { state: { editProject: project.id } });
            }}
          >
            Edit Project
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;
