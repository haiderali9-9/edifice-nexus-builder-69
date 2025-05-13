
import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart as RechartsAreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface AreaChartProps {
  data: any[];
  categories: string[];
  index: string;
  colors?: string[];
  yAxisWidth?: number;
  height?: number;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  categories,
  index,
  colors = ["#0ea5e9", "#10b981"],
  yAxisWidth = 40,
  height = 300
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey={index}
          tick={{ fill: '#6b7280', fontSize: 12 }}
          tickLine={{ stroke: '#e5e7eb' }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis 
          width={yAxisWidth}
          tick={{ fill: '#6b7280', fontSize: 12 }}
          tickLine={{ stroke: '#e5e7eb' }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <Tooltip />
        <Legend />
        {categories.map((category, i) => (
          <Area
            key={category}
            type="monotone"
            dataKey={category}
            fill={colors[i % colors.length]}
            stroke={colors[i % colors.length]}
            fillOpacity={0.2}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
};
