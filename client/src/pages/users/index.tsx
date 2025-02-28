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
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { User, Plus, Search, Upload, Download, Edit, Mail, Trash2, Shield } from 'lucide-react';
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
import PageHeader from '@/components/PageHeader';

interface UserType {
  _id: string;
  name: string;
  email: string;
  position: string;
  departments: string[];
  role: 'user' | 'admin';
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
  shift?: 'day' | 'night';
}

// Helper function to check if user can manage users
const canManageUsers = (user: any) => {
  return user?.role === 'admin' || user?.position === 'Director' || user?.position === 'Leader';
};

export default function Users() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'position' | 'department' | 'role' | 'manager'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'FOH' | 'BOH' | 'myTeam'>('all');
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

        // For regular users, only show their own user data
        if (currentUser.position?.toLowerCase() !== 'director' && !currentUser.position?.toLowerCase().includes('leader')) {
          const response = await api.get(`/api/users/${currentUser._id}`);
          return { users: [response.data] };
        }

        // For leaders and directors, fetch all users
        const response = await api.get('/api/users');
        console.log('Fetched users:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
    },
    enabled: !!currentUser
  });

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
        <Card className="bg-white rounded-[20px] shadow-md">
          <CardContent className="p-6 text-center text-[#E51636]">
            Error loading users. Please try again later.
          </CardContent>
        </Card>
      </div>
    );
  }

  const users = data?.users?.filter(user => user && typeof user === 'object');
  console.log('Initial users:', users);
  
  // Filter users based on search query and filter selection
  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by department or my team
    let matchesFilter = true;
    if (filterBy !== 'all') {
      if (filterBy === 'myTeam') {
        matchesFilter = user.manager?._id === currentUser?._id;
      } else if (filterBy === 'FOH' || filterBy === 'BOH') {
        matchesFilter = user.departments?.includes(filterBy);
      }
    }

    // Only show users from the same store as the current user
    const sameStore = user.store?._id === currentUser?.store?._id;
    
    console.log('Filtering user:', {
      name: user.name,
      position: user.position,
      matchesSearch,
      matchesFilter,
      sameStore,
      currentStore: currentUser?.store?._id,
      userStore: user.store?._id
    });

    return matchesSearch && matchesFilter && sameStore;
  });
  
  console.log('Filtered users:', filteredUsers);

  // Sort users based on selected field
  const sortedUsers = [...(filteredUsers || [])].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'department') {
      return (a.departments?.[0] || '').localeCompare(b.departments?.[0] || '');
    }
    return 0;
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

  // Update currentUser check
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Team Management"
          subtitle="Manage your team members and their roles"
          actions={
            <div className="flex flex-col max-[430px]:w-full sm:flex-row gap-4">
              <button
                onClick={() => navigate('/users/assign-managers')}
                className="w-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 py-2 md:py-2.5 px-3 md:px-4 rounded-[6px] md:rounded-[8px] transition-colors"
              >
                <User className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base font-medium">Assign Managers</span>
              </button>
              <button
                onClick={() => setShowAddDialog(true)}
                className="w-full bg-white hover:bg-gray-50 text-[#E51636] flex items-center justify-center gap-2 py-2 md:py-2.5 px-3 md:px-4 rounded-[6px] md:rounded-[8px] transition-colors"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base font-medium">Add User</span>
              </button>
            </div>
          }
        />

        {/* Filters Section */}
        <Card className="bg-white rounded-[20px] shadow-md">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,auto] gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#27251F]/40 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={filterBy} onValueChange={(value: 'all' | 'FOH' | 'BOH' | 'myTeam') => setFilterBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>View</SelectLabel>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="myTeam">My Team</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Department</SelectLabel>
                    <SelectItem value="FOH">Front of House</SelectItem>
                    <SelectItem value="BOH">Back of House</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200 hover:border-gray-300">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="position">Position</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Import/Export Section */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-200">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                className="hidden"
              />
              <Button
                variant="outline"
                className="h-12 px-6 rounded-xl w-full sm:w-auto"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-5 h-5 mr-2" />
                Import Users
              </Button>
              <Button
                variant="outline"
                className="h-12 px-6 rounded-xl w-full sm:w-auto"
                onClick={handleDownloadTemplate}
              >
                <Download className="w-5 h-5 mr-2" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            // Loading skeleton
            [...Array(3)].map((_, i) => (
              <Card key={i} className="bg-white rounded-[20px] shadow-md animate-pulse">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="h-6 w-48 bg-gray-200 rounded-md" />
                      <div className="h-4 w-32 bg-gray-200 rounded-md" />
                    </div>
                    <div className="h-10 w-24 bg-gray-200 rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : sortedUsers?.length === 0 ? (
            // Empty state
            <Card className="bg-white rounded-[20px] shadow-md">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 bg-[#E51636]/10 rounded-full flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-[#E51636]" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2 text-[#27251F]">No Users Found</h2>
                  <p className="text-[#27251F]/60 mb-6">No users match your current filters.</p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    Add New User
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // User cards
            sortedUsers?.map((user) => (
              <Card
                key={user._id}
                className="bg-white rounded-[20px] shadow-md hover:shadow-xl transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start justify-between">
                    <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-full bg-[#E51636]/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-[#E51636]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-[#27251F]">{user.name}</h3>
                          {user.role === 'admin' && (
                            <div className="text-[#E51636]">
                              <Shield className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-[#27251F]/60 mt-1">{user.email}</p>
                        <div className="flex items-center gap-4 mt-2">
                          {user.position && (
                            <span className="text-sm text-[#27251F]/60">{user.position}</span>
                          )}
                          {user.shift && (
                            <>
                              <span className="text-sm text-[#27251F]/60">•</span>
                              <span className="text-sm text-[#27251F]/60">{user.shift === 'day' ? 'Day' : 'Night'}</span>
                            </>
                          )}
                          {user.departments && (
                            <>
                              <span className="text-sm text-[#27251F]/60">•</span>
                              <span className="text-sm text-[#27251F]/60">{user.departments.join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto mt-4 md:mt-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 text-[#27251F]/60 hover:text-[#E51636]"
                              onClick={() => navigate(`/users/${user._id}`)}
                            >
                              <User className="w-5 h-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Profile</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 text-[#27251F]/60 hover:text-[#E51636]"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowEmailResetDialog(true);
                              }}
                            >
                              <Mail className="w-5 h-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Send Password Reset</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 text-[#27251F]/60 hover:text-[#E51636]"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowAddDialog(true);
                              }}
                            >
                              <Edit className="w-5 h-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit User</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 text-[#27251F]/60 hover:text-[#E51636]"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete User</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add User Dialog */}
      <AddUserDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setSelectedUser(null);
        }}
        user={selectedUser}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white rounded-[20px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 px-6 rounded-xl">Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              className="h-12 px-6 rounded-xl"
              onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser._id)}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Confirmation Dialog */}
      <AlertDialog open={showEmailResetDialog} onOpenChange={setShowEmailResetDialog}>
        <AlertDialogContent className="bg-white rounded-[20px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Send Password Reset</AlertDialogTitle>
            <AlertDialogDescription>
              Send password reset instructions to {selectedUser?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 px-6 rounded-xl">Cancel</AlertDialogCancel>
            <Button
              className="bg-[#E51636] hover:bg-[#E51636]/90 text-white h-12 px-6 rounded-xl"
              onClick={() => selectedUser && resetPasswordMutation.mutate(selectedUser._id)}
            >
              {resetPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}