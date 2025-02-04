// client/src/pages/users/components/AddUserDialog.tsx
import { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import api from '@/lib/axios';
import { MultiSelect } from "@/components/ui/multi-select";

interface User {
  _id: string;
  name: string;
  email: string;
  departments: string[];
  position: string;
  role: string;
  evaluator?: string;
  manager?: {
    _id: string;
    name: string;
  };
  shift?: 'day' | 'night';
  startDate?: Date;
}

interface FormData {
  name: string;
  email: string;
  departments: string[];
  position: string;
  role: string;
  shift: string;
  managerId: string;
  startDate: string;
}

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

export default function AddUserDialog({ open, onOpenChange, user }: AddUserDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    departments: [],
    position: '',
    role: 'user',
    shift: 'day',
    managerId: '',
    startDate: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fetch evaluators
  const { data: evaluators } = useQuery({
    queryKey: ['evaluators'],
    queryFn: async () => {
      const response = await api.get('/api/users', {
        params: { role: 'evaluator' }
      });
      return response.data.users;
    }
  });

  // Fetch potential managers
  const { data: managers } = useQuery({
    queryKey: ['managers'],
    queryFn: async () => {
      const response = await api.get('/api/users', {
        params: { 
          excludeId: user?._id 
        }
      });
      // Filter for users with Director or Leader positions on the client side
      return response.data.users.filter((user: User) => 
        ['Director', 'Leader'].includes(user.position)
      );
    }
  });

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        departments: user.departments || [],
        position: user.position || '',
        role: user.role || 'user',
        shift: user.shift || 'day',
        managerId: user.manager?._id || '',
        startDate: user.startDate ? new Date(user.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else if (open) {
      setFormData({
        name: '',
        email: '',
        departments: [],
        position: '',
        role: 'user',
        shift: 'day',
        managerId: '',
        startDate: new Date().toISOString().split('T')[0]
      });
    }
    setErrors({});
    setStatusMessage(null);
  }, [open, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.position) newErrors.position = 'Position is required';
    if (formData.departments.length === 0) newErrors.departments = 'At least one department is required';
    if (!formData.shift) newErrors.shift = 'Shift is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (user) {
        // Update existing user
        const response = await api.put(`/api/users/${user._id}`, {
          name: formData.name,
          email: formData.email,
          departments: formData.departments,
          position: formData.position,
          role: formData.role,
          shift: formData.shift,
          startDate: formData.startDate
        });

        // Update manager if changed
        if (formData.managerId !== user.manager?._id) {
          await api.patch(`/api/users/${user._id}`, {
            managerId: formData.managerId || null
          });
        }

        setStatusMessage({ type: 'success', text: 'Team member has been updated successfully!' });
      } else {
        // Create new user
        const response = await api.post('/api/users', {
          name: formData.name,
          email: formData.email,
          departments: formData.departments,
          position: formData.position,
          role: formData.role,
          shift: formData.shift,
          startDate: formData.startDate,
          manager: formData.managerId || null
        });

        setStatusMessage({ type: 'success', text: 'Team member has been added successfully!' });
      }

      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Wait a bit to show the success message before closing
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          departments: [],
          position: '',
          role: 'user',
          shift: 'day',
          managerId: '',
          startDate: new Date().toISOString().split('T')[0]
        });
        onOpenChange(false);
      }, 1500);
    } catch (error: any) {
      console.error('Error saving user:', error);
      setStatusMessage({ 
        type: 'error', 
        text: error.response?.data?.message || (user ? "Failed to update team member" : "Failed to create team member")
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#27251F]">{user ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
          <DialogDescription className="text-[#27251F]/60">
            {user 
              ? 'Edit the team member\'s information below.' 
              : 'Add a new team member to your organization.'}
          </DialogDescription>
        </DialogHeader>

        {statusMessage && (
          <div 
            className={`p-4 mb-4 rounded-lg ${
              statusMessage.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium text-[#27251F]">Name</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E51636] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.name && <p className="text-sm text-[#E51636]">{errors.name}</p>}
            </div>

            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium text-[#27251F]">Email</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E51636] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.email && <p className="text-sm text-[#E51636]">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#27251F]">Departments</label>
              <MultiSelect
                options={[
                  { value: 'Front Counter', label: 'Front Counter' },
                  { value: 'Drive Thru', label: 'Drive Thru' },
                  { value: 'Kitchen', label: 'Kitchen' }
                ]}
                selected={formData.departments}
                onChange={(value) => setFormData(prev => ({ ...prev, departments: value }))}
              />
              {errors.departments && <p className="text-sm text-[#E51636]">{errors.departments}</p>}
            </div>

            <div className="grid gap-2">
              <label htmlFor="position" className="text-sm font-medium text-[#27251F]">Position</label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
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
              {errors.position && <p className="text-sm text-[#E51636]">{errors.position}</p>}
            </div>

            <div className="grid gap-2">
              <label htmlFor="shift" className="text-sm font-medium text-[#27251F]">Shift</label>
              <Select
                value={formData.shift}
                onValueChange={(value) => setFormData(prev => ({ ...prev, shift: value }))}
              >
                <SelectTrigger className="border-gray-200">
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
              {errors.shift && <p className="text-sm text-[#E51636]">{errors.shift}</p>}
            </div>

            <div className="grid gap-2">
              <label htmlFor="role" className="text-sm font-medium text-[#27251F]">Role</label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger id="role" className="bg-white border-gray-200 text-[#27251F] focus:ring-[#E51636]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-[#E51636]">{errors.role}</p>}
            </div>

            <div className="grid gap-2">
              <label htmlFor="manager" className="text-sm font-medium text-[#27251F]">Manager</label>
              <Select
                value={formData.managerId || "none"}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  managerId: value === "none" ? "" : value 
                }))}
              >
                <SelectTrigger id="manager" className="bg-white border-gray-200 text-[#27251F] focus:ring-[#E51636]">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  {managers?.map((manager: User) => (
                    <SelectItem key={manager._id} value={manager._id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="startDate" className="text-sm font-medium text-[#27251F]">Start Date</label>
              <input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E51636] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.startDate && <p className="text-sm text-[#E51636]">{errors.startDate}</p>}
            </div>
          </div>

          {user && (
            <div className="flex justify-start py-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.href = `/users/${user._id}/edit`}
                className="border-[#E51636] text-[#E51636] hover:bg-[#E51636]/10"
              >
                Setup Auto-Scheduling ↗
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-[#E51636] text-[#E51636] hover:bg-[#E51636]/10"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-[#E51636] text-white hover:bg-[#E51636]/90"
            >
              {user ? 'Save Changes' : 'Add Team Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}