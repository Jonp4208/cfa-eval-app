// client/src/pages/users/components/AddUserDialog.tsx
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
    role: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open && user) {
      setFormData({
        name: user.name,
        email: user.email,
        department: user.department,
        position: user.position,
        role: user.role
      });
    } else if (!open) {
      setFormData({
        name: '',
        email: '',
        department: '',
        position: '',
        role: ''
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
      if (user) {
        // Update existing user
        await api.put(`/api/users/${user._id}`, formData);
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        // Create new user
        await api.post('/api/users', formData);
        toast({
          title: "Success",
          description: "User created successfully",
        });
      }

      // Refresh users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: user ? "Failed to update user" : "Failed to create user",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
          <DialogDescription>
            {user 
              ? 'Edit the team member\'s information below.' 
              : 'Add a new team member to your organization.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">Name</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="grid gap-2">
              <label htmlFor="department" className="text-sm font-medium text-gray-700">Department</label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger id="department" className="bg-white border-gray-200 text-gray-900">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOH">Front of House</SelectItem>
                  <SelectItem value="BOH">Back of House</SelectItem>
                  <SelectItem value="Leadership">Leadership</SelectItem>
                </SelectContent>
              </Select>
              {errors.department && <p className="text-sm text-red-500">{errors.department}</p>}
            </div>

            <div className="grid gap-2">
              <label htmlFor="position" className="text-sm font-medium text-gray-700">Position</label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
              >
                <SelectTrigger id="position" className="bg-white border-gray-200 text-gray-900">
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
              {errors.position && <p className="text-sm text-red-500">{errors.position}</p>}
            </div>

            <div className="grid gap-2">
              <label htmlFor="role" className="text-sm font-medium text-gray-700">Role</label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger id="role" className="bg-white border-gray-200 text-gray-900">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="evaluator">Evaluator</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
              {user ? 'Save Changes' : 'Add Team Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}