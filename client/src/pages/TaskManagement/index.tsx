import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { taskService } from '../../services/taskService';
import { TaskList as TaskListType, TaskInstance, Department, Shift, TaskItem } from '../../types/task';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from '../../components/ui/use-toast';
import { Loader2, Plus, Users, Clock, CheckCircle, Trash2, XCircle, Filter, ChevronDown, Pencil, ClipboardList } from 'lucide-react';
import TaskList from './TaskList';
import AssignTaskDialog from './AssignTaskDialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import { MongoId } from '../../types/task';
import userService from '../../services/userService';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { Textarea } from '../../components/ui/textarea';
import { ScrollArea } from '../../components/ui/scroll-area';

const getIdString = (id: string | MongoId | undefined): string => {
  if (!id) return '';
  return typeof id === 'string' ? id : id.toString();
};

const EditTaskListDialog = ({ 
  open, 
  onOpenChange, 
  taskList, 
  onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  taskList: TaskListType | null;
  onSave: (updatedList: Partial<TaskListType>) => void;
}) => {
  const [formData, setFormData] = useState({
    name: taskList?.name || '',
    department: taskList?.department || 'Front Counter',
    shift: taskList?.shift || 'AM',
    isRecurring: taskList?.isRecurring || false,
    recurringType: taskList?.recurringType,
    recurringDays: taskList?.recurringDays || [],
    monthlyDate: taskList?.monthlyDate || 1,
    tasks: taskList?.tasks || []
  });

  useEffect(() => {
    if (taskList) {
      setFormData({
        name: taskList.name,
        department: taskList.department,
        shift: taskList.shift,
        isRecurring: taskList.isRecurring,
        recurringType: taskList.recurringType,
        recurringDays: taskList.recurringDays || [],
        monthlyDate: taskList.monthlyDate || 1,
        tasks: taskList.tasks
      });
    }
  }, [taskList]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] sm:h-[80vh] flex flex-col overflow-hidden p-0 bg-white border-0 shadow-2xl rounded-3xl">
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] px-8 py-6">
          <DialogTitle className="text-xl font-semibold text-white">Edit Task List</DialogTitle>
        </div>
      
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-2">
              <Label className="text-[#27251F]/60 font-medium text-sm">Task List Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter task list name"
                className="rounded-[14px] border-[#27251F]/10 h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#27251F]/60 font-medium text-sm">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, department: value as Department }))}
                >
                  <SelectTrigger className="rounded-[14px] border-[#27251F]/10 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[14px]">
                    <SelectItem value="Front Counter">Front Counter</SelectItem>
                    <SelectItem value="Drive Thru">Drive Thru</SelectItem>
                    <SelectItem value="Kitchen">Kitchen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[#27251F]/60 font-medium text-sm">Shift</Label>
                <Select
                  value={formData.shift}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, shift: value as Shift }))}
                >
                  <SelectTrigger className="rounded-[14px] border-[#27251F]/10 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[14px]">
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      isRecurring: checked as boolean,
                      recurringType: checked ? 'daily' : undefined
                    }))
                  }
                  className="rounded-[6px] border-[#27251F]/10 data-[state=checked]:bg-[#E51636] data-[state=checked]:border-[#E51636]"
                />
                <Label htmlFor="recurring" className="text-[#27251F]/60 font-medium text-sm">Recurring Task List</Label>
              </div>

              {formData.isRecurring && (
                <div className="space-y-4 pl-4 sm:pl-6">
                  <div className="space-y-2">
                    <Label className="text-[#27251F]/60 font-medium text-sm">Recurring Type</Label>
                    <Select
                      value={formData.recurringType}
                      onValueChange={(value) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          recurringType: value as 'daily' | 'weekly' | 'monthly'
                        }))
                      }
                    >
                      <SelectTrigger className="rounded-[14px] border-[#27251F]/10 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-[14px]">
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.recurringType === 'weekly' && (
                    <div className="space-y-2">
                      <Label className="text-[#27251F]/60 font-medium text-sm">Select Days</Label>
                      <div className="flex flex-wrap gap-2">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                          <div key={day} className="flex items-center space-x-2">
                            <Checkbox
                              id={day}
                              checked={formData.recurringDays.includes(day)}
                              onCheckedChange={(checked) => {
                                setFormData(prev => ({
                                  ...prev,
                                  recurringDays: checked 
                                    ? [...prev.recurringDays, day]
                                    : prev.recurringDays.filter(d => d !== day)
                                }));
                              }}
                              className="rounded-[6px] border-[#27251F]/10 data-[state=checked]:bg-[#E51636] data-[state=checked]:border-[#E51636]"
                            />
                            <Label htmlFor={day} className="capitalize text-[#27251F]/60">
                              {day}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.recurringType === 'monthly' && (
                    <div className="space-y-2">
                      <Label className="text-[#27251F]/60 font-medium text-sm">Day of Month</Label>
                      <Select
                        value={formData.monthlyDate.toString()}
                        onValueChange={(value) => 
                          setFormData(prev => ({ 
                            ...prev, 
                            monthlyDate: parseInt(value)
                          }))
                        }
                      >
                        <SelectTrigger className="rounded-[14px] border-[#27251F]/10 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-[14px]">
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={day.toString()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Label className="text-[#27251F]/60 font-medium text-sm">Tasks</Label>
              {formData.tasks.map((task, index) => (
                <div key={index} className="space-y-3 p-3 sm:p-4 bg-[#F4F4F4] rounded-[14px]">
                  <Input
                    value={task.title}
                    onChange={(e) => {
                      const newTasks = [...formData.tasks];
                      newTasks[index] = { ...task, title: e.target.value };
                      setFormData(prev => ({ ...prev, tasks: newTasks }));
                    }}
                    placeholder="Task title"
                    className="rounded-[14px] border-[#27251F]/10 h-10"
                  />
                  <Textarea
                    value={task.description || ''}
                    onChange={(e) => {
                      const newTasks = [...formData.tasks];
                      newTasks[index] = { ...task, description: e.target.value };
                      setFormData(prev => ({ ...prev, tasks: newTasks }));
                    }}
                    placeholder="Task description"
                    className="rounded-[14px] border-[#27251F]/10 min-h-[60px] sm:min-h-[80px] resize-none"
                  />
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex-1">
                      <Label className="text-[#27251F]/60 font-medium text-sm">Time (min)</Label>
                      <Input
                        type="number"
                        value={task.estimatedTime || ''}
                        onChange={(e) => {
                          const newTasks = [...formData.tasks];
                          newTasks[index] = { ...task, estimatedTime: parseInt(e.target.value) };
                          setFormData(prev => ({ ...prev, tasks: newTasks }));
                        }}
                        className="rounded-[14px] border-[#27251F]/10 h-10"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        const newTasks = formData.tasks.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, tasks: newTasks }));
                      }}
                      className="rounded-[14px] h-10 w-10 mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    tasks: [...prev.tasks, { title: '', status: 'pending' }]
                  }));
                }}
                className="rounded-[14px] border-[#27251F]/10 w-full h-10"
              >
                Add Task
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 sm:gap-4 p-4 sm:p-6 border-t mt-auto bg-gray-50/80">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="rounded-[14px] border-[#27251F]/10 h-10"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="rounded-[14px] bg-[#E51636] hover:bg-[#E51636]/90 text-white h-10"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TaskManagement = () => {
  // State
  const [activeTaskList, setActiveTaskList] = useState<string | null>(null);
  const [taskLists, setTaskLists] = useState<TaskListType[]>([]);
  const [activeInstances, setActiveInstances] = useState<TaskInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<TaskInstance | null>(null);
  const [instanceMetricsCache, setInstanceMetricsCache] = useState<Map<string, any>>(new Map());
  const { user } = useAuth();
  const [selectedList, setSelectedList] = useState<TaskListType | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [completedByUsers, setCompletedByUsers] = useState<Record<string, { name: string }>>({});
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Available departments
  const departments: Department[] = ['Front Counter', 'Drive Thru', 'Kitchen'];

  // New task list form state
  const [newTaskList, setNewTaskList] = useState({
    name: '',
    department: departments[0],
    shift: '' as Shift,
    isRecurring: false,
    recurringType: undefined as 'daily' | 'weekly' | 'monthly' | undefined,
    recurringDays: [] as string[],
    monthlyDate: 1,
    tasks: [] as { title: string; description?: string; estimatedTime?: number; scheduledTime?: string }[]
  });

  type Filters = {
    department: Department | undefined;
    shift: Shift | undefined;
    status: 'all' | 'in_progress' | 'completed';
    area: 'foh' | 'boh' | undefined;
    view: 'current' | 'upcoming' | 'completed';
  };

  const [filters, setFilters] = useState<Filters>({
    department: undefined,
    shift: undefined,
    status: 'all',
    area: undefined,
    view: 'current'
  });

  // Add state for custom notification
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
    show: boolean;
  }>({ message: '', type: 'success', show: false });

  // Add notification timeout cleanup
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  // Add custom notification component
  const CustomNotification = () => {
    if (!notification.show) return null;

    const bgColor = notification.type === 'success' ? 'bg-green-500' :
                   notification.type === 'error' ? 'bg-red-500' :
                   'bg-yellow-500';

    return (
      <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg text-white shadow-lg transform transition-transform duration-300 ${bgColor}`}
           style={{ animation: 'slideIn 0.3s ease-out' }}>
        <div className="flex items-center gap-2">
          {notification.type === 'success' && <CheckCircle className="h-5 w-5" />}
          {notification.type === 'error' && <XCircle className="h-5 w-5" />}
          {notification.type === 'warning' && <Clock className="h-5 w-5" />}
          <span>{notification.message}</span>
        </div>
      </div>
    );
  };

  // Add animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Optimize data fetching with better caching and batching
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Create a cache key based on filters
      const cacheKey = `tasks_${filters.area || 'all'}`;
      
      // Try to get data from sessionStorage first
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        const { lists, instances, timestamp } = JSON.parse(cachedData);
        // Check if cache is less than 30 seconds old
        if (Date.now() - timestamp < 30000) {
          setTaskLists(lists);
          setActiveInstances(instances);
          setLoading(false);
          return;
        }
      }

      // If no cache or cache is old, fetch fresh data
      const [lists, instances] = await Promise.all([
        taskService.getLists(filters.area),
        taskService.getInstances(filters.area)
      ]);
      
      // Pre-sort instances once
      const sortedInstances = instances.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Pre-compute metrics and instance lookup maps
      const instanceMetrics = new Map();
      const completedInstanceIds = new Set();
      const instanceMap = new Map();
      
      sortedInstances.forEach(instance => {
        // Compute metrics
        const completedTasks = instance.tasks.filter(t => t.status === 'completed').length;
        const totalTasks = instance.tasks.length;
        const metrics = {
          completedTasks,
          totalTasks,
          completionRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0,
          remainingTime: instance.tasks
            .filter(t => t.status === 'pending')
            .reduce((acc, t) => acc + (t.estimatedTime || 0), 0)
        };
        instanceMetrics.set(getIdString(instance._id), metrics);
        
        // Track completed instances
        if (instance.status === 'completed') {
          completedInstanceIds.add(getIdString(instance._id));
        }
        
        // Build instance map
        const listId = typeof instance.taskList === 'string' 
          ? instance.taskList 
          : getIdString(instance.taskList?._id);
        instanceMap.set(listId, instance);
      });

      // Cache the results
      sessionStorage.setItem(cacheKey, JSON.stringify({
        lists,
        instances: sortedInstances,
        timestamp: Date.now()
      }));
      
      setTaskLists(lists);
      setActiveInstances(sortedInstances);
      setInstanceMetricsCache(instanceMetrics);
      
      // Store pre-computed sets and maps in ref to avoid re-renders
      completedInstanceIdsRef.current = completedInstanceIds;
      instanceMapRef.current = instanceMap;
    } catch (error) {
      console.error('Error fetching task data:', error);
      toast({
        title: "Error",
        description: "Failed to load task data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters.area]);

  // Add refs for storing computed values
  const completedInstanceIdsRef = useRef(new Set<string>());
  const instanceMapRef = useRef(new Map<string, TaskInstance>());

  // Optimize filteredInstances with refs
  const filteredInstances = useMemo(() => {
    if (!activeInstances.length) return [];
    
    return activeInstances.filter(instance => {
      const isCompleted = completedInstanceIdsRef.current.has(getIdString(instance._id));
      
      if (filters.status === 'completed') return isCompleted;
      if (filters.status === 'in_progress') return !isCompleted;
      if (filters.department && instance.department !== filters.department) return false;
      if (filters.shift && instance.shift !== filters.shift) return false;
      return true;
    });
  }, [activeInstances, filters.status, filters.department, filters.shift]);

  // Optimize filteredTaskLists with refs
  const filteredTaskLists = useMemo(() => {
    if (!taskLists.length) return [];
    
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentDate = today.getDate();
    
    return taskLists.filter(list => {
      const instance = instanceMapRef.current.get(getIdString(list._id));
      if (instance?.status === 'completed' && !list.isRecurring) {
        return false;
      }

      if (list.isRecurring) {
        if (list.recurringType === 'monthly' && currentDate !== list.monthlyDate) {
          return false;
        }
        if (list.recurringType === 'weekly' && !list.recurringDays?.includes(dayName)) {
          return false;
        }
      }

      return (!filters.department || list.department === filters.department) &&
             (!filters.shift || list.shift === filters.shift);
    });
  }, [taskLists, filters.department, filters.shift]);

  // Memoize handlers
  const handleTaskComplete = useCallback(async (instanceId: string, taskId: string, status: 'pending' | 'completed') => {
    try {
      await taskService.updateTaskStatus(instanceId, taskId, status);
      fetchData(); // Refresh data after update
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  }, [fetchData]);

  const handleAssignTask = useCallback(async (taskId: string, userId: string) => {
    try {
      if (!selectedInstance) return;
      await taskService.assignTask(getIdString(selectedInstance._id), taskId, userId);
      fetchData();
      setAssignDialogOpen(false);
      toast({
        title: "Success",
        description: "Task assigned successfully",
        variant: "default",
        className: "bg-green-50 border-green-200",
      });
    } catch (error) {
      console.error('Error assigning task:', error);
      toast({
        title: "Error",
        description: "Failed to assign task",
        variant: "destructive",
      });
    }
  }, [selectedInstance, fetchData]);

  // Effect to fetch data
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Effect to populate form when editing
  useEffect(() => {
    if (selectedList && createDialogOpen) {
      setNewTaskList({
        name: selectedList.name,
        department: selectedList.department as Department,
        shift: selectedList.shift,
        isRecurring: selectedList.isRecurring,
        recurringType: selectedList.recurringType,
        recurringDays: selectedList.recurringDays || [],
        monthlyDate: selectedList.monthlyDate || 1,
        tasks: selectedList.tasks.map(task => ({
          title: task.title,
          description: task.description || '',
          estimatedTime: task.estimatedTime,
          scheduledTime: task.scheduledTime
        }))
      });
    }
  }, [selectedList, createDialogOpen]);

  // Add function to fetch user details
  const fetchUserDetails = async (userId: string) => {
    try {
      const user = await userService.getUserById(userId);
      setCompletedByUsers(prev => ({
        ...prev,
        [userId]: { name: user.name }
      }));
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  // Modify useEffect to fetch user details when dialog opens
  useEffect(() => {
    if (taskDialogOpen && selectedInstance) {
      selectedInstance.tasks.forEach(task => {
        if (task.completedBy && typeof task.completedBy === 'string' && !completedByUsers[task.completedBy]) {
          fetchUserDetails(task.completedBy);
        }
      });
    }
  }, [taskDialogOpen, selectedInstance]);

  // Update the handleEditClick function
  const handleEditClick = (e: React.MouseEvent, list: TaskListType) => {
    e.stopPropagation();
    setSelectedList(list);
    setEditDialogOpen(true);
  };

  // Add handleSaveEdit function
  const handleSaveEdit = async (updatedList: Partial<TaskListType>) => {
    if (!selectedList?._id) return;

    try {
      // Optimistically update UI
      const listId = getIdString(selectedList._id);
      setTaskLists(prev => prev.map(l => 
        getIdString(l._id) === listId ? { ...l, ...updatedList } : l
      ));

      setNotification({
        message: "Saving changes...",
        type: 'warning',
        show: true
      });

      await taskService.updateList(listId, updatedList);

      setNotification({
        message: "Task list updated successfully!",
        type: 'success',
        show: true
      });

      // Refresh data in the background
      fetchData();
    } catch (error) {
      console.error('Error updating task list:', error);
      // Revert optimistic update
      fetchData();
      setNotification({
        message: `Failed to update task list: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
        show: true
      });
    }
  };

  // Calculate completion metrics for active instance
  const metrics = useMemo(() => {
    if (!activeInstances.length || !activeInstances[0]) return null;
    return instanceMetricsCache.get(getIdString(activeInstances[0]._id));
  }, [activeInstances, instanceMetricsCache]);

  // Get instance and metrics for a specific list
  const getListInstanceAndMetrics = (listId?: string) => {
    if (!listId) return { instance: null, metrics: null };
    const instance = activeInstances.find(i => {
      if (typeof i.taskList === 'string') {
        return i.taskList === listId;
      }
      return i.taskList?._id === listId;
    });
    const metrics = instance ? instanceMetricsCache.get(getIdString(instance._id)) : null;
    return { instance, metrics };
  };

  // Handle starting a task list
  const handleStartTaskList = async (taskListId: string) => {
    try {
      console.log('Starting task list:', taskListId);
      const instance = await taskService.createInstance({
        taskListId,
        date: new Date().toISOString(),
      });
      console.log('Created instance:', instance);
      await fetchData(); // Refresh data after creating instance
      return instance;
    } catch (error) {
      console.error('Error starting task list:', error);
      const errorMessage = error instanceof Error ? error.message : 
        typeof error === 'object' && error && 'response' in error ? (error.response as any)?.data?.message : 
        'Failed to start task list';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 4000,
      });
      return null;
    }
  };

  // Update the handleDeleteInstance function
  const handleDeleteInstance = async (instanceId: string) => {
    try {
      setNotification({
        message: "Deleting task instance...",
        type: 'warning',
        show: true
      });
      
      console.log('Attempting to delete instance:', instanceId);
      await taskService.deleteInstance(instanceId);
      console.log('Successfully deleted instance');
      await fetchData();
      setTaskDialogOpen(false);
      
      setNotification({
        message: "Task instance deleted successfully!",
        type: 'success',
        show: true
      });
    } catch (error) {
      console.error('Delete error:', error);
      setNotification({
        message: `Failed to delete task instance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
        show: true
      });
    }
  };

  // Update the delete button click handler
  const handleDeleteClick = (e: React.MouseEvent, instance: TaskInstance | null, list: TaskListType) => {
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete "${list.name}"? This will delete the task list and all its instances. This action cannot be undone.`)) {
      try {
        // Optimistically update UI
        const listId = getIdString(list._id);
        setTaskLists(prev => prev.filter(l => getIdString(l._id) !== listId));
        setActiveInstances(prev => prev.filter(i => {
          const instanceListId = typeof i.taskList === 'string' 
            ? i.taskList 
            : getIdString(i.taskList?._id);
          return instanceListId !== listId;
        }));

        setNotification({
          message: "Deleting task list...",
          type: 'warning',
          show: true
        });

        taskService.deleteList(listId)
          .then(() => {
            setNotification({
              message: "Task list and all instances deleted successfully!",
              type: 'success',
              show: true
            });
          })
          .catch((error) => {
            console.error('Delete error:', error);
            // Revert optimistic update by refreshing data
            fetchData();
            setNotification({
              message: `Failed to delete task list: ${error instanceof Error ? error.message : 'Unknown error'}`,
              type: 'error',
              show: true
            });
          });
      } catch (error) {
        console.error('Delete error:', error);
        fetchData();
        setNotification({
          message: `Failed to delete task list: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error',
          show: true
        });
      }
    }
  };

  // Memoize upcoming tasks
  const upcomingTasks = useMemo(() => {
    const upcoming: { date: Date; tasks: TaskListType[] }[] = [];
    const today = new Date();
    
    // Look ahead 30 days
    for (let i = 1; i <= 30; i++) {
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + i);
      
      const tasksForDate = taskLists.filter(list => {
        if (!list.isRecurring) return false;
        
        if (list.recurringType === 'daily') return true;
        
        if (list.recurringType === 'weekly') {
          const dayName = futureDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          return list.recurringDays?.includes(dayName) ?? false;
        }
        
        if (list.recurringType === 'monthly') {
          return futureDate.getDate() === list.monthlyDate;
        }
        
        return false;
      });
      
      if (tasksForDate.length > 0) {
        upcoming.push({ date: futureDate, tasks: tasksForDate });
      }
    }
    
    return upcoming;
  }, [taskLists]);

  const handleAreaChange = (value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      area: value === "all" ? undefined : (value as 'foh' | 'boh' | undefined)
    }));
  };

  const handleDepartmentChange = (value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      department: value === "all" ? undefined : (value as Department | undefined)
    }));
  };

  const handleShiftChange = (value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      shift: value === "all" ? undefined : (value as Shift | undefined)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E51636]" />
      </div>
    );
  }

  const activeInstance = activeInstances[0];

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <CustomNotification />
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <PageHeader
          title="Task Management"
          subtitle="Create and manage team tasks"
          actions={
            <div className="max-w-[400px] mx-auto w-full">
              <button
                onClick={() => setCreateDialogOpen(true)}
                className="w-full bg-white hover:bg-white/90 text-[#E51636] h-12 rounded-xl inline-flex items-center justify-center font-medium transition-colors w-full"
              >
                <Plus className="w-5 h-5" />
                <span>New Task List</span>
              </button>
            </div>
          }
        />

        {/* Filter Section */}
        <div className="mb-6">
          <Card className="bg-white rounded-[20px]">
            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-[#27251F]/60" />
                <span className="font-medium">Filters</span>
              </div>
              <ChevronDown className={cn(
                "w-5 h-5 text-[#27251F]/60 transition-transform",
                showFilters && "rotate-180"
              )} />
            </button>

            {/* Filter Content */}
            <div className={cn(
              "overflow-hidden transition-all duration-200 ease-in-out",
              "md:block",
              showFilters ? "block" : "hidden"
            )}>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Area Filter */}
                  <div className="space-y-2">
                    <Label>Area</Label>
                    <Select
                      value={filters.area || "all"}
                      onValueChange={(value) => handleAreaChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Areas</SelectItem>
                        <SelectItem value="FOH">Front of House</SelectItem>
                        <SelectItem value="BOH">Back of House</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Department Filter */}
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select
                      value={filters.department || "all"}
                      onValueChange={(value) => handleDepartmentChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Shift Filter */}
                  <div className="space-y-2">
                    <Label>Shift</Label>
                    <Select
                      value={filters.shift || "all"}
                      onValueChange={(value) => handleShiftChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Shifts</SelectItem>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Reset Filters Button */}
                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setFilters({
                      area: undefined,
                      department: undefined,
                      shift: undefined,
                      status: 'all',
                      view: filters.view
                    })}
                    className="text-sm"
                  >
                    Reset Filters
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* View Selection Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-full p-1 flex gap-1">
            <Button 
              variant="ghost"
              className={cn(
                "rounded-full px-4 py-2 text-sm",
                filters.view === 'current' && "bg-[#E51636] text-white hover:bg-[#E51636]/90"
              )}
              onClick={() => setFilters(prev => ({ ...prev, view: 'current' }))}
            >
              Current Tasks
            </Button>
            <Button 
              variant="ghost"
              className={cn(
                "rounded-full px-4 py-2 text-sm",
                filters.view === 'upcoming' && "bg-[#E51636] text-white hover:bg-[#E51636]/90"
              )}
              onClick={() => setFilters(prev => ({ ...prev, view: 'upcoming' }))}
            >
              Upcoming Tasks
            </Button>
            <Button 
              variant="ghost"
              className={cn(
                "rounded-full px-4 py-2 text-sm",
                filters.view === 'completed' && "bg-[#E51636] text-white hover:bg-[#E51636]/90"
              )}
              onClick={() => setFilters(prev => ({ ...prev, view: 'completed' }))}
            >
              Completed Tasks
            </Button>
          </div>
        </div>

        {/* Content */}
        {filters.view === 'upcoming' ? (
          <div className="space-y-8">
            {upcomingTasks.map(({ date, tasks }) => (
              <div key={date.toISOString()} className="space-y-4">
                <h3 className="text-xl font-bold text-[#27251F] sticky top-0 bg-[#F4F4F4] py-4 z-10">
                  {date.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
                <div className="space-y-4">
                  {tasks.map(list => {
                    // Fix createdBy name access
                    const creatorName = typeof list.createdBy === 'object' && list.createdBy && 'name' in list.createdBy 
                      ? list.createdBy.name 
                      : 'Unknown';

                    return (
                    <Card 
                      key={getIdString(list._id)}
                      className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer w-full"
                    >
                      <CardContent className="p-8">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold text-[#27251F]">{list.name}</h3>
                              <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
                                {list.recurringType === 'daily' ? 'Daily' :
                                 list.recurringType === 'weekly' ? 'Weekly' :
                                 list.recurringType === 'monthly' ? 'Monthly' : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[#27251F]/60">{list.department}</span>
                              <span className="text-[#27251F]/60">•</span>
                              <span className="text-[#27251F]/60 capitalize">{list.shift} Shift</span>
                            </div>
                            <div className="mt-2 text-sm text-[#27251F]/60">
                                Created by: {creatorName}
                            </div>
                            <div className="mt-2 text-sm text-[#27251F]/60">
                              {`${list.tasks.length} tasks • Estimated total time: ${list.tasks.reduce((acc, task) => acc + (task.estimatedTime || 0), 0)} minutes`}
                            </div>
                          </div>
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              </div>
            ))}
            {upcomingTasks.length === 0 && (
              <Card className="bg-white rounded-[20px] w-full">
                <CardContent className="p-8 text-center">
                  <p className="text-[#27251F]/60">
                    No upcoming tasks found for the next 30 days
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : filters.view === 'completed' ? (
          <div className="space-y-4">
            {activeInstances
              .filter(instance => instance.status === 'completed')
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(instance => {
                // Get the task list data, either from populated field or from taskLists array
                const taskListData = typeof instance.taskList === 'object' && instance.taskList && 'name' in instance.taskList
                  ? instance.taskList as TaskListType
                  : taskLists.find(list => getIdString(list._id) === instance.taskList);

                return (
                  <Card 
                    key={getIdString(instance._id)}
                    className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer w-full bg-green-50 border-green-100"
                    onClick={() => {
                      setSelectedInstance(instance);
                      setSelectedList(taskListData || null);
                      setTaskDialogOpen(true);
                    }}
                  >
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-[#27251F]">
                              {taskListData?.name || instance.department + ' Tasks'}
                            </h3>
                            <span className="text-sm px-3 py-1 rounded-full font-medium bg-green-100 text-green-700">
                              Completed
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-[#27251F]/60">
                            {instance.department} • {instance.shift} shift
                          </div>
                          {taskListData?.isRecurring && (
                            <div className="mt-2 text-sm text-[#27251F]/60">
                              Recurring: {taskListData.recurringType === 'daily' ? 'Daily' :
                                taskListData.recurringType === 'weekly' ? 
                                  `Weekly on ${taskListData.recurringDays?.map((day: string) => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')}` :
                                taskListData.recurringType === 'monthly' ? 
                                  `Monthly on the ${taskListData.monthlyDate}${
                                    taskListData.monthlyDate === 1 ? 'st' : 
                                    taskListData.monthlyDate === 2 ? 'nd' : 
                                    taskListData.monthlyDate === 3 ? 'rd' : 'th'
                                  }` : ''}
                            </div>
                          )}
                          <div className="mt-4 text-sm text-[#27251F]/60">
                            <p>Tasks Completed: {instance.tasks.length}</p>
                            <p>Completion Rate: 100%</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all duration-300"
                            style={{ width: '100%' }} 
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-green-700">
                            Completed
                          </span>
                          <span className="text-sm font-medium text-green-700">
                            100%
                          </span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-green-200">
                          <div className="text-sm text-[#27251F]/60">
                            <p>Completed at: {new Date(instance.updatedAt).toLocaleString()}</p>
                            <p>Created by: {
                              typeof instance.createdBy === 'object' && instance.createdBy && 'name' in instance.createdBy
                                ? instance.createdBy.name
                                : 'Unknown'
                            }</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            {activeInstances.filter(instance => instance.status === 'completed').length === 0 && (
              <Card className="bg-white rounded-[20px] w-full">
                <CardContent className="p-8 text-center">
                  <p className="text-[#27251F]/60">
                    No completed tasks found
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTaskLists.map((list) => {
              const { instance, metrics } = getListInstanceAndMetrics(getIdString(list._id));
              return (
                <Card 
                  key={getIdString(list._id)}
                  className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer w-full"
                  onClick={() => {
                    setSelectedList(list);
                    setSelectedInstance(instance || null);
                    setTaskDialogOpen(true);
                  }}
                >
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-[#27251F]">{list.name}</h3>
                          {list.isRecurring && (
                            <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
                              {list.recurringType === 'daily' ? 'Daily' :
                               list.recurringType === 'weekly' ? 'Weekly' :
                               list.recurringType === 'monthly' ? 'Monthly' : ''}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 text-sm text-[#27251F]/60">
                          {list.department} • {list.shift} shift
                        </div>
                        {instance && (
                          <div className="mt-2 text-sm text-[#27251F]/60">
                            Created: {new Date(instance.createdAt).toLocaleDateString()} by {
                              typeof instance.createdBy === 'object' && instance.createdBy && 'name' in instance.createdBy
                                ? instance.createdBy.name
                                : 'Unknown'
                            }
                          </div>
                        )}
                        {metrics && (
                          <div className="mt-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[#27251F]/60 font-medium">
                                {metrics.completedTasks}/{metrics.totalTasks} Tasks
                              </span>
                              <span className="text-[#27251F]/60">•</span>
                              <span className="text-[#27251F]/60 font-medium">
                                {Math.round(metrics.completionRate)}% Complete
                              </span>
                            </div>
                            <div className="h-2 bg-[#E51636]/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#E51636] rounded-full transition-all duration-300" 
                                style={{ width: `${metrics.completionRate}%` }} 
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-4">
                        {user?.position && ['Leader', 'Director'].includes(user.position) && (
                          <div className="flex items-center gap-4">
                            <button
                              className="text-[#27251F]/60 hover:text-[#E51636] transition-colors"
                              title="Edit List"
                              onClick={(e) => handleEditClick(e, list)}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              className="text-[#27251F]/60 hover:text-[#E51636] transition-colors"
                              title="Delete List"
                              onClick={(e) => handleDeleteClick(e, instance, list)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              className="text-[#27251F]/60 hover:text-[#E51636] transition-colors"
                              title="Assign Tasks"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  setSelectedList(list);
                                  
                                  let currentInstance = instance;
                                  if (!currentInstance) {
                                    console.log('Starting task list for assignment:', list);
                                    currentInstance = await handleStartTaskList(getIdString(list._id));
                                    if (!currentInstance) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to create task instance",
                                        variant: "destructive",
                                        duration: 4000,
                                      });
                                      return;
                                    }
                                  }

                                  setSelectedInstance(currentInstance);
                                  setAssignDialogOpen(true);
                                } catch (error) {
                                  console.error('Error assigning task:', error);
                                  const errorMessage = error instanceof Error ? error.message : 
                                    typeof error === 'object' && error && 'response' in error ? (error.response as any)?.data?.message : 
                                    'Failed to assign task';
                                  
                                  toast({
                                    title: "Error",
                                    description: errorMessage,
                                    variant: "destructive",
                                    duration: 4000,
                                  });
                                }
                              }}
                            >
                              <Users className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {list.isRecurring ? (
                          <div className="h-6 w-6 bg-[#27251F]/10 rounded-full flex items-center justify-center">
                            <Clock className="h-3 w-3 text-[#27251F]/60" />
                          </div>
                        ) : instance?.status === 'completed' ? (
                          <div className="h-6 w-6 bg-[#27251F]/10 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-[#27251F]/60" />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredTaskLists.length === 0 && (
              <Card className="bg-white rounded-[20px] w-full">
                <CardContent className="p-8 text-center">
                  <p className="text-[#27251F]/60">
                    {taskLists.length === 0 
                      ? "No task lists found" 
                      : "No task lists match the selected filters"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Task Completion Dialog */}
        <Dialog open={taskDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setSelectedList(null);
          }
          setTaskDialogOpen(open);
        }}>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col bg-white border-0 shadow-2xl rounded-3xl">
            <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] px-8 py-6">
              <DialogTitle className="text-xl font-semibold text-white">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span>
                      {selectedInstance && selectedInstance.taskList && typeof selectedInstance.taskList === 'object' && 'name' in selectedInstance.taskList
                        ? selectedInstance.taskList.name
                        : selectedList?.name || 'Task List'}
                    </span>
                    {selectedInstance?.status === 'completed' && (
                      <span className="bg-white/20 text-white text-sm px-2 py-0.5 rounded-full font-medium">
                        Completed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <span>{selectedInstance?.department || selectedList?.department}</span>
                    <span>•</span>
                    <span className="capitalize">{selectedInstance?.shift || selectedList?.shift} Shift</span>
                  </div>
                </div>
              </DialogTitle>
            </div>

            {/* Task List Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Progress Section - Only show for non-completed tasks */}
              {selectedList && selectedInstance?.status !== 'completed' && (
                <div className="px-8 pt-6">
                  <div className="bg-[#F4F4F4] rounded-[20px] p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-[#27251F]">Overall Progress</span>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#E51636] rounded-full transition-all duration-700 ease-in-out" 
                        style={{ 
                          width: `${getListInstanceAndMetrics(selectedList ? getIdString(selectedList._id) : undefined).metrics?.completionRate || 0}%` 
                        }} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tasks List */}
              <div className="px-8 pb-6 flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {(() => {
                    // If we have a selected instance with tasks, show those
                    if (selectedInstance?.tasks) {
                      return selectedInstance.tasks.map((task: {
                        _id: string | MongoId;
                        title: string;
                        description?: string;
                        estimatedTime?: number;
                        scheduledTime?: string;
                        status: 'pending' | 'completed';
                        assignedTo?: {
                          _id: string | MongoId;
                          name: string;
                        };
                        completedBy?: {
                          _id: string | MongoId;
                          name: string;
                        } | string;
                        completedAt?: string | Date;
                      }, index) => {
                        const completedByUser = task.completedBy && typeof task.completedBy === 'string' 
                          ? completedByUsers[task.completedBy]
                          : task.completedBy;

                        return (
                          <div
                            key={task._id ? getIdString(task._id) : undefined}
                            className="border-b border-[#27251F]/10 py-4"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className={cn(
                                  "text-base font-medium",
                                  task.status === 'completed' && "line-through"
                                )}>
                                  {task.title}
                                </h3>
                                {task.assignedTo && (
                                  <span className="text-sm text-[#27251F]/60">
                                    - Assigned to {task.assignedTo.name}
                                  </span>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-sm text-[#27251F]/60 mt-1">
                                  {task.description}
                                </p>
                              )}
                              {task.completedBy && task.completedAt && (
                                <div className="mt-2 text-sm">
                                  <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    <p>Completed by <span className="font-medium">
                                      {typeof task.completedBy === 'object' && 'name' in task.completedBy
                                        ? task.completedBy.name
                                        : completedByUsers[task.completedBy]?.name || 'Loading...'}
                                    </span></p>
                                  </div>
                                  <p className="text-[#27251F]/60 mt-1">
                                    {new Date(task.completedAt).toLocaleString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: 'numeric'
                                    })}
                                  </p>
                                </div>
                              )}
                            </div>
                            {selectedInstance.status !== 'completed' && (
                              <div className="flex items-center justify-end gap-4 mt-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTaskId(getIdString(task._id));
                                    setAssignDialogOpen(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 transition-colors"
                                  title={task.assignedTo ? `Reassign (${task.assignedTo.name})` : 'Assign User'}
                                >
                                  <Users className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!task._id) return;
                                    handleTaskComplete(
                                      getIdString(selectedInstance?._id || ''),
                                      getIdString(task._id),
                                      task.status === 'completed' ? 'pending' : 'completed'
                                    );
                                  }}
                                  className={cn(
                                    "transition-colors",
                                    task.status === 'completed'
                                      ? "text-green-600 hover:text-green-700"
                                      : "text-[#E51636] hover:text-[#DD0031]"
                                  )}
                                  title={task.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
                                >
                                  {task.status === 'completed' ? (
                                    <XCircle className="h-5 w-5" />
                                  ) : (
                                    <CheckCircle className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      });
                    }

                    // If we have a selected list but no instance
                    if (selectedList?.tasks) {
                      if (selectedList.tasks.length === 0) {
                        return (
                          <div className="text-center py-4 text-[#27251F]/60">
                            No tasks found in this list
                          </div>
                        );
                      }

                      const tasks = selectedList.tasks;
                      return tasks.map((task) => (
                        <div
                          key={task._id ? getIdString(task._id) : undefined}
                          className="border-b border-[#27251F]/10 py-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-medium">
                                  {task.title}
                                </h3>
                              </div>
                              {task.description && (
                                <p className="text-sm text-[#27251F]/60 mt-1">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTaskId(getIdString(task._id));
                                  setAssignDialogOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-700 transition-colors"
                                title="Assign User"
                              >
                                <Users className="h-5 w-5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!task._id) return;
                                  handleTaskComplete(
                                    getIdString(selectedInstance?._id || ''),
                                    getIdString(task._id),
                                    'completed'
                                  );
                                }}
                                className={cn(
                                  "transition-colors",
                                  task.status === 'completed'
                                    ? "text-green-600 hover:text-green-700"
                                    : "text-[#E51636] hover:text-[#DD0031]"
                                )}
                                title="Mark Complete"
                              >
                                {task.status === 'completed' ? (
                                  <XCircle className="h-5 w-5" />
                                ) : (
                                  <CheckCircle className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ));
                    }

                    return (
                      <div className="text-center py-4 text-[#27251F]/60">
                        No tasks found
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto border-t py-4 px-6 bg-gray-50/80">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-[#27251F]/60">
                    {selectedInstance?.status === 'completed' ? (
                      <span>Completed at: {new Date(selectedInstance.updatedAt).toLocaleString()}</span>
                    ) : selectedList && (() => {
                      const { metrics } = getListInstanceAndMetrics(getIdString(selectedList._id));
                      return metrics?.remainingTime ? (
                        <span>Estimated time remaining: <span className="font-medium">{metrics.remainingTime} minutes</span></span>
                      ) : null;
                    })()}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setTaskDialogOpen(false);
                      setSelectedInstance(null);
                      setSelectedList(null);
                    }}
                    className="hover:bg-gray-100"
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Active Task List View */}
        {activeTaskList && activeInstance && (
          <>
            {/* Task Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[#27251F]/60 font-medium">Tasks Progress</p>
                      <h3 className="text-3xl font-bold mt-2 text-[#27251F]">
                        {metrics?.completedTasks || 0}/{metrics?.totalTasks || 0}
                      </h3>
                      <p className="text-sm font-medium">{Math.round(metrics?.completionRate || 0)}% complete</p>
                    </div>
                    <div className="h-14 w-14 bg-[#E51636]/10 rounded-2xl flex items-center justify-center">
                      <CheckCircle className="h-7 w-7 text-[#E51636]" />
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="h-2 bg-[#E51636]/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#E51636] rounded-full transition-all duration-300" 
                        style={{ width: `${metrics?.completionRate || 0}%` }} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[#27251F]/60 font-medium">Time Remaining</p>
                      <h3 className="text-3xl font-bold mt-2 text-[#27251F]">{metrics?.remainingTime}</h3>
                      <p className="text-[#27251F]/60 mt-1">minutes</p>
                    </div>
                    <div className="h-14 w-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <Clock className="h-7 w-7 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[#27251F]/60 font-medium">Team Members</p>
                      <h3 className="text-3xl font-bold mt-2 text-[#27251F]">
                        {activeInstance.tasks.filter(t => t.assignedTo).length}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex -space-x-2">
                          {[1,2,3].map((i) => (
                            <div key={i} className="h-6 w-6 rounded-full bg-[#E51636]/10 border-2 border-white flex items-center justify-center">
                              <Users className="h-3 w-3 text-[#E51636]" />
                            </div>
                          ))}
                        </div>
                        <p className="text-[#27251F]/60">assigned</p>
                      </div>
                    </div>
                    <div className="h-14 w-14 bg-[#E51636]/10 rounded-2xl flex items-center justify-center">
                      <Users className="h-7 w-7 text-[#E51636]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[#27251F]/60 font-medium">Status</p>
                      <h3 className="text-3xl font-bold mt-2 text-[#27251F]">
                        {activeInstance.status === 'completed' ? 'Done' : 'Active'}
                      </h3>
                      <p className="text-[#27251F]/60 mt-1">current state</p>
                    </div>
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center",
                      activeInstance.status === 'completed' 
                        ? "bg-green-100" 
                        : "bg-yellow-100"
                    )}>
                      <CheckCircle className={cn(
                        "h-7 w-7",
                        activeInstance.status === 'completed' 
                          ? "text-green-600" 
                          : "text-yellow-600"
                      )} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Task List */}
            <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between p-8 border-b">
                <div>
                  <CardTitle className="text-xl font-bold text-[#27251F]">Task Checklist</CardTitle>
                  <p className="text-[#27251F]/60 mt-1">Track and manage task completion</p>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <TaskList
                  instance={activeInstance}
                  onTaskComplete={(taskId, status) => 
                    handleTaskComplete(getIdString(activeInstance._id), taskId, status)
                  }
                  onAssignTask={(taskId) => {
                    setSelectedTaskId(taskId);
                    setSelectedInstance(activeInstance);
                    setAssignDialogOpen(true);
                  }}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Assignment Dialog */}
        {selectedInstance && (
          <AssignTaskDialog
            open={assignDialogOpen}
            onOpenChange={setAssignDialogOpen}
            onAssign={(userId) => {
              if (selectedTaskId) {
                handleAssignTask(selectedTaskId, userId);
              }
            }}
            department={selectedInstance.department}
            shift={selectedInstance.shift}
          />
        )}

        {/* Edit Task List Dialog */}
        <EditTaskListDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          taskList={selectedList}
          onSave={handleSaveEdit}
        />
      </div>
    </div>
  );
};

export default TaskManagement; 