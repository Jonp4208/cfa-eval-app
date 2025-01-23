// File: src/pages/Settings/index.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings as SettingsIcon, Users, FileText, Bell, BarChart, Save, RotateCcw, ChevronLeft, Scale, Mail } from 'lucide-react';
import { cn } from "@/lib/utils";
import UserAccessSettings from './components/UserAccessSettings';
import ChangePasswordForm from './components/ChangePasswordForm';
import { settingsService } from '@/lib/services/settings';
import api from '@/lib/axios';
import { handleError } from '@/lib/utils/error-handler';
import { useNavigate } from 'react-router-dom';
import GradingScales from './components/GradingScales';

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
    missionStatement: ''
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
        missionStatement: settings.missionStatement || ''
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
    onSuccess: (data) => {
      // If this was an auto-schedule enable, show scheduling results
      if (data.schedulingResults) {
        setSuccess(`Auto-scheduling enabled successfully. ${data.schedulingResults.scheduled} employees scheduled for evaluation.`);
      } else {
        setSuccess('Settings updated successfully');
      }
      setTimeout(() => setSuccess(''), 3000);
      setError('');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update settings';
      const issues = error.response?.data?.issues || [];
      
      // Update the settings with configuration issues
      if (error.response?.data?.configurationIssues) {
        queryClient.setQueryData(['settings'], (oldData: any) => ({
          ...oldData,
          evaluations: {
            ...oldData.evaluations,
            configurationIssues: error.response.data.configurationIssues
          }
        }));
      }

      console.error('Settings mutation error:', errorMessage, issues);
      setError(errorMessage);
      if (issues.length > 0) {
        setError(`${errorMessage}:\n${issues.join('\n')}`);
      }
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

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-[20px] shadow-sm">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-1">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                {error.split('\n').map((line, index) => (
                  <p key={index} className={index === 0 ? 'font-medium text-base' : 'mt-1 text-sm'}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-[20px] shadow-sm">
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="currentColor"/>
              </svg>
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* Settings Content */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-white rounded-[20px] p-1 h-auto flex flex-wrap gap-2">
            <TabsTrigger value="general" className="data-[state=active]:bg-[#E51636] data-[state=active]:text-white rounded-[14px] h-10">
              General
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="data-[state=active]:bg-[#E51636] data-[state=active]:text-white rounded-[14px] h-10">
                User Access
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="grading-scales" className="data-[state=active]:bg-[#E51636] data-[state=active]:text-white rounded-[14px] h-10">
                Grading Scales
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="general">
            <form onSubmit={handleSaveGeneral}>
              <Card className="bg-white rounded-[20px] shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg text-[#27251F]">Store Information</CardTitle>
                  <CardDescription className="text-[#27251F]/60">View and update your store details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#27251F]/60">Store Name</label>
                    <p className="text-[#27251F] font-medium">{settings?.storeName || ''}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#27251F]/60">Store Number</label>
                    <p className="text-[#27251F] font-medium">{settings?.storeNumber || ''}</p>
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#27251F]/60">Vision Statement</label>
                    <Textarea
                      value={formState.visionStatement}
                      onChange={(e) => handleSettingChange('visionStatement', e.target.value)}
                      className="focus-visible:ring-[#E51636]"
                      rows={3}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#27251F]/60">Mission Statement</label>
                    <Textarea
                      value={formState.missionStatement}
                      onChange={(e) => handleSettingChange('missionStatement', e.target.value)}
                      className="focus-visible:ring-[#E51636]"
                      rows={3}
                      disabled={!isAdmin}
                    />
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
                <CardTitle className="text-lg text-[#27251F]">Security</CardTitle>
                <CardDescription className="text-[#27251F]/60">Update your security settings</CardDescription>
              </CardHeader>
              <CardContent>
                <ChangePasswordForm />
              </CardContent>
            </Card>

            {/* Email Configuration Test */}
            <Card className="bg-white rounded-[20px] shadow-md mt-6">
              <CardHeader>
                <CardTitle className="text-lg text-[#27251F]">Email Configuration</CardTitle>
                <CardDescription className="text-[#27251F]/60">Test email notification settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-[#27251F]/80">
                    Send a test email to verify that your email notifications are working correctly.
                    The test email will be sent to your registered email address.
                  </p>
                  <Button
                    onClick={async () => {
                      try {
                        setError('');
                        setSuccess('');
                        const response = await api.post('/api/test-email');
                        setSuccess('Test email sent successfully! Please check your inbox.');
                      } catch (err: any) {
                        setError(err.response?.data?.message || 'Failed to send test email');
                      }
                    }}
                    className="bg-[#E51636] text-white hover:bg-[#E51636]/90 h-12 px-6 rounded-2xl flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Send Test Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users">
              <UserAccessSettings 
                settings={settings?.userAccess}
                onUpdate={(data) => updateSettingsMutation.mutate({ userAccess: data })}
                isUpdating={updateSettingsMutation.isPending}
              />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="grading-scales">
              <GradingScales />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;