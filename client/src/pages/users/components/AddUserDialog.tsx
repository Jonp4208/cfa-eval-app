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

interface User {
  _id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  role: string;
  evaluator?: string;
}

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

export default function AddUserDialog({ open, onOpenChange, user }: AddUserDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    position: '',
    role: '',
    evaluator: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open && user) {
      setFormData({
        name: user.name,
        email: user.email,
        department: user.department,
        position: user.position,
        role: user.role,
        evaluator: user.evaluator || ''
      });
    } else if (!open) {
      setFormData({
        name: '',
        email: '',
        department: '',
        position: '',
        role: '',
        evaluator: ''
      });
    }
    setErrors({});
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const validationErrors: Record<string, string> = {};
    if (!formData.name) validationErrors.name = 'Name is required';
    if (!formData.email) validationErrors.email = 'Email is required';
    if (!formData.department) validationErrors.department = 'Department is required';
    if (!formData.position) validationErrors.position = 'Position is required';
    if (!formData.role) validationErrors.role = 'Role is required';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        department: formData.department.toLowerCase(),
        position: formData.position.toLowerCase().replace(/\s+/g, '-'),
        role: formData.role,
        evaluator: formData.evaluator === 'none' ? null : formData.evaluator || null
      };

      console.log('Sending data:', dataToSend);

      if (user) {
        // Update existing user
        await api.put(`/api/users/${user._id}`, dataToSend);
        toast({
          title: "Success",
          description: "User updated successfully",
          duration: 5000,
        });
      } else {
        // Create new user
        await api.post('/api/users', dataToSend);
        toast({
          title: "Success",
          description: "User created successfully. An email with login credentials has been sent.",
          duration: 5000,
        });
      }

      // Refresh users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || (user ? "Failed to update user" : "Failed to create user"),
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#27251F]">{user ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
          <DialogDescription className="text-[#27251F]/60">
            {user 
              ? 'Edit the team member\'s information below.' 
              : 'Add a new team member to your organization.'}
          </DialogDescription>
        </DialogHeader>

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

            <div className="grid gap-2">
              <label htmlFor="department" className="text-sm font-medium text-[#27251F]">Department</label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger id="department" className="bg-white border-gray-200 text-[#27251F] focus:ring-[#E51636]">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOH">Front of House</SelectItem>
                  <SelectItem value="BOH">Back of House</SelectItem>
                  <SelectItem value="Leadership">Leadership</SelectItem>
                  <SelectItem value="Training">Training</SelectItem>
                </SelectContent>
              </Select>
              {errors.department && <p className="text-sm text-[#E51636]">{errors.department}</p>}
            </div>

            <div className="grid gap-2">
              <label htmlFor="position" className="text-sm font-medium text-[#27251F]">Position</label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
              >
                <SelectTrigger id="position" className="bg-white border-gray-200 text-[#27251F] focus:ring-[#E51636]">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Team Member">Team Member</SelectItem>
                  <SelectItem value="Trainer">Trainer</SelectItem>
                  <SelectItem value="Team Leader">Team Leader</SelectItem>
                  <SelectItem value="Shift Leader">Shift Leader</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Director">Director</SelectItem>
                </SelectContent>
              </Select>
              {errors.position && <p className="text-sm text-[#E51636]">{errors.position}</p>}
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
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="store-director">Store Director</SelectItem>
                  <SelectItem value="kitchen-director">Kitchen Director</SelectItem>
                  <SelectItem value="service-director">Service Director</SelectItem>
                  <SelectItem value="store-leader">Store Leader</SelectItem>
                  <SelectItem value="training-leader">Training Leader</SelectItem>
                  <SelectItem value="shift-leader">Shift Leader</SelectItem>
                  <SelectItem value="evaluator">Evaluator</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-[#E51636]">{errors.role}</p>}
            </div>

            <div className="grid gap-2">
              <label htmlFor="evaluator" className="text-sm font-medium text-[#27251F]">Evaluator</label>
              <Select
                value={formData.evaluator || 'none'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, evaluator: value === 'none' ? '' : value }))}
              >
                <SelectTrigger id="evaluator" className="bg-white border-gray-200 text-[#27251F] focus:ring-[#E51636]">
                  <SelectValue placeholder="Select evaluator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Evaluator</SelectItem>
                  {evaluators?.map((evaluator: any) => (
                    <SelectItem key={evaluator._id} value={evaluator._id}>
                      {evaluator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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