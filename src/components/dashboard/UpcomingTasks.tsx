
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/types";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Users } from "lucide-react";

interface UpcomingTasksProps {
  tasks: Task[];
}

const UpcomingTasks = ({ tasks }: UpcomingTasksProps) => {
  // Filter tasks that are upcoming (not started or in progress)
  const upcomingTasks = tasks
    .filter((task) => task.status === "Not Started" || task.status === "In Progress")
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 5);

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
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Delayed":
        return "bg-red-100 text-red-800";
      case "Not Started":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Upcoming Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {upcomingTasks.map((task) => (
          <div key={task.id} className="rounded-md border p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">{task.name}</h3>
              <Badge variant="outline" className={getPriorityClass(task.priority)}>
                {task.priority}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mb-3">{task.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-500">
                <CalendarClock className="h-3 w-3 mr-1" />
                <span>
                  {new Date(task.start_date).toLocaleDateString()} - {new Date(task.end_date).toLocaleDateString()}
                </span>
              </div>
              <Badge variant="outline" className={getStatusClass(task.status)}>
                {task.status}
              </Badge>
            </div>
            <div className="mt-3 flex items-center">
              <Users className="h-3 w-3 mr-1 text-gray-400" />
              <span className="text-xs text-gray-500">
                {task.task_assignments?.length || 0} {(task.task_assignments?.length || 0) === 1 ? "person" : "people"} assigned
              </span>
            </div>
          </div>
        ))}
        {upcomingTasks.length === 0 && (
          <div className="text-center py-6 text-gray-500">No upcoming tasks</div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingTasks;
