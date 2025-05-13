
import React from "react";
import { Task } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus } from "lucide-react";
import ProjectWorkflow from "@/components/workflow/ProjectWorkflow";
import { ReactFlowProvider } from "@xyflow/react";

interface ProjectWorkflowTabProps {
  projectId: string;
  tasks: Task[] | undefined;
  onWorkflowSaved: () => void;
  onAddTaskClick: () => void;
}

const ProjectWorkflowTab = ({ 
  projectId, 
  tasks, 
  onWorkflowSaved,
  onAddTaskClick
}: ProjectWorkflowTabProps) => {
  
  if (tasks && tasks.length > 0) {
    return (
      <ReactFlowProvider>
        <ProjectWorkflow 
          projectId={projectId} 
          tasks={tasks} 
          onWorkflowSaved={onWorkflowSaved}
        />
      </ReactFlowProvider>
    );
  }
  
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <ClipboardList className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">No Tasks Available</p>
        <p className="text-gray-500 mb-6">Add tasks to the project before creating a workflow.</p>
        <Button onClick={onAddTaskClick}>
          <Plus className="h-4 w-4 mr-2" /> Add Task
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProjectWorkflowTab;
