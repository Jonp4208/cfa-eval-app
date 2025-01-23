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
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            Loading team member data...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">❌</div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Team Member</h1>
          <p className="text-gray-500">Update team member information</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/users')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Team Members
        </Button>
      </div>

      <Card className="shadow-md">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="border-gray-200"
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="border-gray-200"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>

            {/* Departments & Position Section */}
            <div className="space-y-4 pt-4 border-t">
              <h2 className="text-lg font-semibold text-gray-700">Departments & Position</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Departments</label>
                  <MultiSelect
                    options={[
                      { value: 'Front Counter', label: 'Front Counter' },
                      { value: 'Drive Thru', label: 'Drive Thru' },
                      { value: 'Kitchen', label: 'Kitchen' }
                    ]}
                    selected={formData.departments}
                    onChange={(value) => setFormData({ ...formData, departments: value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Position</label>
                  <Select
                    value={formData.position}
                    onValueChange={(value: string) => {
                      setFormData({ 
                        ...formData, 
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
                  <label className="text-sm font-medium text-gray-700">Shift</label>
                  <Select
                    value={formData.shift}
                    onValueChange={(value: string) => setFormData({ ...formData, shift: value })}
                  >
                    <SelectTrigger>
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

            {/* Status Section */}
            <div className="space-y-4 pt-4 border-t">
              <h2 className="text-lg font-semibold text-gray-700">Role & Status</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
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
                  <label className="text-sm font-medium text-gray-700">Account Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
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

            {/* Evaluation Scheduling Section */}
            <div className="space-y-4 pt-4 border-t">
              <h2 className="text-lg font-semibold text-gray-700">Evaluation Scheduling</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-gray-700">Auto-schedule Evaluations</label>
                    <p className="text-sm text-gray-500">Automatically schedule evaluations for this team member</p>
                  </div>
                  <Switch
                    checked={formData.schedulingPreferences?.autoSchedule || false}
                    onCheckedChange={(checked) => handleSchedulingChange('autoSchedule', checked)}
                  />
                </div>
                
                {formData.schedulingPreferences?.autoSchedule && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Evaluation Frequency</label>
                      <Select
                        value={String(formData.schedulingPreferences?.frequency || 90)}
                        onValueChange={(value) => handleSchedulingChange('frequency', Number(value))}
                      >
                        <SelectTrigger className="border-gray-200">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencyOptions.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Start Cycle From</label>
                      <Select
                        value={formData.schedulingPreferences?.cycleStart || 'hire_date'}
                        onValueChange={(value) => handleSchedulingChange('cycleStart', value)}
                      >
                        <SelectTrigger className="border-gray-200">
                          <SelectValue placeholder="Select start date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hire_date">Hire Date</SelectItem>
                          <SelectItem value="last_evaluation">Last Evaluation Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">
                        {formData.schedulingPreferences?.cycleStart === 'hire_date' 
                          ? "First evaluation will be scheduled based on hire date, subsequent evaluations will follow the frequency"
                          : "All evaluations will be scheduled based on the last completed evaluation date"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/users')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
} 