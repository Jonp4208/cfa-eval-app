// File: src/lib/services/settings.ts
import api from '../axios';

export interface StoreSettings {
  darkMode: boolean;
  compactMode: boolean;
  storeName: string;
  storeNumber: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  userAccess: {
    allowRegistration: boolean;
    defaultRole: string;
  };
  evaluations: {
    allowSelfEvaluations: boolean;
    reviewPeriodDays: number;
  };
}

export interface StoreInfo {
  name: string;
  storeNumber: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
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

  resetSettings: async (): Promise<StoreSettings> => {
    try {
      const response = await api.post('/api/settings/reset');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};