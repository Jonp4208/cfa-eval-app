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
  department: Department;
  shift: Shift;
  isActive: boolean;
  isRecurring: boolean;
  tasks: {
    _id?: string | MongoId;  // Make _id optional for new tasks
    title: string;
    description?: string;
    estimatedTime?: number;
    scheduledTime?: string;
  }[];
  recurringType?: 'daily' | 'weekly' | 'monthly';
  recurringDays?: string[];
  monthlyDate?: number;
  createdBy: string | MongoId | { _id: string | MongoId; name: string; };
  store: string | MongoId;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TaskItem {
  _id?: string | MongoId;
  title: string;
  description?: string;
  estimatedTime?: number;
  scheduledTime?: string;
  status?: 'pending' | 'completed';
  assignedTo?: { _id: string | MongoId; name: string; };
  completedBy?: { _id: string | MongoId; name: string; } | string;
  completedAt?: string | Date;
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