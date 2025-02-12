import React, { createContext, useContext, useState } from 'react';

interface AppConfig {
  // Application-wide settings
  maxItemsPerPage: number;
  dateFormat: string;
  timeFormat: string;
  dateTimeFormat: string;
  evaluationTypes: string[];
  departments: string[];
  positions: string[];
  
  // Feature flags
  enableNewFeatures: boolean;
  enableBetaFeatures: boolean;
  
  // Theme settings
  primaryColor: string;
  secondaryColor: string;
  dangerColor: string;
  successColor: string;
  warningColor: string;
  
  // API endpoints
  apiBaseUrl: string;
  
  // Notification settings
  notificationDuration: number;
  maxNotifications: number;
}

const defaultConfig: AppConfig = {
  maxItemsPerPage: 10,
  dateFormat: 'MM/dd/yyyy',
  timeFormat: 'hh:mm a',
  dateTimeFormat: 'MM/dd/yyyy HH:mm',
  evaluationTypes: [
    'Monthly Review',
    'Quarterly Review',
    'Annual Review',
    'Performance Improvement',
    'Training Completion'
  ],
  departments: [
    'Front of House',
    'Back of House',
    'Management'
  ],
  positions: [
    'Team Member',
    'Trainer',
    'Shift Leader',
    'Manager',
    'General Manager'
  ],
  
  // Feature flags
  enableNewFeatures: false,
  enableBetaFeatures: false,
  
  // Theme settings - using CFA brand colors
  primaryColor: '#E51636',
  secondaryColor: '#DD0031',
  dangerColor: '#dc2626',
  successColor: '#16a34a',
  warningColor: '#d97706',
  
  // API settings
  apiBaseUrl: '/api',
  
  // Notification settings
  notificationDuration: 5000,
  maxNotifications: 5
};

interface AppContextType {
  config: AppConfig;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);

  const updateConfig = (newConfig: Partial<AppConfig>) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig
    }));
  };

  return (
    <AppContext.Provider value={{ config, updateConfig }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 