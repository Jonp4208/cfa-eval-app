export type Department = 'Front Counter' | 'Drive Thru' | 'Kitchen';
export type Shift = 'day' | 'night';
export type TaskStatus = 'pending' | 'completed';
export type TaskInstanceStatus = 'in_progress' | 'completed';

export interface Task {
  _id?: string;
  title: string;
  description?: string;
  estimatedTime?: number;
  scheduledTime?: string; // ISO string format for time (HH:mm)
}

export interface MongoId {
  $oid?: string;
  _id?: string;
  toString(): string;
}

export interface TaskList {
  _id: string | MongoId;
  name: string;
  department: string;
  shift: 'day' | 'night';
  isActive: boolean;
  isRecurring: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly';
  recurringDays?: string[];
  monthlyDate?: number;
  tasks: Array<{
    _id: string | MongoId;
    title: string;
    description?: string;
    estimatedTime?: number;
    scheduledTime?: string;
  }>;
  createdBy: {
    _id: string | MongoId;
    name: string;
  };
  store: string | MongoId;
  createdAt: string | Date;
  updatedAt: string | Date;
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
  _id: string | MongoId;
  taskList: string | MongoId | TaskList;
  date: string | Date;
  status: 'pending' | 'completed';
  department: Department;
  shift: Shift;
  tasks: Array<{
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
    };
    completedAt?: string | Date;
  }>;
  createdBy: {
    _id: string | MongoId;
    name: string;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
} 