
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ResourceData {
  name: string;
  allocation: number;
  color: string;
}

const ResourceAllocation = () => {
  const resources: ResourceData[] = [
    {
      name: "Maintenance Team",
      allocation: 85,
      color: "bg-edifice-500",
    },
    {
      name: "Security Staff",
      allocation: 65,
      color: "bg-operation-500",
    },
    {
      name: "Cleaning Services",
      allocation: 92,
      color: "bg-amber-500",
    },
    {
      name: "Administrative Staff",
      allocation: 40,
      color: "bg-blue-500",
    },
  ];

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Resource Allocation</CardTitle>
        <CardDescription>Current team utilization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {resources.map((resource) => (
            <div key={resource.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{resource.name}</span>
                <span className="text-sm text-muted-foreground">
                  {resource.allocation}%
                </span>
              </div>
              <Progress value={resource.allocation} className="h-2" indicatorClassName={resource.color} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceAllocation;
