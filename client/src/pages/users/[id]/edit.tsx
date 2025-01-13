import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/axios';
import { Toaster } from '@/components/ui/toaster';

interface UserFormData {
  name: string;
  email: string;
  department: string;
  position: string;
  role: string;
  status: string;
  manager?: string;
}

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    department: '',
    position: '',
    role: '',
    status: 'active',
    manager: ''
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch user data
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await api.get(`/api/users/${id}`);
      console.log('User data from API:', response.data);  // Debug log
      return response.data;  // The server already sends the user object directly
    }
  });

  // Fetch potential managers
  const { data: managers } = useQuery({
    queryKey: ['potential-managers', user?.store?._id],
    queryFn: async () => {
      try {
        if (!user?.store?._id) {
          return [];
        }
        const response = await api.get('/api/users', {
          params: {
            store: user.store._id,
            excludeId: id
          }
        });
        return response.data.users.filter((manager: any) => manager._id !== id) || [];
      } catch (error) {
        console.error('Error fetching potential managers:', error);
        return [];
      }
    },
    enabled: !!user?.store?._id
  });

  // Update form data when user data is loaded
  useEffect(() => {
    if (user) {
      console.log('Setting form data with user:', user);
      
      // Transform department to match select options
      const transformDepartment = (dept: string) => {
        if (!dept) return '';
        console.log('Transforming department:', dept);
        // Handle both uppercase and regular case
        const deptMap: { [key: string]: string } = {
          'LEADERSHIP': 'LEADERSHIP',
          'FOH': 'FOH',
          'BOH': 'BOH',
          'Leadership': 'LEADERSHIP',
          'Front of House': 'FOH',
          'Back of House': 'BOH'
        };
        return deptMap[dept] || dept;
      };

      // Transform position to match select options
      const transformPosition = (pos: string) => {
        if (!pos) return '';
        console.log('Original position:', pos);
        // Keep original case since SelectItem values match server values
        return pos;
      };

      // Transform role to match select options
      const transformRole = (role: string) => {
        if (!role) return '';
        console.log('Original role:', role);
        // Handle both uppercase and regular case
        const roleMap: { [key: string]: string } = {
          'ADMIN': 'ADMIN',
          'EVALUATOR': 'EVALUATOR',
          'USER': 'USER',
          'admin': 'ADMIN',
          'evaluator': 'EVALUATOR',
          'user': 'USER'
        };
        return roleMap[role] || role.toUpperCase();
      };

      const transformedData = {
        name: user.name || '',
        email: user.email || '',
        department: transformDepartment(user.department),
        position: transformPosition(user.position),
        role: transformRole(user.role),
        status: user.status || 'active',
        manager: user.manager?._id || 'none'
      };
      
      console.log('Final transformed form data:', transformedData);
      setFormData(transformedData);
    }
  }, [user]);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      try {
        setError(null);
        console.log('Original mutation data:', data);
        
        // Transform data to match server expectations
        const transformedData = {
          ...data,
          manager: data.manager === 'none' ? null : data.manager,
          // Keep the case as is since we're now handling it in the form
          role: data.role,
          department: data.department
        };

        console.log('Transformed mutation data:', transformedData);
        const response = await api.put(`/api/users/${id}`, transformedData);
        console.log('Server response:', response.data);
        return response.data;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error in mutation:', {
          error,
          formData: data,
          errorMessage
        });
        throw error;
      }
    },
    onSuccess: () => {
      setError(null);
      console.log('Update successful');
      toast({
        title: "✅ Success",
        description: "User has been updated successfully",
        duration: 5000,
      });
      // Navigate after a short delay to allow the toast to be seen
      setTimeout(() => {
        navigate('/users');
      }, 1000);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error occurred';
      setError(errorMessage);
      console.error('Mutation error:', {
        error,
        message: errorMessage,
        response: error.response?.data
      });
      
      toast({
        title: "❌ Update Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    updateUserMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            Loading user data...
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
            <div className="flex-shrink-0">
              ❌
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit User</h1>
          <p className="text-gray-500">Update user information and permissions</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/users')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
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

            {/* Role & Position Section */}
            <div className="space-y-4 pt-4 border-t">
              <h2 className="text-lg font-semibold text-gray-700">Role & Position</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Department</label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LEADERSHIP">Leadership</SelectItem>
                      <SelectItem value="FOH">Front of House</SelectItem>
                      <SelectItem value="BOH">Back of House</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Position</label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => setFormData({ ...formData, position: value })}
                  >
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Director">Director</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Shift Leader">Shift Leader</SelectItem>
                      <SelectItem value="Team Leader">Team Leader</SelectItem>
                      <SelectItem value="Trainer">Trainer</SelectItem>
                      <SelectItem value="Team Member">Team Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Access & Status Section */}
            <div className="space-y-4 pt-4 border-t">
              <h2 className="text-lg font-semibold text-gray-700">Access & Status</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">System Role</label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="EVALUATOR">Evaluator</SelectItem>
                      <SelectItem value="USER">User</SelectItem>
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

            {/* Manager Assignment Section */}
            <div className="space-y-4 pt-4 border-t">
              <h2 className="text-lg font-semibold text-gray-700">Manager Assignment</h2>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Reports To</label>
                <p className="text-sm text-gray-500 mb-2">Only Team Leaders and above can be assigned as managers</p>
                <Select
                  value={formData.manager}
                  onValueChange={(value) => setFormData({ ...formData, manager: value })}
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Manager</SelectItem>
                    {managers?.filter((manager: { position?: string; _id: string; name: string }) => {
                      const position = manager.position?.toLowerCase() || '';
                      return position.includes('team leader') || 
                             position.includes('shift leader') || 
                             position.includes('manager') || 
                             position.includes('director');
                    }).map((manager: any) => (
                      <SelectItem key={manager._id} value={manager._id}>
                        {manager.name} ({manager.position})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/users')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-6"
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