// client/src/pages/Analytics/HeartsAndHands.tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {  AlertCircle, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TeamMember {
  id: string;
  name: string;
  position: string;
  department: string;
  metrics?: {
    heartsAndHands?: {
      x: number;
      y: number;
    };
  };
  email: string;
  role: string;
}

const HeartsAndHands = () => {
  const [activeDepartment, setActiveDepartment] = useState('foh');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch team members
  const { data: teamMembers = [], isLoading, error } = useQuery({
    queryKey: ['team-members', activeDepartment],
    queryFn: async () => {
      try {
        const response = await api.get('/api/users', {
          params: { 
            ...(activeDepartment !== 'all' && { department: activeDepartment.toLowerCase() }),
            role: 'user',
            store: user?.store?._id
          }
        });
        
        if (!response.data?.users) {
          throw new Error('Invalid response structure');
        }

        return response.data.users.map((user: any) => ({
          id: user._id,
          name: user.name || 'Unknown',
          position: user.position || 'Team Member',
          department: user.department || activeDepartment,
          metrics: user.metrics,
          email: user.email,
          role: user.role
        }));
      } catch (error) {
        throw new Error('Failed to fetch team members. Please try again later.');
      }
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 30000
  });

  // Filter team members based on search and exclude directors
  const filteredMembers: Record<string, TeamMember[]> = teamMembers
    .filter((member: TeamMember) => (
      // Exclude directors and above
      !member.position.toLowerCase().includes('director') &&
      !member.position.toLowerCase().includes('manager') &&
      // Match active department or show all
      (activeDepartment === 'all' || member.department.toLowerCase() === activeDepartment.toLowerCase()) &&
      // Apply search filter
      (member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position.toLowerCase().includes(searchTerm.toLowerCase()))
    ))
    // Group members by their position on the grid
    .reduce((acc: Record<string, TeamMember[]>, member: TeamMember) => {
      if (!member.metrics?.heartsAndHands) return acc;
      const { x, y } = member.metrics.heartsAndHands;
      const key = `${x}-${y}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(member);
      return acc;
    }, {});

  return (
    <div className="pt-8">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
          <h1 className="text-2xl font-semibold">Hearts & Hands Analysis</h1>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 w-full sm:w-auto"
            />
            
            {/* Department Tabs */}
            <div className="flex flex-wrap rounded-xl border overflow-hidden">
              <button
                className={`flex-1 sm:flex-none px-4 py-2 transition-colors ${
                  activeDepartment === 'all' 
                    ? 'bg-red-600 text-white font-medium' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setActiveDepartment('all')}
                disabled={isLoading}
              >
                All
              </button>
              <button
                className={`flex-1 sm:flex-none px-4 py-2 transition-colors ${
                  activeDepartment === 'foh' 
                    ? 'bg-red-600 text-white font-medium' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setActiveDepartment('foh')}
                disabled={isLoading}
              >
                Front of House
              </button>
              <button
                className={`flex-1 sm:flex-none px-4 py-2 transition-colors ${
                  activeDepartment === 'boh' 
                    ? 'bg-red-600 text-white font-medium' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setActiveDepartment('boh')}
                disabled={isLoading}
              >
                Back of House
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load team members. Please try again later.</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-[600px] bg-gray-100 rounded-xl"></div>
          </div>
        ) : !teamMembers.length ? (
          // Empty state
          <Card className="rounded-xl">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <Users className="h-8 w-8 text-gray-400" />
                <p className="text-gray-500">No team members found</p>
                {searchTerm && (
                  <p className="text-sm text-gray-400">
                    Try adjusting your search or filters
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-xl">
            <CardContent className="py-6">
              <div className="flex justify-center">
                <div className="relative w-full max-w-[567px] aspect-square">
                  {/* Quadrant Grid */}
                  <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
                    {/* Top Left Quadrant */}
                    <div className="bg-yellow-100 rounded-tl-lg border border-gray-200 flex items-center justify-center">
                      <div className="text-[10px] sm:text-sm font-medium text-gray-600 rotate-[-45deg]">High Potential</div>
                    </div>
                    {/* Top Right Quadrant */}
                    <div className="bg-green-100 rounded-tr-lg border border-gray-200 flex items-center justify-center">
                      <div className="text-[10px] sm:text-sm font-medium text-gray-600 rotate-45">Star Performers</div>
                    </div>
                    {/* Bottom Left Quadrant */}
                    <div className="bg-red-100 rounded-bl-lg border border-gray-200 flex items-center justify-center">
                      <div className="text-[10px] sm:text-sm font-medium text-gray-600 rotate-45">Needs Development</div>
                    </div>
                    {/* Bottom Right Quadrant */}
                    <div className="bg-yellow-100 rounded-br-lg border border-gray-200 flex items-center justify-center">
                      <div className="text-[10px] sm:text-sm font-medium text-gray-600 rotate-[-45deg]">Skill Masters</div>
                    </div>

                    {/* Axis Labels */}
                    <div className="absolute inset-x-0 -top-8 flex justify-center">
                      <div className="text-[10px] sm:text-sm text-gray-600">
                        Engagement & Commitment
                      </div>
                    </div>
                    <div className="absolute -right-12 sm:-right-16 inset-y-0 flex items-center">
                      <div className="text-[10px] sm:text-sm text-gray-600 rotate-90">
                        Skills & Abilities
                      </div>
                    </div>

                    {/* Team Member Markers */}
                    {Object.entries(filteredMembers).map(([_, members]: [string, TeamMember[]]) => 
                      members.map((member: TeamMember, index: number) => {
                        if (!member.metrics?.heartsAndHands) return null;
                        const { x, y } = member.metrics.heartsAndHands;
                        const initials = member.name.split(' ').map(n => n[0]).join('');
                        
                        // Calculate offset for overlapping members
                        const offset = members.length > 1 ? (index - (members.length - 1) / 2) * 20 : 0;
                        
                        return (
                          <TooltipProvider key={member.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className="w-6 h-6 sm:w-8 sm:h-8 bg-red-600 rounded-full absolute flex items-center justify-center cursor-pointer hover:bg-red-700 transition-colors"
                                  style={{
                                    left: `${x}%`,
                                    top: `${100 - y}%`,
                                    transform: `translate(calc(-50% + ${offset}px), -50%)`,
                                    zIndex: members.length > 1 ? index + 1 : 'auto'
                                  }}
                                  onClick={() => navigate(`/users/${member.id}`)}
                                >
                                  <span className="text-[10px] sm:text-xs font-medium text-white">
                                    {initials}
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-white border shadow-md rounded-lg p-2">
                                <p className="font-medium text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.position}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HeartsAndHands;