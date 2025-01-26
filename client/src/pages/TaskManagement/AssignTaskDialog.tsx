import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Search } from 'lucide-react';
import { User } from '../../types/user';

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
        // TODO: Replace with actual API call to get users by department and shift
        const response = await fetch(`/api/users?department=${department}&shift=${shift}`);
        const data = await response.json();
        setUsers(data);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <Button
                  key={user._id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    onAssign(user._id);
                    onOpenChange(false);
                  }}
                >
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.position}</div>
                  </div>
                </Button>
              ))}
              {loading && <div className="text-center py-4">Loading...</div>}
              {!loading && filteredUsers.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No team members found
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