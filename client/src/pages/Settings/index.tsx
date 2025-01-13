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
import { useToast } from "@/components/ui/use-toast";
import { settingsService } from '@/lib/services/settings';
import { cn } from "@/lib/utils";
import UserAccessSettings from './components/UserAccessSettings';
import EvaluationSettings from './components/EvaluationSettings';
import { handleError } from '@/lib/utils/error-handler';
import ChangePasswordForm from './components/ChangePasswordForm';

const SettingsPage = () => {
  const { toast } = useToast();
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
    mutationFn: settingsService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  const updateStoreInfoMutation = useMutation({
    mutationFn: settingsService.updateStoreInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeInfo'] });
    }
  });

  // Reset settings mutation
  const resetSettingsMutation = useMutation({
    mutationFn: settingsService.resetSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "✓ Settings Reset",
        description: "Settings have been reset to defaults.",
        duration: 5000,
      });
    },
    onError: () => {
      toast({
        title: "✕ Reset Failed",
        description: "Failed to reset settings. Please try again.",
        duration: 5000,
      });
    }
  });

  const handleSaveGeneral = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      // Update store info if admin
      if (isAdmin) {
        await updateStoreInfoMutation.mutateAsync({
          name: formState.storeName,
          storeNumber: formState.storeNumber,
          storeAddress: formState.storeAddress,
          storePhone: formState.storePhone,
          storeEmail: formState.storeEmail
        });
      }

      // Update general settings
      await updateSettingsMutation.mutateAsync({
        darkMode: formState.darkMode,
        compactMode: formState.compactMode,
        storeName: formState.storeName,
        storeNumber: formState.storeNumber,
        storeAddress: formState.storeAddress,
        storePhone: formState.storePhone,
        storeEmail: formState.storeEmail
      });

      toast({
        title: "✓ Settings Saved",
        description: "Your changes have been saved successfully.",
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "✕ Error Saving Settings",
        description: "There was a problem saving your changes. Please try again.",
        duration: 5000,
      });
    }
  };

  const handleToggleSetting = (section: string, setting: string, value: boolean) => {
    updateSettingsMutation.mutate({
      [section]: {
        [setting]: value
      }
    });
  };

  if (isSettingsLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-600">Manage your store settings and preferences</p>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            onClick={() => resetSettingsMutation.mutate()}
            disabled={resetSettingsMutation.isPending}
            className={cn(
              "w-full sm:w-auto",
              "hover:bg-destructive hover:text-destructive-foreground",
              "border-destructive text-destructive",
              "transition-colors duration-200"
            )}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {resetSettingsMutation.isPending ? 'Resetting...' : 'Reset to Defaults'}
          </Button>
        )}
      </div>

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
          <UserAccessSettings />
        </TabsContent>

        <TabsContent value="evaluations">
          <EvaluationSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor="emailNotifications" className="text-sm font-medium">Email Notifications</label>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings?.emailNotifications || false}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor="pushNotifications" className="text-sm font-medium">Push Notifications</label>
                  <p className="text-sm text-gray-500">Receive push notifications in your browser</p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={settings?.pushNotifications || false}
                  onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Report Settings</CardTitle>
              <CardDescription>Configure your report preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor="autoExport" className="text-sm font-medium">Automatic Export</label>
                  <p className="text-sm text-gray-500">Automatically export reports on schedule</p>
                </div>
                <Switch
                  id="autoExport"
                  checked={settings?.autoExport || false}
                  onCheckedChange={(checked) => handleSettingChange('autoExport', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor="includeCharts" className="text-sm font-medium">Include Charts</label>
                  <p className="text-sm text-gray-500">Include visual charts in reports</p>
                </div>
                <Switch
                  id="includeCharts"
                  checked={settings?.includeCharts || false}
                  onCheckedChange={(checked) => handleSettingChange('includeCharts', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;