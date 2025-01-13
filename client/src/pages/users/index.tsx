// client/src/pages/users/index.tsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Plus, Search, Upload, Download, Edit, Mail, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import api from '@/lib/axios';
import AddUserDialog from './components/AddUserDialog';
import { useAuth } from '@/contexts/AuthContext';

interface UserType {
  _id: string;
  name: string;
  email: string;
  position?: string;
  department?: string;
  role: 'user' | 'evaluator' | 'manager' | 'admin';
  status?: string;
  store?: {
    _id: string;
    name: string;
    storeNumber: string;
  };
  manager?: {
    _id: string;
    name: string;
  };
}

export default function Users() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'position' | 'department' | 'role' | 'manager'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'FOH' | 'BOH' | 'Leadership' | 'myTeam'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEmailResetDialog, setShowEmailResetDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/api/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowDeleteDialog(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/api/users/${userId}/reset-password`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password reset instructions sent successfully",
      });
      setShowEmailResetDialog(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send password reset instructions",
        variant: "destructive"
      });
    }
  });

  // Fetch users with role-based filtering
  const { data, isLoading, error } = useQuery<{ users: UserType[] }>({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        // If no user is logged in
        if (!currentUser) {
          return { users: [] };
        }

        // For regular users and evaluators, redirect to their dashboard
        if (currentUser.role === 'user' || currentUser.role === 'evaluator') {
          navigate('/dashboard');
          return { users: [] };
        }

        // For managers, only fetch their team members
        if (currentUser.role === 'manager') {
          const response = await api.get('/api/users', {
            params: { managerId: currentUser._id }
          });
          console.log('Fetched users:', response.data); // Debug log
          return response.data;
        }

        // For admins, fetch all users
        const response = await api.get('/api/users');
        console.log('Fetched users:', response.data); // Debug log
        return response.data;
      } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
    },
    enabled: !!currentUser
  });

  if (error) {
    console.error('Error fetching users:', error);
    return (
      <Card>
        <CardContent className="py-4 text-center text-red-500">
          Error loading users. Please try again later.
        </CardContent>
      </Card>
    );
  }

  const users = data?.users?.filter(user => user && typeof user === 'object');
  
  // Filter users based on search query and filter selection
  const filteredUsers = users?.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.position?.toLowerCase().includes(searchLower) ||
      user.department?.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );

    // Apply department/manager filter
    const matchesFilter = filterBy === 'all' ? true :
      filterBy === 'myTeam' ? user.manager?._id === currentUser?._id :
      user.department === filterBy;

    return matchesSearch && matchesFilter;
  });

  // Sort users based on selected field
  const sortedUsers = [...(filteredUsers || [])].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'position':
        return (a.position || '').localeCompare(b.position || '');
      case 'department':
        return (a.department || '').localeCompare(b.department || '');
      case 'role':
        return a.role.localeCompare(b.role);
      case 'manager':
        const managerA = a.manager?.name || '';
        const managerB = b.manager?.name || '';
        return managerA.localeCompare(managerB);
      default:
        return 0;
    }
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/api/users/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: "Success",
        description: "Users uploaded successfully",
      });

      // Refresh users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      console.error('Error uploading users:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to upload users",
        variant: "destructive"
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    // CSV header and example rows with comments
    const csvContent = [
      'name,email,department,position,role,store',
      '# Department options: foh (Front of House), boh (Back of House), leadership',
      '# Position options: team-member, trainer, team-leader, shift-leader, manager, director',
      '# Role options: user, evaluator, admin',
      '# Store format: Store #{store_number}',
      '',
      'John Doe,john@example.com,foh,team-member,user,Store #1234',
      'Jane Smith,jane@example.com,boh,trainer,evaluator,Store #1234',
      'Mike Johnson,mike@example.com,leadership,manager,admin,Store #1234'
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-gray-500">
            {currentUser?.role === 'manager' 
              ? 'Manage your team members and their evaluations'
              : 'Manage your organization\'s team members'}
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleDownloadTemplate}
              className="text-gray-500 hover:text-gray-700 w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-red-200 hover:border-red-300 w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Team Member
            </Button>
          </div>
        )}
        {currentUser?.role === 'manager' && (
          <div className="flex justify-center sm:justify-start">
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Team Member
            </Button>
          </div>
        )}
      </div>

      {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 sm:gap-4">
            <Select
              value={filterBy}
              onValueChange={(value) => setFilterBy(value as 'all' | 'FOH' | 'BOH' | 'Leadership' | 'myTeam')}
            >
              <SelectTrigger className="w-full sm:w-[200px] rounded-full">
                <SelectValue placeholder="Filter by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Show All</SelectItem>
                <SelectItem value="FOH">FOH Only</SelectItem>
                <SelectItem value="BOH">BOH Only</SelectItem>
                <SelectItem value="Leadership">Leadership Only</SelectItem>
                {currentUser?.role === 'manager' && (
                  <SelectItem value="myTeam">My Team Only</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as 'name' | 'position' | 'department' | 'role' | 'manager')}
            >
              <SelectTrigger className="w-full sm:w-[200px] rounded-full">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="position">Sort by Position</SelectItem>
                <SelectItem value="department">Sort by Department</SelectItem>
                <SelectItem value="role">Sort by Role</SelectItem>
                <SelectItem value="manager">Sort by Reports To</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-4">
              Loading team members...
            </CardContent>
          </Card>
        ) : !sortedUsers || sortedUsers.length === 0 ? (
          <Card>
            <CardContent className="py-4 text-center text-gray-500">
              {searchQuery ? 'No team members found matching your search' : 'No team members found'}
            </CardContent>
          </Card>
        ) : (
          sortedUsers.map((user: UserType) => {
            if (!user || !user.name) {
              console.warn('Invalid user data:', user);
              return null;
            }

            const canManageUser = 
              currentUser?.role === 'admin' || 
              (currentUser?.role === 'manager' && user.manager?._id === currentUser._id);

            return (
              <Card
                key={user._id}
                className={`${canManageUser ? 'cursor-pointer hover:border-red-200' : ''} transition-colors`}
                onClick={(e) => {
                  // Only navigate if clicking the card itself, not the action buttons
                  const isButton = (e.target as HTMLElement).closest('button');
                  if (!isButton && canManageUser) {
                    navigate(`/users/${user._id}`);
                  }
                }}
              >
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                          {user.position && <span>{user.position}</span>}
                          {user.department && (
                            <>
                              <span>•</span>
                              <span>{user.department}</span>
                            </>
                          )}
                          {user.manager && (
                            <>
                              <span>•</span>
                              <span>Reports to {user.manager.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row justify-between sm:justify-end items-center gap-4 mt-2 sm:mt-0">
                      <div className="text-sm">
                        <div className={`px-2 py-1 rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'manager'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role.toUpperCase()}
                        </div>
                      </div>
                      {canManageUser && (
                        <div className="flex items-center gap-1 sm:gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/users/${user._id}/edit`);
                                  }}
                                >
                                  <Edit className="w-4 h-4 text-gray-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit User</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUser(user);
                                    setShowEmailResetDialog(true);
                                  }}
                                >
                                  <Mail className="w-4 h-4 text-gray-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Reset Password</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUser(user);
                                    setShowDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete User</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
        <AddUserDialog 
          open={showAddDialog} 
          onOpenChange={setShowAddDialog}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedUser?.name}'s account and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser._id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Confirmation Dialog */}
      <AlertDialog open={showEmailResetDialog} onOpenChange={setShowEmailResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send password reset instructions to {selectedUser?.name}'s email address.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && resetPasswordMutation.mutate(selectedUser._id)}
            >
              Send Instructions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}