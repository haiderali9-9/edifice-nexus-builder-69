
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProjectProgressProps {
  completion: number;
  completedTasks: number;
  totalTasks: number;
}

const ProjectProgress = ({ completion, completedTasks, totalTasks }: ProjectProgressProps) => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-0">
        <CardTitle>Progress</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">{completion}% Complete</span>
            <span className="text-gray-500">{completedTasks} of {totalTasks} tasks completed</span>
          </div>
          <Progress value={completion} indicatorClassName="bg-construction-600" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectProgress;
