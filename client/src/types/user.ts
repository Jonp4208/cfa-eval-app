export interface User {
  _id: string;
  name: string;
  email: string;
  departments: string[];
  position: string;
  isAdmin: boolean;
  status: string;
  store: {
    _id: string;
    name: string;
    storeNumber: string;
  };
  manager?: {
    _id: string;
    name: string;
  };
  startDate?: Date;
  previousRoles?: {
    position: string;
    startDate: Date;
    endDate?: Date;
  }[];
  evaluations?: {
    date: Date;
    score: number;
    type: string;
    strengths: string[];
    improvements: string[];
  }[];
  certifications?: {
    name: string;
    achievedDate: Date;
    expiryDate?: Date;
    status: 'active' | 'expired' | 'pending';
  }[];
  development?: {
    goal: string;
    status: 'not-started' | 'in-progress' | 'completed';
    targetDate: Date;
    progress: number;
    notes: string[];
  }[];
  recognition?: {
    date: Date;
    title: string;
    description?: string;
    awardedBy: string;
  }[];
  documentation?: {
    type: 'review' | 'disciplinary' | 'coaching';
    date: Date;
    title: string;
    description?: string;
    createdBy: string;
  }[];
  metrics?: {
    evaluationScores: {
      date: Date;
      score: number;
    }[];
    trainingCompletion: number;
    goalAchievement: number;
    leadershipScore: number;
    heartsAndHands: {
      x: number;
      y: number;
    };
  };
} 