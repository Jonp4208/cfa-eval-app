import api from '@/lib/axios';
import { TaskList, TaskInstance, TaskMetrics } from '../types/task';

export const taskService = {
  // Task Lists
  getLists: async (area?: 'foh' | 'boh'): Promise<TaskList[]> => {
    const response = await api.get<TaskList[]>('/api/tasks/lists', {
      params: { area }
    });
    return response.data;
  },

  createList: async (taskList: Omit<TaskList, '_id' | 'createdBy' | 'store' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<TaskList>('/api/tasks/lists', taskList);
    return response.data;
  },

  updateList: async (id: string, taskList: Partial<TaskList>) => {
    const response = await api.put<TaskList>(`/api/tasks/lists/${id}`, taskList);
    return response.data;
  },

  deleteList: async (id: string) => {
    const response = await api.delete(`/api/tasks/lists/${id}`);
    return response.data;
  },

  // Task Instances
  getInstances: async (area?: 'foh' | 'boh'): Promise<TaskInstance[]> => {
    const response = await api.get<TaskInstance[]>('/api/tasks/instances', {
      params: { area }
    });
    return response.data;
  },

  createInstance: async (data: { 
    taskListId: string;
    date: string;
    assignedTasks?: { [taskId: string]: string };
  }) => {
    // First check if there's an existing instance
    const instances = await taskService.getInstances();
    
    // Get the task list to check if it's recurring
    const taskList = await taskService.getLists().then(lists => 
      lists.find(list => list._id === data.taskListId)
    );

    if (!taskList) {
      throw new Error('Task list not found');
    }

    // For non-recurring tasks, check if there's any instance
    if (!taskList.isRecurring) {
      const existingInstance = instances.find(i => {
        const taskListId = typeof i.taskList === 'string' ? i.taskList : i.taskList._id;
        return taskListId === data.taskListId;
      });

      if (existingInstance) {
        return existingInstance; // Always return existing instance for non-recurring tasks
      }
    } else {
      // For recurring tasks, check if there's already an instance for today
      const today = new Date(data.date);
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const todayInstance = instances.find(i => {
        const instanceDate = new Date(i.date);
        const taskListId = typeof i.taskList === 'string' ? i.taskList : i.taskList._id;
        return taskListId === data.taskListId &&
               instanceDate >= startOfDay && 
               instanceDate < endOfDay;
      });

      if (todayInstance) {
        return todayInstance;
      }
    }

    // Only create a new instance if:
    // 1. It's a recurring task and there's no instance for today
    // 2. It's a non-recurring task and there's no instance at all
    const response = await api.post<TaskInstance>('/api/tasks/instances', data);
    return response.data;
  },

  updateTaskStatus: async (instanceId: string, taskId: string, status: 'pending' | 'completed') => {
    const response = await api.patch<TaskInstance>(`/api/tasks/instances/${instanceId}/tasks/${taskId}`, { status });
    return response.data;
  },

  deleteInstance: async (instanceId: string) => {
    const response = await api.delete<{ message: string }>(`/api/tasks/instances/${instanceId}`);
    return response.data;
  },

  // Metrics
  getMetrics: async (params: {
    startDate: string;
    endDate: string;
    department?: string;
    shift?: string;
  }) => {
    const response = await api.get<TaskMetrics>('/api/tasks/metrics', { params });
    return response.data;
  }
}; 