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
    try {
      console.log('Creating instance with data:', data);
      
      // First check if there's an existing instance
      const instances = await taskService.getInstances();
      console.log('Existing instances:', instances);
      
      // Get the task list to check if it's recurring
      const lists = await taskService.getLists();
      console.log('Available lists:', lists.map(list => ({
        id: list._id,
        name: list.name
      })));

      // Modified find operation to handle potential string/ObjectId mismatches
      const taskList = lists.find(list => {
        if (!list._id) return false;
        const listId = typeof list._id === 'object' ? list._id.toString() : list._id;
        const searchId = data.taskListId.toString();
        console.log('Comparing IDs:', { listId, searchId });
        return listId === searchId;
      });

      if (!taskList) {
        console.error(`Task list not found with ID: ${data.taskListId}`);
        throw new Error(`Task list not found with ID: ${data.taskListId}`);
      }

      console.log('Found task list:', taskList);

      if (!taskList.isRecurring) {
        const existingInstance = instances.find(i => {
          if (!i.taskList) return false;
          
          // Handle different taskList types
          const taskListId = typeof i.taskList === 'string' 
            ? i.taskList 
            : typeof i.taskList === 'object' && '_id' in i.taskList && i.taskList._id
              ? i.taskList._id.toString()
              : i.taskList.toString();
              
          return taskListId === data.taskListId.toString();
        });

        if (existingInstance) {
          console.log('Found existing instance:', existingInstance);
          return existingInstance;
        }
      }

      console.log('Creating new instance for task list:', taskList.name);
      const response = await api.post<TaskInstance>('/api/tasks/instances', data);
      console.log('Created instance response:', response.data);
      return response.data;

    } catch (error) {
      console.error('Error in createInstance:', error);
      throw error;
    }
  },

  updateTaskStatus: async (instanceId: string, taskId: string, status: 'pending' | 'completed') => {
    const response = await api.patch<TaskInstance>(`/api/tasks/instances/${instanceId}/tasks/${taskId}`, { status });
    return response.data;
  },

  assignTask: async (instanceId: string, taskId: string, userId: string) => {
    const response = await api.patch<TaskInstance>(`/api/tasks/instances/${instanceId}/tasks/${taskId}/assign`, { userId });
    return response.data;
  },

  deleteInstance: async (instanceId: string) => {
    const response = await api.delete(`/api/tasks/instances/${instanceId}`);
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