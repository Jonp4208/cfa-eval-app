// client/src/pages/Analytics/HeartsAndHands.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Users, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AnalyticsPageHeader } from '.';
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
      !member.position.toLowerCase().includes('director') &&
      !member.position.toLowerCase().includes('manager') &&
      (activeDepartment === 'all' || member.department.toLowerCase() === activeDepartment.toLowerCase()) &&
      (member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position.toLowerCase().includes(searchTerm.toLowerCase()))
    ))
    .reduce((acc: Record<string, TeamMember[]>, member: TeamMember) => {
      if (!member.metrics?.heartsAndHands) return acc;
      const { x, y } = member.metrics.heartsAndHands;
      const key = `${x}-${y}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(member);
      return acc;
    }, {});

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Hearts & Hands Analysis</h1>
                <p className="text-white/80 mt-2 text-lg">Team Development Matrix</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#E51636]" />
                  <input
                    type="text"
                    placeholder="Search team members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white text-[#27251F] placeholder:text-[#27251F]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 w-full sm:w-[200px] h-12 border-0"
                  />
                </div>
                
                {/* Department Tabs */}
                <div className="flex flex-wrap rounded-xl overflow-hidden bg-white">
                  <button
                    className={`flex-1 sm:flex-none px-4 py-2 h-12 transition-colors ${
                      activeDepartment === 'all' 
                        ? 'bg-[#E51636] text-white font-medium' 
                        : 'text-[#27251F] hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveDepartment('all')}
                    disabled={isLoading}
                  >
                    All
                  </button>
                  <button
                    className={`flex-1 sm:flex-none px-4 py-2 h-12 transition-colors ${
                      activeDepartment === 'foh' 
                        ? 'bg-[#E51636] text-white font-medium' 
                        : 'text-[#27251F] hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveDepartment('foh')}
                    disabled={isLoading}
                  >
                    Front of House
                  </button>
                  <button
                    className={`flex-1 sm:flex-none px-4 py-2 h-12 transition-colors ${
                      activeDepartment === 'boh' 
                        ? 'bg-[#E51636] text-white font-medium' 
                        : 'text-[#27251F] hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveDepartment('boh')}
                    disabled={isLoading}
                  >
                    Back of House
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card className="bg-white rounded-[20px] shadow-md hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
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
              <div className="p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-8 w-8 text-gray-400" />
                  <p className="text-gray-500">No team members found</p>
                  {searchTerm && (
                    <p className="text-sm text-gray-400">
                      Try adjusting your search or filters
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="relative w-full max-w-[567px] aspect-square">
                  {/* Quadrant Grid */}
                  <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
                    {/* Top Left Quadrant */}
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-tl-lg border border-gray-200 flex items-center justify-center">
                      <div className="text-[10px] sm:text-sm font-medium text-[#27251F]/80 rotate-[-45deg]">High Potential</div>
                    </div>
                    {/* Top Right Quadrant */}
                    <div className="bg-gradient-to-bl from-green-50 to-green-100 rounded-tr-lg border border-gray-200 flex items-center justify-center">
                      <div className="text-[10px] sm:text-sm font-medium text-[#27251F]/80 rotate-45">Star Performers</div>
                    </div>
                    {/* Bottom Left Quadrant */}
                    <div className="bg-gradient-to-tr from-red-50 to-red-100 rounded-bl-lg border border-gray-200 flex items-center justify-center">
                      <div className="text-[10px] sm:text-sm font-medium text-[#27251F]/80 rotate-45">Needs Development</div>
                    </div>
                    {/* Bottom Right Quadrant */}
                    <div className="bg-gradient-to-tl from-yellow-50 to-yellow-100 rounded-br-lg border border-gray-200 flex items-center justify-center">
                      <div className="text-[10px] sm:text-sm font-medium text-[#27251F]/80 rotate-[-45deg]">Skill Masters</div>
                    </div>

                    {/* Axis Labels */}
                    <div className="absolute inset-x-0 -top-8 flex justify-center">
                      <div className="text-[10px] sm:text-sm font-medium text-[#27251F]/60">
                        Engagement & Commitment
                      </div>
                    </div>
                    <div className="absolute -right-12 sm:-right-16 inset-y-0 flex items-center">
                      <div className="text-[10px] sm:text-sm font-medium text-[#27251F]/60 rotate-90">
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
                                  className="w-6 h-6 sm:w-8 sm:h-8 bg-[#E51636] rounded-full absolute flex items-center justify-center cursor-pointer hover:bg-[#DD0031] transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
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
                              <TooltipContent side="top" className="bg-white border shadow-lg rounded-xl p-3">
                                <p className="font-medium text-[#27251F]">{member.name}</p>
                                <p className="text-xs text-[#27251F]/60">{member.position}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HeartsAndHands;