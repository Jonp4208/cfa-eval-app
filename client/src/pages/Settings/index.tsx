// File: src/pages/Settings/index.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Users, FileText, Bell, BarChart, Save, RotateCcw } from 'lucide-react';
import { cn } from "@/lib/utils";
import UserAccessSettings from './components/UserAccessSettings';
import EvaluationSettings from './components/EvaluationSettings';
import ChangePasswordForm from './components/ChangePasswordForm';
import { settingsService } from '@/lib/services/settings';
import api from '@/lib/axios';
import { handleError } from '@/lib/utils/error-handler';

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // State to track form changes
  const [formState, setFormState] = useState({
    storeName: '',
    storeNumber: '',
    storeAddress: '',
    storePhone: '',
    storeEmail: '',
    darkMode: false,
    compactMode: false
  });

  // Fetch settings and store info
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings
  });

  // Update form state when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormState({
        storeName: settings.storeName || '',
        storeNumber: settings.storeNumber || '',
        storeAddress: settings.storeAddress || '',
        storePhone: settings.storePhone || '',
        storeEmail: settings.storeEmail || '',
        darkMode: settings.darkMode || false,
        compactMode: settings.compactMode || false
      });
    }
  }, [settings]);

  const handleSettingChange = (key: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      [key]: value
    }));

    // For toggle switches, update immediately
    if (typeof value === 'boolean') {
      updateSettingsMutation.mutate({
        [key]: value
      });
    }
  };

  // Update mutations
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch('/api/settings', data);
      return response.data;
    },
    onSuccess: () => {
      setSuccess('Settings updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      setError('');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update settings');
      setSuccess('');
    }
  });

  const updateStoreInfoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch('/api/settings/store', data);
      return response.data;
    },
    onSuccess: () => {
      setSuccess('Store information updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      setError('');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update store information');
      setSuccess('');
    }
  });

  // Reset settings mutation
  const resetSettingsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/settings/reset');
      return response.data;
    },
    onSuccess: () => {
      setSuccess('Settings reset successfully');
      setTimeout(() => setSuccess(''), 3000);
      setError('');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to reset settings');
      setSuccess('');
    }
  });

  const handleSaveGeneral = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      if (isAdmin) {
        await updateStoreInfoMutation.mutateAsync({
          name: formState.storeName,
          storeNumber: formState.storeNumber,
          storeAddress: formState.storeAddress,
          storePhone: formState.storePhone,
          storeEmail: formState.storeEmail
        });
      }

      await updateSettingsMutation.mutateAsync({
        darkMode: formState.darkMode,
        compactMode: formState.compactMode,
        storeName: formState.storeName,
        storeNumber: formState.storeNumber,
        storeAddress: formState.storeAddress,
        storePhone: formState.storePhone,
        storeEmail: formState.storeEmail
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (isSettingsLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
          {success}
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4 pb-4">
          <TabsList className="w-full border-b justify-start min-w-max">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="whitespace-nowrap">General</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="whitespace-nowrap">User Access</span>
            </TabsTrigger>
            <TabsTrigger value="evaluations" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="whitespace-nowrap">Evaluations</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="whitespace-nowrap">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span className="whitespace-nowrap">Reports</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="space-y-4">
          <form onSubmit={handleSaveGeneral}>
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>Update your store's basic information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="storeName" className="text-sm font-medium">Store Name</label>
                    <Input
                      id="storeName"
                      name="storeName"
                      value={formState.storeName}
                      onChange={(e) => handleSettingChange('storeName', e.target.value)}
                      placeholder="Enter store name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="storeNumber" className="text-sm font-medium">Store Number</label>
                    <Input
                      id="storeNumber"
                      value={formState.storeNumber}
                      onChange={(e) => handleSettingChange('storeNumber', e.target.value)}
                      placeholder="Enter store number"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="storeAddress" className="text-sm font-medium">Store Address</label>
                  <Input
                    id="storeAddress"
                    value={formState.storeAddress}
                    onChange={(e) => handleSettingChange('storeAddress', e.target.value)}
                    placeholder="Enter store address"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="storePhone" className="text-sm font-medium">Store Phone</label>
                    <Input
                      id="storePhone"
                      value={formState.storePhone}
                      onChange={(e) => handleSettingChange('storePhone', e.target.value)}
                      placeholder="Enter store phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="storeEmail" className="text-sm font-medium">Store Email</label>
                    <Input
                      id="storeEmail"
                      value={formState.storeEmail}
                      onChange={(e) => handleSettingChange('storeEmail', e.target.value)}
                      placeholder="Enter store email"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full sm:w-auto">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </form>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the application looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor="darkMode" className="text-sm font-medium">Dark Mode</label>
                  <p className="text-sm text-gray-500">Enable dark mode for the application</p>
                </div>
                <Switch
                  id="darkMode"
                  checked={formState.darkMode}
                  onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor="compactMode" className="text-sm font-medium">Compact Mode</label>
                  <p className="text-sm text-gray-500">Make the interface more compact</p>
                </div>
                <Switch
                  id="compactMode"
                  checked={formState.compactMode}
                  onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Update your security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <UserAccessSettings 
            settings={settings?.userAccess}
            onUpdate={(data) => updateSettingsMutation.mutate({ userAccess: data })}
            isUpdating={updateSettingsMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="evaluations">
          <EvaluationSettings 
            settings={settings?.evaluations}
            onUpdate={(data) => updateSettingsMutation.mutate({ evaluations: data })}
            isUpdating={updateSettingsMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Notification settings content */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;