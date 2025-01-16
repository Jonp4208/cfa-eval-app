// File: src/pages/Settings/index.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Users, FileText, Bell, BarChart, Save, RotateCcw, ChevronLeft } from 'lucide-react';
import { cn } from "@/lib/utils";
import UserAccessSettings from './components/UserAccessSettings';
import EvaluationSettings from './components/EvaluationSettings';
import ChangePasswordForm from './components/ChangePasswordForm';
import { settingsService } from '@/lib/services/settings';
import api from '@/lib/axios';
import { handleError } from '@/lib/utils/error-handler';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const navigate = useNavigate();
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
    visionStatement: '',
    missionStatement: '',
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
        visionStatement: settings.visionStatement || '',
        missionStatement: settings.missionStatement || '',
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
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Settings</h1>
                <p className="text-white/80 mt-2">Manage your store and application preferences</p>
              </div>
              <Button 
                variant="secondary" 
                className="bg-white/10 hover:bg-white/20 text-white border-0 h-12 px-6"
                onClick={() => navigate('/')}
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-xl text-sm">
            {success}
          </div>
        )}

        <Tabs defaultValue="general" className="space-y-6">
          <div className="bg-white rounded-[20px] shadow-md p-4">
            <TabsList className="w-full border-b justify-start gap-2 overflow-x-auto flex-nowrap pb-1">
              <TabsTrigger value="general" className="flex items-center gap-2 data-[state=active]:text-[#E51636] data-[state=active]:border-[#E51636] whitespace-nowrap min-w-fit">
                <SettingsIcon className="h-4 w-4" />
                <span>General</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:text-[#E51636] data-[state=active]:border-[#E51636] whitespace-nowrap min-w-fit">
                <Users className="h-4 w-4" />
                <span>User Access</span>
              </TabsTrigger>
              <TabsTrigger value="evaluations" className="flex items-center gap-2 data-[state=active]:text-[#E51636] data-[state=active]:border-[#E51636] whitespace-nowrap min-w-fit">
                <FileText className="h-4 w-4" />
                <span>Evaluations</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:text-[#E51636] data-[state=active]:border-[#E51636] whitespace-nowrap min-w-fit">
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:text-[#E51636] data-[state=active]:border-[#E51636] whitespace-nowrap min-w-fit">
                <BarChart className="h-4 w-4" />
                <span>Reports</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="space-y-6 mt-0">
            <form onSubmit={handleSaveGeneral}>
              <Card className="bg-white rounded-[20px] shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg text-[#27251F]">Store Information</CardTitle>
                  <CardDescription className="text-[#27251F]/60">
                    Contact your administrator to update store information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#27251F]/60">Store Name</label>
                      <p className="text-[#27251F] font-medium">{settings?.storeName || 'Calhoun FSU'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#27251F]/60">Store Number</label>
                      <p className="text-[#27251F] font-medium">{settings?.storeNumber || '00727'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#27251F]/60">Location</label>
                    <p className="text-[#27251F] font-medium">{settings?.location || 'Calhoun G'}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#27251F]/60">Store Address</label>
                    <p className="text-[#27251F] font-medium">{settings?.storeAddress || ''}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#27251F]/60">Store Phone</label>
                      <p className="text-[#27251F] font-medium">{settings?.storePhone || ''}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#27251F]/60">Store Email</label>
                      <p className="text-[#27251F] font-medium">{settings?.storeEmail || ''}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#27251F]/60">Vision Statement</label>
                      <textarea
                        value={formState.visionStatement}
                        onChange={(e) => handleSettingChange('visionStatement', e.target.value)}
                        placeholder="Enter your store's vision statement"
                        className="w-full h-32 px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#E51636] focus:border-transparent resize-none"
                      />
                    </div>
                    <div className="space-y-2 mt-4">
                      <label className="text-sm font-medium text-[#27251F]/60">Mission Statement</label>
                      <textarea
                        value={formState.missionStatement}
                        onChange={(e) => handleSettingChange('missionStatement', e.target.value)}
                        placeholder="Enter your store's mission statement"
                        className="w-full h-32 px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#E51636] focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-[#E51636] text-white hover:bg-[#E51636]/90 h-12 px-6 rounded-2xl flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>

            <Card className="bg-white rounded-[20px] shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-[#27251F]">Appearance</CardTitle>
                <CardDescription className="text-[#27251F]/60">Customize how the application looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label htmlFor="darkMode" className="text-sm font-medium text-[#27251F]">Dark Mode</label>
                    <p className="text-sm text-[#27251F]/60">Enable dark mode for the application</p>
                  </div>
                  <Switch
                    id="darkMode"
                    checked={formState.darkMode}
                    onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label htmlFor="compactMode" className="text-sm font-medium text-[#27251F]">Compact Mode</label>
                    <p className="text-sm text-[#27251F]/60">Make the interface more compact</p>
                  </div>
                  <Switch
                    id="compactMode"
                    checked={formState.compactMode}
                    onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-[20px] shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-[#27251F]">Security</CardTitle>
                <CardDescription className="text-[#27251F]/60">Update your security settings</CardDescription>
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
            <Card className="bg-white rounded-[20px] shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-[#27251F]">Notification Preferences</CardTitle>
                <CardDescription className="text-[#27251F]/60">Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Notification settings content */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="bg-white rounded-[20px] shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-[#27251F]">Report Settings</CardTitle>
                <CardDescription className="text-[#27251F]/60">Configure your reporting preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Report settings content */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;