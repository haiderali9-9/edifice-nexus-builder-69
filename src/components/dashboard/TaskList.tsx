
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

type TaskStatus = "completed" | "in-progress" | "critical";

interface Task {
  id: number;
  title: string;
  description: string;
  facility: string;
  status: TaskStatus;
  dueDate: string;
  assignee: {
    name: string;
    avatar: string;
    initials: string;
  };
}

const TaskList = () => {
  const [tasks] = useState<Task[]>([
    {
      id: 1,
      title: "HVAC Maintenance - Building A",
      description: "Quarterly maintenance of HVAC systems",
      facility: "Building A",
      status: "completed",
      dueDate: "Completed today",
      assignee: {
        name: "Alex Johnson",
        avatar: "",
        initials: "AJ",
      },
    },
    {
      id: 2,
      title: "Plumbing Repair - Floor 3",
      description: "Fix leak in main restroom",
      facility: "Building B",
      status: "in-progress",
      dueDate: "Due in 2 days",
      assignee: {
        name: "Maria Garcia",
        avatar: "",
        initials: "MG",
      },
    },
    {
      id: 3,
      title: "Electrical System Inspection",
      description: "Annual inspection of electrical panels",
      facility: "Building C",
      status: "in-progress",
      dueDate: "Due tomorrow",
      assignee: {
        name: "Robert Lee",
        avatar: "",
        initials: "RL",
      },
    },
    {
      id: 4,
      title: "Roof Leak Investigation",
      description: "Determine source of leak in conference room",
      facility: "Building A",
      status: "critical",
      dueDate: "Overdue by 1 day",
      assignee: {
        name: "Sarah Wilson",
        avatar: "",
        initials: "SW",
      },
    },
    {
      id: 5,
      title: "Replace Security Cameras",
      description: "Install new security system at main entrance",
      facility: "Building D",
      status: "in-progress",
      dueDate: "Due in 5 days",
      assignee: {
        name: "David Miller",
        avatar: "",
        initials: "DM",
      },
    },
  ]);

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case "in-progress":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
      case "critical":
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>;
    }
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Recent Tasks</CardTitle>
        <CardDescription>Latest tasks across all facilities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start justify-between p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex gap-3 items-start">
                <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                <div>
                  <h3 className="font-medium text-sm">{task.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-secondary px-2 py-1 rounded">
                      {task.facility}
                    </span>
                    {getStatusBadge(task.status)}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={task.assignee.avatar} />
                  <AvatarFallback className="text-xs">
                    {task.assignee.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {task.dueDate}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskList;
