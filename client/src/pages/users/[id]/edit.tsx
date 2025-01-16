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

interface UserFormData {
  name: string;
  email: string;
  departments: string[];
  position: string;
  status: string;
  isAdmin: boolean;
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
    isAdmin: false
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
        isAdmin: ['Store Director', 'Kitchen Director', 'Service Director', 'Store Leader'].includes(user.position || '')
      };
      setFormData(transformedData);
    }
  }, [user]);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      try {
        setError(null);
        const response = await api.put(`/api/users/${id}`, data);
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
                    value={formData.departments}
                    onValueChange={(value: string[]) => setFormData({ ...formData, departments: value })}
                  >
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder="Select departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Front Counter">Front Counter</SelectItem>
                      <SelectItem value="Drive Thru">Drive Thru</SelectItem>
                      <SelectItem value="Kitchen">Kitchen</SelectItem>
                      <SelectItem value="Everything">Everything</SelectItem>
                    </SelectContent>
                  </MultiSelect>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Position</label>
                  <Select
                    value={formData.position}
                    onValueChange={(value: string) => {
                      setFormData({ 
                        ...formData, 
                        position: value,
                        isAdmin: ['Store Director', 'Kitchen Director', 'Service Director', 'Store Leader'].includes(value)
                      });
                    }}
                  >
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Store Director">Store Director</SelectItem>
                      <SelectItem value="Kitchen Director">Kitchen Director</SelectItem>
                      <SelectItem value="Service Director">Service Director</SelectItem>
                      <SelectItem value="Store Leader">Store Leader</SelectItem>
                      <SelectItem value="Training Leader">Training Leader</SelectItem>
                      <SelectItem value="Shift Leader">Shift Leader</SelectItem>
                      <SelectItem value="Team Leader">Team Leader</SelectItem>
                      <SelectItem value="Trainer">Trainer</SelectItem>
                      <SelectItem value="Team Member">Team Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div className="space-y-4 pt-4 border-t">
              <h2 className="text-lg font-semibold text-gray-700">Status</h2>
              <div>
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