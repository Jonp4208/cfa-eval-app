// File: src/lib/services/settings.ts
import api from '../axios';

export interface UserAccessSettings {
  roleManagement: {
    storeDirectorAccess: boolean;
    storeLeaderAccess: boolean;
    fohLeaderAccess: boolean;
    bohLeaderAccess: boolean;
    dtLeaderAccess: boolean;
  };
  evaluation: {
    departmentRestriction: boolean;
    requireStoreLeaderReview: boolean;
    requireDirectorApproval: boolean;
    workflowType: 'simple' | 'standard' | 'strict';
  };
}

export interface EvaluationSchedulingSettings {
  autoSchedule: boolean;
  frequency?: number;
  cycleStart?: 'hire_date' | 'last_evaluation' | 'calendar_year' | 'fiscal_year' | 'custom';
  transitionMode?: 'immediate' | 'complete_cycle' | 'align_next';
  customStartDate?: string;
}

export interface EvaluationSettings {
  scheduling?: EvaluationSchedulingSettings;
  configurationIssues?: {
    unassignedEvaluators: number;
  };
}

export interface StoreSettings {
  darkMode: boolean;
  compactMode: boolean;
  storeName: string;
  storeNumber: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  visionStatement: string;
  missionStatement: string;
  userAccess: UserAccessSettings;
  evaluations?: EvaluationSettings;
}

export interface StoreInfo {
  name: string;
  storeNumber: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  visionStatement: string;
  missionStatement: string;
}

export interface SchedulingResults {
  scheduled: number;
  skipped: number;
  errors: number;
}

export interface SettingsUpdateResponse extends StoreSettings {
  schedulingResults?: SchedulingResults;
}

export const settingsService = {
  getSettings: async (): Promise<StoreSettings> => {
    try {
      const response = await api.get('/api/settings');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getStoreInfo: async (): Promise<StoreInfo> => {
    try {
      const response = await api.get('/api/settings/store');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateSettings: async (data: Partial<StoreSettings>): Promise<SettingsUpdateResponse> => {
    try {
      const response = await api.patch('/api/settings', data);
      return response.data;
    } catch (error: any) {
      // Log the error details for debugging
      console.error('Settings update error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  updateStoreInfo: async (storeInfo: Partial<StoreInfo>): Promise<StoreInfo> => {
    try {
      const response = await api.patch('/api/settings/store', storeInfo);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resetToDefault: async (): Promise<StoreSettings> => {
    try {
      const response = await api.patch('/api/settings', { resetToDefault: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};