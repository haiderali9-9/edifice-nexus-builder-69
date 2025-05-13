
import MainLayout from "@/components/layout/MainLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import TaskList from "@/components/dashboard/TaskList";
import ResourceAllocation from "@/components/dashboard/ResourceAllocation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart } from "@/components/ui/area-chart";
import { BarChart } from "@/components/ui/bar-chart";

const Index = () => {
  // Sample chart data
  const areaChartData = [
    { date: "Jan", operations: 120, maintenance: 85 },
    { date: "Feb", operations: 132, maintenance: 75 },
    { date: "Mar", operations: 129, maintenance: 96 },
    { date: "Apr", operations: 145, maintenance: 105 },
    { date: "May", operations: 152, maintenance: 92 },
    { date: "Jun", operations: 146, maintenance: 98 },
    { date: "Jul", operations: 159, maintenance: 103 },
  ];

  const barChartData = [
    { name: "Building A", value: 40 },
    { name: "Building B", value: 30 },
    { name: "Building C", value: 20 },
    { name: "Building D", value: 27 },
    { name: "Building E", value: 18 },
  ];

  return (
    <MainLayout>
      <DashboardHeader />
      <div className="space-y-6">
        <DashboardMetrics />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TaskList />
          <ResourceAllocation />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Operations Overview</CardTitle>
              <CardDescription>Monthly operations vs maintenance costs</CardDescription>
            </CardHeader>
            <CardContent>
              <AreaChart 
                data={areaChartData}
                categories={["operations", "maintenance"]}
                index="date"
                colors={["#0ea5e9", "#10b981"]}
                yAxisWidth={40}
                height={300}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Work Orders by Building</CardTitle>
              <CardDescription>Current distribution of work orders</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart 
                data={barChartData}
                index="name"
                categories={["value"]}
                colors={["#8b5cf6"]}
                yAxisWidth={40}
                height={300}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
