// File: src/lib/services/settings.ts
import api from '../axios';

export interface StoreSettings {
  general: {
    darkMode: boolean;
    storeName?: string;
    storeNumber?: string;
    location?: string;
  };
  userAccess: {
    allowRegistration: boolean;
    requireApproval: boolean;
    requireEmailVerification: boolean;
    autoAssignBasicRole: boolean;
  };
  evaluations: {
    autoSave: boolean;
    enableSelfEvaluations: boolean;
    requireComments: boolean;
    allowDraftSaving: boolean;
    defaultReviewPeriod: number;
  };
  notifications: {
    emailEnabled: boolean;
    newEvaluationAlerts: boolean;
    emailNotifications: boolean;
    evaluationReminders: boolean;
    systemUpdates: boolean;
    reminderLeadTime: number;
  };
}

export interface StoreInfo {
  id: string;
  name: string;
  storeNumber: string;
  location: string;
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

  updateSettings: async (settings: Partial<StoreSettings>): Promise<StoreSettings> => {
    try {
      const response = await api.put('/api/settings', settings);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateStoreInfo: async (storeInfo: Partial<StoreInfo>): Promise<StoreInfo> => {
    try {
      const response = await api.put('/api/settings/store', storeInfo);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resetSettings: async (): Promise<StoreSettings> => {
    try {
      const response = await api.post('/api/settings/reset');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};