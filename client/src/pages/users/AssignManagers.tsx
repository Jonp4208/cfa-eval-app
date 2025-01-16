import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Users, Check } from 'lucide-react';
import api from '@/lib/axios';

interface User {
  _id: string;
  name: string;
  position: string;
  departments: string[];
  manager?: {
    _id: string;
    name: string;
  };
}

export default function AssignManagers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Fetch all users
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/api/users');
      return response.data.users;
    }
  });

  // Get managers (users with role 'evaluator' or 'admin')
  const managers = users?.filter((user: User) => 
    ['Store Director', 'Kitchen Director', 'Service Director', 'Store Leader', 'Training Leader', 'Shift Leader'].includes(user.position)
  ) || [];

  // Get team members (excluding managers)
  const teamMembers = users?.filter((user: User) => 
    !['Store Director', 'Kitchen Director', 'Service Director', 'Store Leader', 'Training Leader', 'Shift Leader'].includes(user.position)
  ) || [];

  // Get unique departments
  const departments = React.useMemo(() => {
    if (!users) return ['all'];
    const depts = [...new Set(users.flatMap((user: User) => user.departments))];
    return ['all', ...depts.sort()];
  }, [users]);

  // Filter team members by search and department
  const filteredTeamMembers = React.useMemo(() => {
    return teamMembers.filter((member: User) => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = selectedDepartment === 'all' || member.departments.includes(selectedDepartment);
      return matchesSearch && matchesDepartment;
    });
  }, [teamMembers, searchQuery, selectedDepartment]);

  // Group team members by department
  const groupedTeamMembers = React.useMemo(() => {
    const groups: { [key: string]: User[] } = {};
    filteredTeamMembers.forEach((member: User) => {
      member.departments.forEach(dept => {
        if (!groups[dept]) {
          groups[dept] = [];
        }
        if (!groups[dept].find(m => m._id === member._id)) {
          groups[dept].push(member);
        }
      });
    });
    return groups;
  }, [filteredTeamMembers]);

  // Mutation to update user's manager
  const updateManager = useMutation({
    mutationFn: async ({ userId, managerId }: { userId: string, managerId: string }) => {
      const response = await api.patch(`/api/users/${userId}`, {
        manager: managerId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'Manager assignment updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update manager assignment',
        variant: 'destructive',
      });
    }
  });

  return (
    <div className="max-w-6xl mx-auto pt-8">
      <Card>
        <CardHeader>
          <CardTitle>Assign Team Members to Managers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search team members..."
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <select
                className="px-4 py-2.5 border rounded-lg bg-gray-50 hover:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-300 cursor-pointer transition-colors min-w-[200px]"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                {(departments as string[]).map((dept: string) => (
                  <option key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Members List */}
            <div className="space-y-8">
              {loadingUsers ? (
                <div className="text-center py-8 text-gray-500">Loading users...</div>
              ) : (
                Object.entries(groupedTeamMembers).map(([department, members]) => (
                  <div key={department} className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {department}
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {members.map((member: User) => (
                        <div
                          key={member._id}
                          className="p-4 border rounded-xl flex items-center gap-4"
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{member.name}</h4>
                            <p className="text-sm text-gray-500">{member.position}</p>
                          </div>
                          <select
                            className="px-4 py-2 border rounded-lg bg-gray-50 hover:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-300 cursor-pointer transition-colors"
                            value={member.manager?._id || ''}
                            onChange={(e) => updateManager.mutate({
                              userId: member._id,
                              managerId: e.target.value
                            })}
                          >
                            <option value="">Select Manager</option>
                            {managers.map((manager: User) => (
                              <option key={manager._id} value={manager._id}>
                                {manager.name} ({manager.position})
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 