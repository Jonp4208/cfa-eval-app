import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { taskService } from '../../services/taskService';
import { TaskList as TaskListType, TaskInstance, Department, Shift } from '../../types/task';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from '../../components/ui/use-toast';
import { Loader2, Plus, Users, Clock, CheckCircle, Trash2, XCircle, Filter, ChevronDown, Pencil } from 'lucide-react';
import TaskList from './TaskList';
import AssignTaskDialog from './AssignTaskDialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import { MongoId } from '../../types/task';

const getIdString = (id: string | MongoId): string => {
  if (!id) return '';
  return typeof id === 'string' ? id : id.toString();
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
  const { user } = useAuth();
  const [selectedList, setSelectedList] = useState<TaskListType | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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

  // Fetch task lists and active instances
  const fetchData = async () => {
    try {
      console.log('Fetching task data...');
      const [lists, instances] = await Promise.all([
        taskService.getLists(filters.area),
        taskService.getInstances(filters.area)
      ]);
      console.log('Fetched task lists:', lists);
      console.log('Fetched instances:', instances);
      setTaskLists(lists);
      setActiveInstances(instances.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching task data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('TaskManagement component mounted');
    fetchData();
  }, [filters.area]);

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

  // Handle creating a task list
  const handleCreateTaskList = async () => {
    try {
      if (!newTaskList.name || !newTaskList.department || !newTaskList.shift) {
        return;
      }

      // Create a cleaned version of the task list without undefined values
      const taskListToCreate = {
        name: newTaskList.name,
        department: newTaskList.department,
        shift: newTaskList.shift,
        isActive: true,
        isRecurring: newTaskList.isRecurring,
        tasks: newTaskList.tasks.map(task => ({
          _id: crypto.randomUUID(),
          title: task.title,
          description: task.description,
          estimatedTime: task.estimatedTime,
          scheduledTime: task.scheduledTime,
          status: 'pending' as const
        })),
        recurringType: newTaskList.isRecurring ? newTaskList.recurringType : undefined,
        recurringDays: newTaskList.isRecurring && newTaskList.recurringType === 'weekly' ? newTaskList.recurringDays : undefined,
        monthlyDate: newTaskList.isRecurring && newTaskList.recurringType === 'monthly' ? newTaskList.monthlyDate : undefined
      };

      await taskService.createList(taskListToCreate);
      await fetchData(); // Refresh data after creating
      setCreateDialogOpen(false);
      setNewTaskList({
        name: '',
        department: departments[0],
        shift: '' as Shift,
        isRecurring: false,
        recurringType: undefined,
        recurringDays: [],
        monthlyDate: 1,
        tasks: []
      });
    } catch (error) {
      console.error('Error creating task list:', error);
    }
  };

  // Get active instance for a list
  const getActiveInstance = (listId: string) => {
    if (!listId) return null;
    return activeInstances.find(i => {
      if (typeof i.taskList === 'string') {
        return i.taskList === listId;
      }
      return i.taskList?._id === listId;
    });
  };

  // Handle task completion
  const handleTaskComplete = async (instanceId: string, taskId: string, status: 'pending' | 'completed') => {
    try {
      console.log('Updating task status:', { instanceId, taskId, status });
      
      // If no instance exists yet, create one
      let currentInstanceId = instanceId;
      if (!instanceId) {
        const taskList = taskLists.find(list => list.tasks.some(task => task._id === taskId));
        if (!taskList) return;
        
        const newInstance = await taskService.createInstance({
          taskListId: getIdString(taskList._id),
          date: new Date().toISOString()
        });
        currentInstanceId = getIdString(newInstance._id);
      }
      
      // Update task status
      const updatedInstance = await taskService.updateTaskStatus(currentInstanceId, taskId, status);
      console.log('Task status updated successfully:', updatedInstance);

      // Check if all tasks are completed
      const allTasksCompleted = updatedInstance.tasks.every(task => task.status === 'completed');
      
      // Refresh data
      await fetchData();

      // If all tasks are completed and it's not a recurring task, close the dialog
      if (allTasksCompleted && selectedList && !selectedList.isRecurring) {
        setTaskDialogOpen(false);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        typeof error === 'object' && error && 'response' in error ? (error.response as any)?.data?.message : 
        'An unexpected error occurred';
      
      console.error('Error:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  // Handle task assignment
  const handleAssignTask = async (taskId: string, userId: string) => {
    try {
      if (!selectedInstance) return;
      
      await taskService.assignTask(getIdString(selectedInstance._id), taskId, userId);
      await fetchData();
      setAssignDialogOpen(false);
      toast({
        title: "Task Assigned",
        description: (
          <div className="mt-1 flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Task assigned successfully</span>
          </div>
        ),
        variant: "default",
        className: "bg-green-50 border-green-200",
        duration: 4000,
      });
    } catch (error: unknown) {
      console.error('Error:', error);
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
  };

  // Calculate completion metrics for active instance
  const getInstanceMetrics = (instance: TaskInstance) => {
    const totalTasks = instance.tasks.length;
    const completedTasks = instance.tasks.filter(t => t.status === 'completed').length;
    const totalTime = instance.tasks.reduce((acc, t) => acc + (t.estimatedTime || 0), 0);
    const remainingTime = instance.tasks
      .filter(t => t.status === 'pending')
      .reduce((acc, t) => acc + (t.estimatedTime || 0), 0);

    return {
      completedTasks,
      totalTasks,
      completionRate: (completedTasks / totalTasks) * 100,
      remainingTime
    };
  };

  // Filter task lists based on selected filters
  const filteredTaskLists = taskLists.filter(list => {
    // First check if there's a completed instance for this list
    const instance = getActiveInstance(getIdString(list._id));
    if (instance?.status === 'completed' && !list.isRecurring) {
      return false; // Don't show completed non-recurring tasks
    }

    // For monthly recurring tasks, only show on the specified date
    if (list.isRecurring && list.recurringType === 'monthly') {
      const today = new Date();
      if (today.getDate() !== list.monthlyDate) {
        return false; // Don't show if it's not the specified day of the month
      }
    }

    // For weekly recurring tasks, only show on the specified days
    if (list.isRecurring && list.recurringType === 'weekly') {
      const today = new Date();
      const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      return list.recurringDays?.includes(dayName) ?? false;
    }

    // Then apply other filters
    if (filters.department && list.department !== filters.department) return false;
    if (filters.shift && list.shift !== filters.shift) return false;
    return true;
  });

  // Filter instances based on status and other filters
  const filteredInstances = activeInstances
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort by newest first
    .filter(instance => {
      // Filter by status
      if (filters.status === 'completed') return instance.status === 'completed';
      if (filters.status === 'in_progress') return instance.status !== 'completed';
      
      // Filter by department and shift if set
      if (filters.department && instance.department !== filters.department) return false;
      if (filters.shift && instance.shift !== filters.shift) return false;
      
      return true;
    });

  // Get instance and metrics for a specific list
  const getListInstanceAndMetrics = (listId?: string) => {
    if (!listId) return { instance: null, metrics: null };
    const instance = getActiveInstance(listId);
    const metrics = instance ? getInstanceMetrics(instance) : null;
    return { instance, metrics };
  };

  // Handle starting a task list
  const handleStartTaskList = async (listId: string) => {
    try {
      if (!listId) {
        console.error('No list ID provided');
        toast({
          title: "Error Starting Task List",
          description: "No task list ID provided",
          variant: "destructive",
          duration: 4000,
        });
        return null;
      }

      // Get the task list to check if it's recurring
      const list = taskLists.find(l => l._id === listId);
      if (!list) {
        console.error('Task list not found:', listId);
        toast({
          title: "Error Starting Task List",
          description: "The selected task list could not be found",
          variant: "destructive",
          duration: 4000,
        });
        return null;
      }

      // Check if there's an existing instance
      const existingInstance = activeInstances.find(i => {
        const instanceListId = typeof i.taskList === 'string' ? i.taskList : i.taskList?._id;
        return instanceListId === listId;
      });

      // For non-recurring tasks, if there's a completed instance, don't start a new one
      if (!list.isRecurring && existingInstance?.status === 'completed') {
        return existingInstance;
      }

      // If there's an existing incomplete instance, return that instead of creating a new one
      if (existingInstance && existingInstance.status !== 'completed') {
        return existingInstance;
      }

      // Create a new instance
      console.log('Starting task list:', listId, list);
      const newInstance = await taskService.createInstance({
        taskListId: getIdString(list._id),
        date: new Date().toISOString()
      });
      console.log('Created new instance:', newInstance);

      // Refresh data and return the new instance
      await fetchData();
      
      // Find the newly created instance in the updated activeInstances
      const createdInstance = activeInstances.find(i => {
        const instanceListId = typeof i.taskList === 'string' ? i.taskList : i.taskList?._id;
        return instanceListId === listId && i._id === newInstance._id;
      });

      if (!createdInstance) {
        console.error('Created instance not found in active instances');
        toast({
          title: "Error",
          description: "Task list was created but could not be loaded. Please refresh the page.",
          variant: "destructive",
          duration: 4000,
        });
      }

      return createdInstance || newInstance;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        typeof error === 'object' && error && 'response' in error ? (error.response as any)?.data?.message : 
        'An unexpected error occurred';
      
      console.error('Error:', error);
      toast({
        title: "Error Starting Task List",
        description: errorMessage,
        variant: "destructive",
        duration: 4000,
      });
      return null;
    }
  };

  // Add delete instance handler
  const handleDeleteInstance = async (instanceId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    
    try {
      const taskList = taskLists.find(list => {
        const instance = activeInstances.find(i => i._id === instanceId);
        if (instance && list._id === (typeof instance.taskList === 'string' ? instance.taskList : instance.taskList._id)) {
          return true;
        }
        return false;
      });

      if (taskList && !window.confirm(`Are you sure you want to delete this task instance for "${taskList.name}"? This action cannot be undone.`)) {
        return;
      }
      
      const response = await taskService.deleteInstance(instanceId);
      toast({
        title: "Task Instance Deleted",
        description: (
          <div className="mt-1 flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>{response.message}</span>
          </div>
        ),
        variant: "default",
        className: "bg-green-50 border-green-200",
        duration: 4000,
      });
      await fetchData(); // Refresh the data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        typeof error === 'object' && error && 'response' in error ? (error.response as any)?.data?.message : 
        'An unexpected error occurred';
      
      console.error('Error:', error);
      toast({
        title: "Error Deleting Task Instance",
        description: (
          <div className="mt-1 flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        ),
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  // Get upcoming tasks for the next 30 days
  const getUpcomingTasks = () => {
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
  };

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
  const metrics = activeInstance ? getInstanceMetrics(activeInstance) : null;

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Task Management</h1>
                <p className="text-white/80 mt-2 text-lg">Manage and track daily operation tasks</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                {(user?.position === 'Leader' || user?.position === 'Director') && (
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-white text-[#E51636] hover:bg-white/90 h-12 px-6">
                        <Plus className="w-5 h-5 mr-2" />
                        Create List
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle>{selectedList ? 'Edit Task List' : 'Create New Task List'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4 overflow-y-auto pr-2">
                        <div>
                          <Label htmlFor="name">List Name</Label>
                          <Input
                            id="name"
                            value={newTaskList.name}
                            onChange={(e) => setNewTaskList(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter list name"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Department</Label>
                            <Select
                              value={newTaskList.department}
                              onValueChange={(value: Department) => 
                                setNewTaskList(prev => ({ ...prev, department: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                {departments.map(dept => (
                                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Shift</Label>
                            <Select
                              value={newTaskList.shift}
                              onValueChange={(value: Shift) => 
                                setNewTaskList(prev => ({ ...prev, shift: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select shift" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="day">Day</SelectItem>
                                <SelectItem value="night">Night</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="recurring"
                            checked={newTaskList.isRecurring}
                            onCheckedChange={(checked) => 
                              setNewTaskList(prev => ({ 
                                ...prev, 
                                isRecurring: checked as boolean,
                                recurringType: checked ? 'daily' : undefined,
                                recurringDays: [],
                                monthlyDate: 1
                              }))
                            }
                          />
                          <Label htmlFor="recurring">Recurring Task List</Label>
                        </div>

                        {newTaskList.isRecurring && (
                          <div className="space-y-4">
                            <div>
                              <Label>Recurring Type</Label>
                              <Select
                                value={newTaskList.recurringType}
                                onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                                  setNewTaskList(prev => ({ 
                                    ...prev, 
                                    recurringType: value,
                                    recurringDays: [],
                                    monthlyDate: 1
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select recurring type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {newTaskList.recurringType === 'weekly' && (
                              <div className="space-y-2">
                                <Label>Select Days of Week</Label>
                                <div className="flex flex-wrap gap-2">
                                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                                    <div key={day} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={day}
                                        checked={newTaskList.recurringDays.includes(day)}
                                        onCheckedChange={(checked) => {
                                          setNewTaskList(prev => ({
                                            ...prev,
                                            recurringDays: checked 
                                              ? [...prev.recurringDays, day]
                                              : prev.recurringDays.filter(d => d !== day)
                                          }));
                                        }}
                                      />
                                      <Label htmlFor={day} className="capitalize">{day}</Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {newTaskList.recurringType === 'monthly' && (
                              <div>
                                <Label>Day of Month</Label>
                                <Select
                                  value={newTaskList.monthlyDate.toString()}
                                  onValueChange={(value) => 
                                    setNewTaskList(prev => ({ 
                                      ...prev, 
                                      monthlyDate: parseInt(value)
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select day of month" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                      <SelectItem key={day} value={day.toString()}>
                                        {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label>Tasks</Label>
                            <Button 
                              type="button" 
                              onClick={() => setNewTaskList(prev => ({ 
                                ...prev, 
                                tasks: [...prev.tasks, { title: '', description: '', estimatedTime: undefined, scheduledTime: undefined }] 
                              }))} 
                              variant="outline" 
                              size="sm"
                            >
                              Add Task
                            </Button>
                          </div>
                          
                          {newTaskList.tasks.map((task, index) => (
                            <div key={index} className="space-y-2 border p-4 rounded-lg">
                              <Input
                                placeholder="Task title"
                                value={task.title}
                                onChange={(e) => setNewTaskList(prev => ({
                                  ...prev,
                                  tasks: prev.tasks.map((t, i) =>
                                    i === index ? { ...t, title: e.target.value } : t
                                  )
                                }))}
                              />
                              <Input
                                placeholder="Description (optional)"
                                value={task.description || ''}
                                onChange={(e) => setNewTaskList(prev => ({
                                  ...prev,
                                  tasks: prev.tasks.map((t, i) =>
                                    i === index ? { ...t, description: e.target.value } : t
                                  )
                                }))}
                              />
                              <div className="flex gap-4">
                                <div className="flex-1">
                                  <Label>Estimated time (minutes)</Label>
                                  <Input
                                    type="number"
                                    placeholder="Estimated time"
                                    value={task.estimatedTime || ''}
                                    onChange={(e) => setNewTaskList(prev => ({
                                      ...prev,
                                      tasks: prev.tasks.map((t, i) =>
                                        i === index ? { ...t, estimatedTime: parseInt(e.target.value) || undefined } : t
                                      )
                                    }))}
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label>Scheduled time</Label>
                                  <Input
                                    type="time"
                                    value={task.scheduledTime || ''}
                                    onChange={(e) => setNewTaskList(prev => ({
                                      ...prev,
                                      tasks: prev.tasks.map((t, i) =>
                                        i === index ? { ...t, scheduledTime: e.target.value || undefined } : t
                                      )
                                    }))}
                                  />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 mt-2"
                                onClick={() => setNewTaskList(prev => ({
                                  ...prev,
                                  tasks: prev.tasks.filter((_, i) => i !== index)
                                }))}
                              >
                                Remove Task
                              </Button>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                          <Button variant="outline" onClick={() => {
                            setCreateDialogOpen(false);
                            setSelectedList(null);
                            setNewTaskList({
                              name: '',
                              department: departments[0],
                              shift: '' as Shift,
                              isRecurring: false,
                              recurringType: undefined,
                              recurringDays: [],
                              monthlyDate: 1,
                              tasks: []
                            });
                          }}>
                            Cancel
                          </Button>
                          <Button onClick={async () => {
                            try {
                              if (!newTaskList.name || !newTaskList.department || !newTaskList.shift) {
                                return;
                              }

                              const taskListToSave = {
                                ...newTaskList,
                                isActive: true,
                                tasks: newTaskList.tasks.map(task => ({
                                  ...task,
                                  _id: crypto.randomUUID()
                                })),
                                recurringType: newTaskList.isRecurring ? newTaskList.recurringType : undefined,
                                recurringDays: newTaskList.isRecurring && newTaskList.recurringType === 'weekly' ? newTaskList.recurringDays : undefined,
                                monthlyDate: newTaskList.isRecurring && newTaskList.recurringType === 'monthly' ? newTaskList.monthlyDate : undefined
                              };

                              if (selectedList) {
                                await taskService.updateList(getIdString(selectedList._id), taskListToSave);
                                toast({
                                  title: "Task List Updated",
                                  description: (
                                    <div className="mt-1 flex items-center gap-2 text-green-600">
                                      <CheckCircle className="h-4 w-4" />
                                      <span>Task list updated successfully</span>
                                    </div>
                                  ),
                                  variant: "default",
                                  className: "bg-green-50 border-green-200",
                                  duration: 4000,
                                });
                              } else {
                                await taskService.createList(taskListToSave);
                                toast({
                                  title: "Task List Created",
                                  description: (
                                    <div className="mt-1 flex items-center gap-2 text-green-600">
                                      <CheckCircle className="h-4 w-4" />
                                      <span>Task list created successfully</span>
                                    </div>
                                  ),
                                  variant: "default",
                                  className: "bg-green-50 border-green-200",
                                  duration: 4000,
                                });
                              }
                              
                              await fetchData();
                              setCreateDialogOpen(false);
                              setSelectedList(null);
                              setNewTaskList({
                                name: '',
                                department: departments[0],
                                shift: '' as Shift,
                                isRecurring: false,
                                recurringType: undefined,
                                recurringDays: [],
                                monthlyDate: 1,
                                tasks: []
                              });
                            } catch (error: unknown) {
                              const errorMessage = error instanceof Error ? error.message : 
                                typeof error === 'object' && error && 'response' in error ? (error.response as any)?.data?.message : 
                                `Failed to ${selectedList ? 'update' : 'create'} task list`;
                              
                              toast({
                                title: selectedList ? "Error Updating Task List" : "Error Creating Task List",
                                description: (
                                  <div className="mt-1 flex items-center gap-2 text-destructive">
                                    <XCircle className="h-4 w-4" />
                                    <span>{errorMessage}</span>
                                  </div>
                                ),
                                variant: "destructive",
                                duration: 4000,
                              });
                            }
                          }}>
                            {selectedList ? 'Update Task List' : 'Create Task List'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </div>

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
            {getUpcomingTasks().map(({ date, tasks }) => (
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
                  {tasks.map(list => (
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
                              Created by: {list.createdBy?.name || 'Unknown'}
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
                  ))}
                </div>
              </div>
            ))}
            {getUpcomingTasks().length === 0 && (
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
              .map((instance) => {
                const taskList = taskLists.find(list => 
                  list._id === (typeof instance.taskList === 'string' ? instance.taskList : instance.taskList._id)
                );
                const metrics = getInstanceMetrics(instance);
                
                return (
                  <Card 
                    key={getIdString(instance._id)}
                    className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer w-full bg-green-50 border-green-100"
                    onClick={() => {
                      setSelectedList(taskList || null);
                      setTaskDialogOpen(true);
                    }}
                  >
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-[#27251F]">{taskList?.name}</h3>
                            <span className={cn(
                              "text-sm px-3 py-1 rounded-full font-medium",
                              instance.status === 'completed' 
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            )}>
                              {instance.status === 'completed' ? 'Completed' : 'In Progress'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[#27251F]/60">{instance.department}</span>
                            <span className="text-[#27251F]/60">•</span>
                            <span className="text-[#27251F]/60 capitalize">{instance.shift} Shift</span>
                          </div>
                          <div className="mt-2 text-sm text-[#27251F]/60">
                            Created: {new Date(instance.createdAt).toLocaleDateString()} by {
                              typeof instance.taskList === 'object' && 'createdBy' in instance.taskList ? instance.taskList.createdBy?.name : 'Unknown'
                            }
                          </div>
                          <div className="mt-4">
                            <span className="text-[#27251F]/60 font-medium">
                              {metrics.completedTasks}/{metrics.totalTasks} Tasks
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {user?.position && ['Leader', 'Director'].includes(user.position) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                              onClick={(e) => handleDeleteInstance(getIdString(instance._id), e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            {instance.status === 'completed' ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-600" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <div className="h-2 bg-[#E51636]/10 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              instance.status === 'completed' 
                                ? "bg-green-500" 
                                : metrics.completionRate === 100 
                                  ? "bg-green-500"
                                  : "bg-[#E51636]"
                            )}
                            style={{ width: `${metrics.completionRate}%` }} 
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-[#27251F]/60">
                            {instance.status === 'completed' ? 'Completed' : metrics.completionRate === 100 ? 'All Tasks Done' : 'Progress'}
                          </span>
                          <span className="text-sm font-medium text-[#27251F]">
                            {Math.round(metrics.completionRate)}%
                          </span>
                        </div>
                        {instance.status === 'completed' && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="text-sm text-[#27251F]/60">
                              <p>Completed at: {new Date(instance.updatedAt).toLocaleString()}</p>
                            </div>
                          </div>
                        )}
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
                <div
                  key={getIdString(list._id)}
                  className={cn(
                    "p-6 rounded-[12px] border border-[#27251F]/10 cursor-pointer transition-all duration-300",
                    selectedList?._id === list._id && "border-blue-600/40 bg-blue-50/40",
                    !selectedList && "hover:border-[#27251F]/20 hover:bg-gray-50/50"
                  )}
                  onClick={() => {
                    setSelectedList(list || null);
                    setTaskDialogOpen(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-[#27251F]">
                        {list.name}
                      </h2>
                      <div className="mt-1 text-sm text-[#27251F]/60">
                        {list.department} • {list.shift} shift
                      </div>
                      {list.isRecurring && (
                        <div className="mt-2 text-sm text-[#27251F]/60">
                          Recurring: {list.recurringType === 'daily' ? 'Daily' :
                            list.recurringType === 'weekly' ? 
                              `Weekly on ${list.recurringDays?.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')}` :
                            list.recurringType === 'monthly' ? 
                              `Monthly on the ${list.monthlyDate}${
                                list.monthlyDate === 1 ? 'st' : 
                                list.monthlyDate === 2 ? 'nd' : 
                                list.monthlyDate === 3 ? 'rd' : 'th'
                              }` : ''}
                        </div>
                      )}
                      {instance && (
                        <div className="mt-2 text-sm text-[#27251F]/60">
                          Created: {new Date(instance.createdAt).toLocaleDateString()} by {
                            typeof instance.taskList === 'object' && 'createdBy' in instance.taskList ? instance.taskList.createdBy?.name : 'Unknown'
                          }
                        </div>
                      )}
                      {instance && metrics && (
                        <div className="flex items-center gap-2 mt-4">
                          <span className="text-[#27251F]/60 font-medium">
                            {metrics.completedTasks}/{metrics.totalTasks} Tasks
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {user?.position && ['Leader', 'Director'].includes(user.position) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                setSelectedList(list || null);
                                
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
                            <Users className="h-4 w-4 mr-1" />
                            Assign Tasks
                          </Button>
                        </>
                      )}
                      {list.isRecurring ? (
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Clock className="h-4 w-4 text-green-600" />
                        </div>
                      ) : instance?.status === 'completed' ? (
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
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
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col rounded-[20px] border-0 shadow-xl">
            <DialogHeader className="bg-gradient-to-r from-[#E51636] to-[#DD0031] text-white p-6 rounded-t-[20px] relative">
              <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10 rounded-t-[20px]" />
              <div className="relative">
                <DialogTitle className="text-lg font-bold">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span>{selectedList?.name || 'Task List'}</span>
                      {activeInstance?.status === 'completed' && (
                        <span className="bg-white/20 text-white text-sm px-2 py-0.5 rounded-full font-medium">
                          Completed
                        </span>
                      )}
                    </div>
                    {selectedList && (
                      <div className="flex items-center gap-2 text-white/80 text-sm">
                        <span>{selectedList.department}</span>
                        <span>•</span>
                        <span className="capitalize">{selectedList.shift} Shift</span>
                      </div>
                    )}
                  </div>
                </DialogTitle>
              </div>
            </DialogHeader>

            {selectedList && (
              <>
                {/* Progress Section */}
                <div className="px-8 pt-6">
                  <div className="bg-[#F4F4F4] rounded-[20px] p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-[#27251F]">Overall Progress</span>
                      {(() => {
                        const { metrics } = getListInstanceAndMetrics(selectedList ? getIdString(selectedList._id) : undefined);
                        return metrics ? (
                          <span className="text-sm font-medium text-[#27251F]">
                            {metrics.completedTasks}/{metrics.totalTasks} Tasks ({Math.round(metrics.completionRate)}%)
                          </span>
                        ) : null;
                      })()}
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

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                  <div className="space-y-3">
                    {(() => {
                      if (!selectedList) {
                        return (
                          <div className="text-center py-4 text-[#27251F]/60">
                            No task list selected
                          </div>
                        );
                      }

                      const { instance } = getListInstanceAndMetrics(selectedList ? getIdString(selectedList._id) : undefined);
                      const tasks = instance ? instance.tasks : selectedList.tasks;
                      
                      if (!tasks || tasks.length === 0) {
                        return (
                          <div className="text-center py-4 text-[#27251F]/60">
                            No tasks found in this list
                          </div>
                        );
                      }

                      return tasks.map((task, index) => {
                        const currentTask = instance?.tasks?.[index];
                        return (
                          <div
                            key={getIdString(task._id)}
                            className={cn(
                              "border-b border-[#27251F]/10 py-4 flex items-start justify-between gap-4",
                              currentTask?.status === 'completed' && "opacity-50"
                            )}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className={cn(
                                  "text-base font-medium",
                                  currentTask?.status === 'completed' && "line-through"
                                )}>
                                  {task.title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-4">
                                {task.estimatedTime && (
                                  <p className={cn(
                                    "text-sm text-[#27251F]/60 transition-all duration-300",
                                    currentTask?.status === 'completed' && "opacity-40"
                                  )}>
                                    Estimated time: {task.estimatedTime} minutes
                                  </p>
                                )}
                                {currentTask?.assignedTo && (
                                  <p className={cn(
                                    "text-sm text-blue-600 flex items-center gap-1",
                                    currentTask?.status === 'completed' && "opacity-40"
                                  )}>
                                    <Users className="h-3 w-3" />
                                    Assigned to: {currentTask.assignedTo.name}
                                  </p>
                                )}
                              </div>
                              {currentTask?.status === 'completed' && currentTask.completedBy && currentTask.completedAt && (
                                <div className="mt-2 text-sm text-green-600">
                                  <p>Completed by: {currentTask.completedBy.name}</p>
                                  <p>Completed at: {new Date(currentTask.completedAt).toLocaleString()}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    setSelectedList(selectedList || null);
                                    
                                    let currentInstance = instance;
                                    if (!currentInstance) {
                                      console.log('Starting task list for assignment:', selectedList);
                                      currentInstance = await handleStartTaskList(getIdString(selectedList._id));
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

                                    // Set the task ID for the specific task being assigned
                                    const taskToAssign = currentInstance.tasks[index];
                                    if (!taskToAssign || !taskToAssign._id) {
                                      console.error('Task not found in instance:', { index, tasks: currentInstance.tasks });
                                      toast({
                                        title: "Error",
                                        description: "Could not find task to assign",
                                        variant: "destructive",
                                        duration: 4000,
                                      });
                                      return;
                                    }

                                    setSelectedInstance(currentInstance);
                                    setSelectedTaskId(getIdString(taskToAssign._id));
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
                                <Users className="h-4 w-4 mr-1" />
                                {currentTask?.assignedTo?.name ? `Reassign (${currentTask.assignedTo.name})` : 'Assign'}
                              </Button>
                              <Button
                                variant={instance?.status === 'completed' ? "outline" : "default"}
                                size="sm"
                                disabled={instance?.status === 'completed'}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    if (!selectedList) {
                                      toast({
                                        title: "Error",
                                        description: "No task list selected",
                                        variant: "destructive",
                                        duration: 4000,
                                      });
                                      return;
                                    }

                                    let currentInstance = instance;
                                    if (!currentInstance) {
                                      currentInstance = await handleStartTaskList(getIdString(selectedList._id));
                                      if (!currentInstance) return;
                                    }

                                    if (currentInstance.status === 'completed') return;

                                    const taskToUpdate = currentInstance.tasks[index];
                                    if (taskToUpdate) {
                                      const newStatus = taskToUpdate.status === 'completed' ? 'pending' : 'completed';
                                      await handleTaskComplete(getIdString(currentInstance._id), getIdString(taskToUpdate._id), newStatus);
                                    }
                                  } catch (error: unknown) {
                                    console.error('Error updating task:', error);
                                    const errorMessage = error instanceof Error ? error.message : 
                                      typeof error === 'object' && error && 'response' in error ? (error.response as any)?.data?.message : 
                                      'Failed to update task';
                                    
                                    toast({
                                      title: "Error",
                                      description: errorMessage,
                                      variant: "destructive",
                                      duration: 4000,
                                    });
                                  }
                                }}
                                className={cn(
                                  instance?.status === 'completed' 
                                    ? "hover:bg-green-50" 
                                    : "bg-[#E51636] hover:bg-[#DD0031] text-white"
                                )}
                              >
                                {instance?.status === 'completed' ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Task List Completed
                                  </>
                                ) : currentTask?.status === 'completed' ? (
                                  'Mark Incomplete'
                                ) : (
                                  'Mark Complete'
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto border-t py-4 px-6 bg-gray-50/80">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-[#27251F]/60">
                      {(() => {
                        const { metrics } = getListInstanceAndMetrics(selectedList ? getIdString(selectedList._id) : undefined);
                        return metrics?.remainingTime ? (
                          <span>Estimated time remaining: <span className="font-medium">{metrics.remainingTime} minutes</span></span>
                        ) : null;
                      })()}
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setTaskDialogOpen(false)}
                      className="hover:bg-gray-100"
                      size="sm"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </>
            )}
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
      </div>
    </div>
  );
};

export default TaskManagement; 