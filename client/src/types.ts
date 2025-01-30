export interface Employee {
  id: string;
  name: string;
  department: string;
  trainingPlan?: TrainingPlan;
  moduleProgress: { completed: boolean }[];
}

export interface TrainingPlan {
  id: string;
  name: string;
  startDate: string;
} 