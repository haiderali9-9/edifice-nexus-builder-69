
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  TrendingUp, 
  TrendingDown 
} from "lucide-react";

const DashboardMetrics = () => {
  const metrics = [
    {
      title: "Active Facilities",
      value: "14",
      change: "+2",
      trend: "up",
      icon: Building,
      color: "bg-edifice-100 text-edifice-800",
    },
    {
      title: "Tasks Completed",
      value: "245",
      change: "+12%",
      trend: "up",
      icon: CheckCircle2,
      color: "bg-operation-100 text-operation-800",
    },
    {
      title: "Scheduled Tasks",
      value: "36",
      change: "-4",
      trend: "down",
      icon: Clock,
      color: "bg-blue-100 text-blue-800",
    },
    {
      title: "Critical Issues",
      value: "5",
      change: "-2",
      trend: "down",
      icon: AlertTriangle,
      color: "bg-amber-100 text-amber-800",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${metric.color}`}>
              <metric.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <div className="flex items-center pt-1 text-xs">
              {metric.trend === "up" ? (
                <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span
                className={
                  metric.trend === "up" ? "text-emerald-500" : "text-red-500"
                }
              >
                {metric.change}
              </span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardMetrics;
