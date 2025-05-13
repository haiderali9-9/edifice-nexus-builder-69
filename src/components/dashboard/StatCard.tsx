
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "default" | "blue" | "green" | "yellow" | "red";
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = "default",
}: StatCardProps) => {
  // Define color variations
  const colorVariants = {
    default: {
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
    },
    blue: {
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    green: {
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    yellow: {
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    red: {
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
  };

  const { iconBg, iconColor } = colorVariants[color];

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        <div className={`${iconBg} ${iconColor} p-2 rounded-md`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        {trend && (
          <div
            className={`flex items-center mt-2 text-xs ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend.isPositive ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3 h-3 mr-1"
              >
                <path
                  fillRule="evenodd"
                  d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3 h-3 mr-1"
              >
                <path
                  fillRule="evenodd"
                  d="M1.22 5.222a.75.75 0 011.06 0L7 9.942l3.768-3.769a.75.75 0 011.113.058 20.908 20.908 0 013.813 7.254l1.574-2.727a.75.75 0 011.3.75l-2.475 4.286a.75.75 0 01-.617.381l-4.97.116a.75.75 0 01-.32-1.428l3.177-.074a18.408 18.408 0 00-3.55-6.673L7 10.942l-4.72-4.72a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>{trend.value}%</span>
            <span className="ml-1">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
