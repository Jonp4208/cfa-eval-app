import React from 'react';
import { TaskInstance, TaskItem } from '../../types/task';
import { Checkbox } from '../../components/ui/checkbox';
import { Button } from '../../components/ui/button';
import { Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TaskListProps {
  instance: TaskInstance;
  onTaskComplete: (taskId: string, status: 'pending' | 'completed') => void;
  onAssignTask: (taskId: string, userId: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ instance, onTaskComplete, onAssignTask }) => {
  // Group tasks by their completion status
  const groupedTasks = instance.tasks.reduce((acc, task) => {
    const status = task.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(task);
    return acc;
  }, {} as Record<string, TaskItem[]>);

  const renderTask = (task: TaskItem) => (
    <div key={task._id} className="p-2 sm:p-4 bg-gray-50 rounded-lg">
      <div className="flex items-start gap-2 sm:gap-3">
        <Checkbox
          checked={task.status === 'completed'}
          onCheckedChange={(checked) => 
            onTaskComplete(task._id!, checked ? 'completed' : 'pending')
          }
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium break-words">{task.title}</p>
          {task.description && (
            <p className="text-sm text-gray-500 break-words">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
            {task.estimatedTime && (
              <div className="flex items-center text-xs sm:text-sm text-gray-500">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {task.estimatedTime} min
              </div>
            )}
            {task.assignedTo ? (
              <div className="flex items-center text-xs sm:text-sm text-gray-500">
                <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="truncate">{task.assignedTo.name}</span>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs sm:text-sm h-7 sm:h-8"
                onClick={() => {
                  // TODO: Open user selection dialog
                }}
              >
                Assign Task
              </Button>
            )}
            {task.completedBy && task.completedAt && (
              <div className="text-xs sm:text-sm text-gray-500 w-full sm:w-auto mt-1 sm:mt-0">
                Completed by <span className="truncate">{task.completedBy.name}</span>{' '}
                {formatDistanceToNow(new Date(task.completedAt))} ago
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Pending Tasks */}
      {groupedTasks['pending']?.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Pending Tasks</h3>
          <div className="space-y-2">
            {groupedTasks['pending'].map(renderTask)}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {groupedTasks['completed']?.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Completed Tasks</h3>
          <div className="space-y-2">
            {groupedTasks['completed'].map(renderTask)}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList; 