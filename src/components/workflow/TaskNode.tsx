
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Task } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TaskNodeProps {
  data: {
    task: Task;
    connectionCondition?: string;
  };
}

const TaskNode: React.FC<TaskNodeProps> = ({ data }) => {
  const { task, connectionCondition } = data;

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Not Started':
        return 'bg-gray-100 text-gray-800';
      case 'Delayed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-blue-100 text-blue-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md p-3 shadow-sm w-60">
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-2 h-2" 
        id="target-default"
      />
      <div className="font-medium mb-1">{task.name}</div>
      <div className="text-xs text-gray-500 mb-2">
        {task.description && task.description.length > 50
          ? `${task.description.substring(0, 50)}...`
          : task.description || 'No description'}
      </div>
      <div className="flex justify-between items-center">
        <Badge variant="outline" className={getStatusColor(task.status)}>
          {task.status}
        </Badge>
        <Badge variant="outline" className={getPriorityColor(task.priority)}>
          {task.priority}
        </Badge>
      </div>
      
      <div className="mt-3 flex justify-between items-center">
        {connectionCondition && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-xs text-blue-600 cursor-help">
                  <Info size={12} className="mr-1" />
                  Condition
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs font-medium">{connectionCondition}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-2 h-2" 
        id="source-success"
      />
      
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-2 h-2 bg-yellow-500" 
        id="source-conditional"
        style={{ top: "50%" }}
      />
    </div>
  );
};

export default memo(TaskNode);
