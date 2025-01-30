export interface Employee {
    _id: string;
    name: string;
    department: string;
    position: string;
    trainingProgress?: TraineeProgress[];
}

export interface TrainingPosition {
    _id: string;
    name: string;
    department: 'FOH' | 'BOH';
    description: string;
    isActive: boolean;
}

export interface TrainingModule {
    name: string;
    description: string;
    department: 'FOH' | 'BOH';
    estimatedDuration: string;
    dayNumber: number;
    materials?: TrainingMaterial[];
    requiredForNewHire?: boolean;
}

export interface TrainingMaterial {
    title: string;
    type: 'DOCUMENT' | 'VIDEO' | 'PATHWAY_LINK';
    url: string;
    category: string;
}

export interface TrainingPlan {
    _id: string;
    name: string;
    type: 'NEW_HIRE' | 'REGULAR';
    department: 'FOH' | 'BOH';
    numberOfDays: number;
    modules: TrainingModule[];
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
}

export interface TraineeProgress {
    _id: string;
    traineeId: string;
    trainingPlanId: string;
    startDate: Date;
    assignedTrainerId?: string;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
    moduleProgress: {
        moduleId: string;
        completed: boolean;
        completionPercentage: number;
        completedBy?: string;
        completedAt?: Date;
        notes?: string;
    }[];
}

// For managing configurable positions/categories
export interface TrainingCategory {
    _id: string;
    name: string;
    department: 'FOH' | 'BOH';
    description: string;
    positions: TrainingPosition[];
    isActive: boolean;
}

export interface NewTrainingPlan {
    name: string;
    description: string;
    department: string;
    type: 'New Hire' | 'Regular';
    days: {
        dayNumber: number;
        modules: {
            name: string;
            duration: number;
        }[];
    }[];
} 