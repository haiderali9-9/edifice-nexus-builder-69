
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Task } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Info, Clock, Calendar, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';

interface TaskNodeProps {
  data: {
    task: Task;
    connectionCondition?: string;
  };
  selected?: boolean;
}

const TaskNode: React.FC<TaskNodeProps> = ({ data, selected }) => {
  const { task, connectionCondition } = data;
  const [isOpen, setIsOpen] = React.useState(false);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Not Started':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Delayed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div 
      className={cn(
        "bg-white border rounded-lg shadow-sm transition-all duration-200 w-72",
        selected ? "border-blue-500 shadow-md ring-2 ring-blue-200" : "border-gray-200",
        isOpen ? "p-3" : "p-4"
      )}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-2 h-2 !bg-blue-400" 
        id="target-default"
      />
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-gray-800 truncate mr-2">{task.name}</h3>
          <CollapsibleTrigger asChild>
            <button className="text-xs text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors">
              {isOpen ? 'Less' : 'More'}
            </button>
          </CollapsibleTrigger>
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <Badge variant="outline" className={getStatusColor(task.status)}>
            {task.status}
          </Badge>
          <Badge variant="outline" className={getPriorityColor(task.priority)}>
            {task.priority}
          </Badge>
        </div>
        
        <CollapsibleContent>
          {task.description && (
            <div className="text-xs text-gray-600 mb-3 bg-gray-50 p-2 rounded-md">
              {task.description}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{formatDate(task.start_date)}</span>
            </div>
            <span>→</span>
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{formatDate(task.end_date)}</span>
            </div>
          </div>
        </CollapsibleContent>

        {connectionCondition && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-2 flex items-center text-xs text-blue-600 p-1 rounded bg-blue-50 w-fit cursor-help">
                  <Info size={12} className="mr-1" />
                  Conditional Flow
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs font-medium">{connectionCondition}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </Collapsible>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-2 h-2 !bg-green-500" 
        id="source-success"
      />
      
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-2 h-2 !bg-amber-500" 
        id="source-conditional"
        style={{ top: "50%" }}
      />
    </div>
  );
};

export default memo(TaskNode);
