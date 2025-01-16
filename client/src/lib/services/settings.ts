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
      const response = await api.patch('/api/settings', settings);
      return response.data;
    } catch (error) {
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