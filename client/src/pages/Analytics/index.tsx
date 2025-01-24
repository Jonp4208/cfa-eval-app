// client/src/pages/Analytics/index.tsx
import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Heart, Medal, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

// Page Header Component for Analytics Pages
export const AnalyticsPageHeader = ({ title }: { title: string }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center gap-4 mb-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/analytics')}
        className="hover:bg-red-50 hover:text-red-600 rounded-xl"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <h1 className="text-2xl font-semibold">{title}</h1>
    </div>
  );
};

interface QuickStats {
  teamMembers: number;
  avgPerformance: number;
  developmentGoals: number;
}

const AnalyticsHub = () => {
  const location = useLocation();
  const isMainAnalyticsPage = location.pathname === '/analytics';
  const navigate = useNavigate();

  const { data: quickStats, isLoading } = useQuery<QuickStats>({
    queryKey: ['analytics-quick-stats'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/quick-stats');
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true // Refetch when window regains focus
  });

  const analyticsCards = [
    {
      title: "Hearts & Hands",
      description: "Track team member engagement and skill development matrix",
      icon: Heart,
      link: "hearts-and-hands",
    },
    {
      title: "Team Scores",
      description: "View all team members and their evaluation scores",
      icon: Medal,
      link: "team-scores",
    },
    {
      title: "Day vs Night",
      description: "Compare performance between day and night shifts",
      icon: Sun,
      link: "day-vs-night",
    },
  ];

  if (!isMainAnalyticsPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Analytics</h1>
                <p className="text-white/80 mt-2 text-lg">Team performance and development tracking</p>
              </div>
              <div className="flex gap-4">
                <Button 
                  variant="secondary" 
                  className="bg-white/10 hover:bg-white/20 text-white border-0 h-12 px-6"
                  onClick={() => navigate('/')}
                >
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </Button>
                <Select defaultValue="last30">
                  <SelectTrigger className="w-[180px] bg-white text-[#E51636] hover:bg-white/90 border-0 h-12">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last30">Last 30 Days</SelectItem>
                    <SelectItem value="last60">Last 60 Days</SelectItem>
                    <SelectItem value="last90">Last 90 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              {[1, 2].map((i) => (
                <Card key={i} className="bg-white rounded-[20px] shadow-md hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="h-16 bg-[#F4F4F4] rounded-xl animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : !quickStats ? (
            <Card className="md:col-span-2 bg-white rounded-[20px] shadow-md">
              <CardContent className="p-8 text-center text-[#27251F]/60">
                <p>No analytics data available</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card 
                className="bg-white rounded-[20px] shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                onClick={() => navigate('team-scores')}
              >
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[#27251F]/60 font-medium">Avg Performance</p>
                      <h3 className="text-3xl font-bold mt-2 text-[#27251F]">{quickStats.avgPerformance}%</h3>
                    </div>
                    <div className="h-14 w-14 bg-[#E51636]/10 rounded-2xl flex items-center justify-center">
                      <Medal className="h-7 w-7 text-[#E51636]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-[20px] shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[#27251F]/60 font-medium">Development Goals</p>
                      <h3 className="text-3xl font-bold mt-2 text-[#27251F]">{quickStats.developmentGoals}% ↑</h3>
                    </div>
                    <div className="h-14 w-14 bg-[#E51636]/10 rounded-2xl flex items-center justify-center">
                      <Heart className="h-7 w-7 text-[#E51636]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analyticsCards.map((card) => (
            <Link key={card.link} to={card.link}>
              <Card className="bg-white rounded-[20px] shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer h-full">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-[#27251F]">{card.title}</h3>
                      <p className="mt-2 text-[#27251F]/60 text-sm">{card.description}</p>
                    </div>
                    <div className="h-14 w-14 bg-[#E51636]/10 rounded-2xl flex items-center justify-center">
                      <card.icon className="h-7 w-7 text-[#E51636]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHub;