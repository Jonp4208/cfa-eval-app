export type LeadershipLevel = 'Team Member' | 'Trainer' | 'Leader' | 'Director';

export type RoleType = 'Operations' | 'Training' | 'Management';

export type CompetencyStatus = 'not_started' | 'in_progress' | 'completed';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  criteria: string[];
  status: CompetencyStatus;
  completedDate?: Date;
  verificationRequired?: boolean;
  verifiedBy?: string;
  verificationDate?: Date;
}

export interface Competency {
  id: string;
  name: string;
  description: string;
  level: LeadershipLevel;
  category: 'Character' | 'Skills' | 'Knowledge' | 'Results';
  milestones: Milestone[];
  status: CompetencyStatus;
  source: 'Miller' | 'CFA' | 'Both';
  requiredFor?: LeadershipLevel[];
}

export interface CompetencyProgress {
  competencyId: string;
  status: CompetencyStatus;
  startDate: Date;
  lastUpdated: Date;
  completedMilestones: string[];
  verifiedMilestones: string[];
}

export interface DevelopmentPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  currentLevel: LeadershipLevel;
  targetLevel: LeadershipLevel;
  roleType: RoleType;
  startDate: Date;
  targetCompletionDate: Date;
  competencies: {
    competencyId: string;
    required: boolean;
    order: number;
  }[];
  progress: CompetencyProgress[];
  assignedBy?: string;
  assignedDate?: Date;
  status: 'draft' | 'active' | 'completed' | 'archived';
  isTemplate?: boolean;
  customizations?: {
    addedCompetencies?: string[];
    removedCompetencies?: string[];
    notes?: string;
  };
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'Book' | 'Article' | 'Video' | 'Exercise' | 'Assessment';
  source: 'Miller' | 'CFA';
  competencyIds: string[];
  url?: string;
  requiredFor?: LeadershipLevel[];
  estimatedTimeMinutes?: number;
} 