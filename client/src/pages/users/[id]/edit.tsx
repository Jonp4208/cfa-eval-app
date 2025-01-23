import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/axios';
import { Toaster } from '@/components/ui/toaster';
import { MultiSelect } from "@/components/ui/multi-select";
import { Switch } from "@/components/ui/switch";

interface UserFormData {
  name: string;
  email: string;
  departments: string[];
  position: string;
  status: string;
  isAdmin: boolean;
  role: string;
  shift: string;
  manager?: string;
  schedulingPreferences?: {
    autoSchedule: boolean;
    frequency: number;
    cycleStart: 'hire_date' | 'last_evaluation';
  };
}

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    departments: [],
    position: '',
    status: 'active',
    isAdmin: false,
    role: 'user',
    shift: 'day'
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch user data
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await api.get(`/api/users/${id}`);
      return response.data;
    }
  });

  // Update form data when user data is loaded
  useEffect(() => {
    if (user) {
      const transformedData: UserFormData = {
        name: user.name || '',
        email: user.email || '',
        departments: user.departments || [],
        position: user.position || '',
        status: user.status || 'active',
        isAdmin: user.position === 'Director',
        role: user.role || 'user',
        shift: user.shift || 'day',
        manager: user.manager?._id || user.manager,
        schedulingPreferences: {
          autoSchedule: user.schedulingPreferences?.autoSchedule || false,
          frequency: user.schedulingPreferences?.frequency || 90,
          cycleStart: user.schedulingPreferences?.cycleStart || 'hire_date'
        }
      };
      setFormData(transformedData);
    }
  }, [user]);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      try {
        setError(null);
        // Transform the data to match server expectations
        const transformedData = {
          name: data.name,
          email: data.email,
          departments: data.departments,
          position: data.position,
          role: data.role,
          status: data.status,
          shift: data.shift,
          manager: data.manager,
          schedulingPreferences: data.schedulingPreferences ? {
            autoSchedule: data.schedulingPreferences.autoSchedule,
            frequency: Number(data.schedulingPreferences.frequency),
            cycleStart: data.schedulingPreferences.cycleStart
          } : undefined
        };
        
        console.log('Sending data to server:', transformedData);
        const response = await api.put(`/api/users/${id}`, transformedData);
        return response.data;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error occurred';
        setError(errorMessage);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "✅ Success",
        description: "Team member has been updated successfully",
        duration: 5000,
      });
      setTimeout(() => navigate('/users'), 1000);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "❌ Update Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate(formData);
  };

  // Add frequency options
  const frequencyOptions = [
    { value: 30, label: 'Monthly (30 days)' },
    { value: 60, label: 'Bi-Monthly (60 days)' },
    { value: 90, label: 'Quarterly (90 days)' },
    { value: 180, label: 'Semi-Annually (180 days)' },
    { value: 365, label: 'Annually (365 days)' }
  ];

  // Handle scheduling preference changes
  const handleSchedulingChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      schedulingPreferences: {
        ...prev.schedulingPreferences,
        [field]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
        <Card className="bg-white rounded-[20px] shadow-md">
          <CardContent className="p-6">
            Loading team member data...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Edit Team Member</h1>
                <p className="text-white/80 mt-2 text-lg">Update team member information and settings</p>
              </div>
              <Button
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white border-0 h-12 px-6"
                onClick={() => navigate('/users')}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Team Members
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Card className="bg-white rounded-[20px] shadow-md border-l-4 border-[#E51636]">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-[#E51636]">
                <span>❌</span>
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white rounded-[20px] shadow-md">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-[#27251F]">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#27251F]">Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...prev, name: e.target.value })}
                      required
                      className="border-gray-200"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#27251F]">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...prev, email: e.target.value })}
                      required
                      className="border-gray-200"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
              </div>

              {/* Departments & Position Section */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-[#27251F]">Departments & Position</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#27251F]">Departments</label>
                    <MultiSelect
                      options={[
                        { value: 'Front Counter', label: 'Front Counter' },
                        { value: 'Drive Thru', label: 'Drive Thru' },
                        { value: 'Kitchen', label: 'Kitchen' }
                      ]}
                      selected={formData.departments}
                      onChange={(value) => setFormData({ ...prev, departments: value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#27251F]">Position</label>
                    <Select
                      value={formData.position}
                      onValueChange={(value: string) => {
                        setFormData({ 
                          ...prev, 
                          position: value,
                          isAdmin: value === 'Director'
                        });
                      }}
                    >
                      <SelectTrigger className="border-gray-200">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Team Member">Team Member</SelectItem>
                        <SelectItem value="Trainer">Trainer</SelectItem>
                        <SelectItem value="Leader">Leader</SelectItem>
                        <SelectItem value="Director">Director</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#27251F]">Shift</label>
                    <Select
                      value={formData.shift}
                      onValueChange={(value: string) => setFormData({ ...prev, shift: value })}
                    >
                      <SelectTrigger className="border-gray-200">
                        <SelectValue placeholder="Select shift" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="night">Night</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Role & Status Section */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-[#27251F]">Role & Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#27251F]">Role</label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...prev, role: value })}
                    >
                      <SelectTrigger className="border-gray-200">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#27251F]">Account Status</label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...prev, status: value })}
                    >
                      <SelectTrigger className="border-gray-200">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Auto-Scheduling Section */}
              {formData.schedulingPreferences && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h2 className="text-xl font-semibold text-[#27251F]">Auto-Scheduling Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-[#27251F]">Enable Auto-Scheduling</label>
                        <p className="text-sm text-[#27251F]/60">Automatically schedule evaluations for this team member</p>
                      </div>
                      <Switch
                        checked={formData.schedulingPreferences.autoSchedule}
                        onCheckedChange={(checked) => handleSchedulingChange('autoSchedule', checked)}
                      />
                    </div>

                    {formData.schedulingPreferences.autoSchedule && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[#27251F]">Evaluation Frequency</label>
                          <Select
                            value={formData.schedulingPreferences.frequency.toString()}
                            onValueChange={(value) => handleSchedulingChange('frequency', parseInt(value))}
                          >
                            <SelectTrigger className="border-gray-200">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              {frequencyOptions.map(option => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[#27251F]">Cycle Start Reference</label>
                          <Select
                            value={formData.schedulingPreferences.cycleStart}
                            onValueChange={(value: 'hire_date' | 'last_evaluation') => 
                              handleSchedulingChange('cycleStart', value)
                            }
                          >
                            <SelectTrigger className="border-gray-200">
                              <SelectValue placeholder="Select cycle start" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hire_date">Hire Date</SelectItem>
                              <SelectItem value="last_evaluation">Last Evaluation</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/users')}
                  className="border-[#E51636] text-[#E51636] hover:bg-[#E51636]/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#E51636] text-white hover:bg-[#E51636]/90"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  );
} 