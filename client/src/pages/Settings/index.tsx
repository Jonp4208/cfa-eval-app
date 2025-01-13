// File: src/pages/Settings/index.tsx
import React from 'react';
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

  // Fetch settings and store info
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings
  });

  const { data: storeInfo, isLoading: isStoreLoading } = useQuery({
    queryKey: ['storeInfo'],
    queryFn: settingsService.getStoreInfo
  });

  // Update mutations
  const updateSettingsMutation = useMutation({
    mutationFn: settingsService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Settings updated",
        description: "Your changes have been saved successfully.",
        duration: 5000,
      });
    },
    onError: (error) => {
      handleError(error);
    }
  });

  const updateStoreInfoMutation = useMutation({
    mutationFn: settingsService.updateStoreInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeInfo'] });
      toast({
        title: "Store information updated",
        description: "Store details have been saved successfully.",
        duration: 5000,
      });
    },
    onError: (error) => {
      handleError(error);
    }
  });

  // Reset settings mutation
  const resetSettingsMutation = useMutation({
    mutationFn: settingsService.resetSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Settings reset",
        description: "Settings have been reset to defaults."
      });
    }
  });

  const handleSaveGeneral = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (isAdmin) {
      updateStoreInfoMutation.mutate({
        name: formData.get('storeName')?.toString(),
        storeNumber: formData.get('storeNumber')?.toString(),
        location: formData.get('location')?.toString()
      });
    }

    updateSettingsMutation.mutate({
      general: {
        darkMode: formData.get('darkMode') === 'on'
      }
    });
  };

  const handleToggleSetting = (section: string, setting: string, value: boolean) => {
    updateSettingsMutation.mutate({
      [section]: {
        [setting]: value
      }
    });
  };

  if (isSettingsLoading || isStoreLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
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
        <div className="overflow-x-auto -mx-4 px-4">
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

        <TabsContent value="general">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>Manage your store details and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveGeneral} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Store Name</label>
                      <Input 
                        name="storeName"
                        defaultValue={storeInfo?.name}
                        placeholder="Enter store name"
                        disabled={!isAdmin}
                        className={cn(
                          "h-10 rounded-lg",
                          !isAdmin ? "bg-gray-100" : ""
                        )}
                      />
                      {!isAdmin && (
                        <p className="text-sm text-gray-500">Only administrators can change store name</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Store Number</label>
                      <Input 
                        name="storeNumber"
                        defaultValue={storeInfo?.storeNumber}
                        placeholder="Enter store number"
                        disabled={!isAdmin}
                        className={cn(
                          "h-10 rounded-lg",
                          !isAdmin ? "bg-gray-100" : ""
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <Input 
                        name="location"
                        defaultValue={storeInfo?.location}
                        placeholder="Enter store location"
                        disabled={!isAdmin}
                        className={cn(
                          "h-10 rounded-lg",
                          !isAdmin ? "bg-gray-100" : ""
                        )}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 gap-4">
                      <div>
                        <label className="text-sm font-medium">Dark Mode</label>
                        <p className="text-sm text-gray-500">Switch between light and dark themes</p>
                      </div>
                      <Switch 
                        name="darkMode"
                        checked={settings?.general.darkMode}
                        onCheckedChange={(checked) => 
                          handleToggleSetting('general', 'darkMode', checked)
                        }
                        className={cn(
                          "data-[state=checked]:bg-red-600",
                          "data-[state=unchecked]:bg-slate-200",
                          "rounded-full w-12 h-7",
                          "shadow-sm"
                        )}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                    disabled={updateSettingsMutation.isPending || updateStoreInfoMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <ChangePasswordForm />
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UserAccessSettings 
            settings={settings} 
            onUpdate={(section: string, value: boolean) => handleToggleSetting('userAccess', section, value)}
            isUpdating={updateSettingsMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="evaluations">
          <EvaluationSettings 
            settings={settings} 
            onUpdate={(section: string, value: boolean) => handleToggleSetting('evaluations', section, value)}
            isUpdating={updateSettingsMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage your notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Email Notifications</label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch 
                    checked={settings?.notifications?.emailEnabled}
                    onCheckedChange={(checked) => 
                      handleToggleSetting('notifications', 'emailEnabled', checked)
                    }
                    className={cn(
                      "data-[state=checked]:bg-red-600",
                      "data-[state=unchecked]:bg-slate-200",
                      "rounded-full w-12 h-7",
                      "shadow-sm"
                    )}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">New Evaluation Alerts</label>
                    <p className="text-sm text-gray-500">Get notified when new evaluations are assigned</p>
                  </div>
                  <Switch 
                    checked={settings?.notifications?.newEvaluationAlerts}
                    onCheckedChange={(checked) => 
                      handleToggleSetting('notifications', 'newEvaluationAlerts', checked)
                    }
                    className={cn(
                      "data-[state=checked]:bg-red-600",
                      "data-[state=unchecked]:bg-slate-200",
                      "rounded-full w-12 h-7",
                      "shadow-sm"
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports Settings</CardTitle>
              <CardDescription>Configure report generation and display preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Report settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;