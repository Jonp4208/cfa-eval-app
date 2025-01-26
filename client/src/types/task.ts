export type Department = 'Front Counter' | 'Drive Thru' | 'Kitchen';
export type Shift = 'day' | 'night';
export type TaskStatus = 'pending' | 'completed';
export type TaskInstanceStatus = 'in_progress' | 'completed';

export interface Task {
  _id?: string;
  title: string;
  description?: string;
  estimatedTime?: number;
}

export interface TaskList {
  _id: string;
  name: string;
  department: Department;
  shift: Shift;
  isRecurring: boolean;
  recurringDays?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  tasks: Task[];
  createdBy: {
    _id: string;
    name: string;
  };
  store: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskItem extends Task {
  assignedTo?: {
    _id: string;
    name: string;
  };
  completedBy?: {
    _id: string;
    name: string;
  };
  completedAt?: string;
  status: TaskStatus;
}

export interface TaskInstance {
  _id: string;
  taskList: TaskList;
  department: Department;
  shift: Shift;
  date: string;
  tasks: TaskItem[];
  store: string;
  status: TaskInstanceStatus;
  completionRate: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskMetrics {
  totalInstances: number;
  completedInstances: number;
  averageCompletionRate: number;
  tasksByUser: {
    [userId: string]: {
      name: string;
      completed: number;
    };
  };
} 