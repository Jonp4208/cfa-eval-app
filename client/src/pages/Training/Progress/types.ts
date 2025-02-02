import { Employee } from '../../../types';
import { TrainingPlan, TraineeProgress } from '../../../types/training';

export interface ModuleProgress {
  moduleId: string;
  completed: boolean;
  completionPercentage: number;
  completedBy?: string;
  completedAt?: Date;
  notes?: string;
}

export interface ExtendedTraineeProgress extends Omit<TraineeProgress, 'moduleProgress'> {
  trainingPlan?: SimplifiedTrainingPlan;
  moduleProgress: ModuleProgress[];
}

export interface EmployeeWithProgress extends Omit<Employee, 'trainingPlan'> {
  _id: string;
  position: string;
  trainingProgress: ExtendedTraineeProgress[];
}

export interface SimplifiedTrainingPlan {
  id: string;
  _id: string;
  name: string;
  startDate: string;
  severity: number;
  type: 'NEW_HIRE' | 'REGULAR';
  department: 'FOH' | 'BOH';
  numberOfDays: number;
  modules: TrainingPlan['modules'];
  includesCoreValues: boolean;
  includesBrandStandards: boolean;
  isTemplate: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  store: string;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
} 