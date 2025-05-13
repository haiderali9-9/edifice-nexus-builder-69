
import React from "react";
import { Task } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Plus, Trash2 } from "lucide-react";

interface ProjectTasksTabProps {
  tasks: Task[] | undefined;
  isLoading: boolean;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const ProjectTasksTab = ({ 
  tasks, 
  isLoading, 
  onAddTask, 
  onEditTask, 
  onDeleteTask 
}: ProjectTasksTabProps) => {
  
  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case "Not Started":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Not Started</Badge>;
      case "In Progress":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "Completed":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case "Delayed":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Delayed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle>Project Tasks</CardTitle>
        <Button size="sm" onClick={onAddTask}>
          <Plus className="h-4 w-4 mr-2" /> Add Task
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks && tasks.length > 0 ? (
                tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.name}</TableCell>
                    <TableCell>{task.start_date ? new Date(task.start_date).toLocaleDateString() : 'Not set'}</TableCell>
                    <TableCell>{task.end_date ? new Date(task.end_date).toLocaleDateString() : 'Not set'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        task.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                        task.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                        task.priority === 'Medium' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{getTaskStatusBadge(task.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onEditTask(task)} title="Edit Task">
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onDeleteTask(task.id)}
                          title="Delete Task"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    No tasks added to this project yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectTasksTab;
