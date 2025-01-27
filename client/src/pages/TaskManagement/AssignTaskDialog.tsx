import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Search } from 'lucide-react';
import userService, { User } from '../../services/userService';
import { Loader2, Users } from 'lucide-react';

interface AssignTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (userId: string) => void;
  department: string;
  shift: string;
}

const AssignTaskDialog: React.FC<AssignTaskDialogProps> = ({
  open,
  onOpenChange,
  onAssign,
  department,
  shift
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await userService.getAllUsers();
        // Filter users by department and shift
        const filteredUsers = allUsers.filter(user => 
          user.departments.includes(department) && 
          user.shift === shift
        );
        setUsers(filteredUsers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [open, department, shift]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[425px] h-[90vh] sm:h-auto max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="bg-gradient-to-r from-[#E51636] to-[#DD0031] text-white p-6 relative">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <DialogTitle className="text-lg font-bold">Assign Task</DialogTitle>
            <p className="text-white/80 mt-1 text-sm">Select a team member to assign this task</p>
          </div>
        </DialogHeader>
        <div className="space-y-4 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 border-gray-200 focus:border-[#E51636] focus:ring-[#E51636]"
            />
          </div>
          <ScrollArea className="h-[50vh] sm:h-[300px] pr-4">
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <Button
                  key={user._id}
                  variant="ghost"
                  className="w-full justify-start p-3 sm:p-2 h-auto min-h-[3.5rem] hover:bg-[#E51636]/5"
                  onClick={() => {
                    onAssign(user._id);
                    onOpenChange(false);
                  }}
                >
                  <Avatar className="h-9 w-9 mr-3 flex-shrink-0 border-2 border-[#E51636]/10">
                    <AvatarFallback className="bg-[#E51636]/10 text-[#E51636] font-medium">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-medium truncate">{user.name}</div>
                    <div className="text-sm text-gray-500 truncate">{user.position}</div>
                  </div>
                </Button>
              ))}
              {loading && (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#E51636] mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Loading team members...</p>
                </div>
              )}
              {!loading && filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No team members found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignTaskDialog; 