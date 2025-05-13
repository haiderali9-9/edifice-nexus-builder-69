
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign, ClipboardList, Package } from "lucide-react";

interface ProjectOverviewCardsProps {
  startDate: string;
  endDate: string; 
  budget: number;
  completedTasks: number;
  totalTasks: number;
}

const ProjectOverviewCards = ({ 
  startDate, 
  endDate, 
  budget, 
  completedTasks, 
  totalTasks 
}: ProjectOverviewCardsProps) => {
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Calculate days remaining
  const daysRemaining = () => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Timeline</p>
              <p className="text-lg font-medium">{daysRemaining()} days left</p>
              <p className="text-xs text-gray-500">
                {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Budget</p>
              <p className="text-lg font-medium">{formatCurrency(budget)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <ClipboardList className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tasks</p>
              <p className="text-lg font-medium">{completedTasks} / {totalTasks}</p>
              <p className="text-xs text-gray-500">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-full mr-4">
              <Package className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Resources</p>
              <p className="text-lg font-medium">
                <span className="text-sm text-gray-400">View in Resources tab</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectOverviewCards;
