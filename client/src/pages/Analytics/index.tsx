// client/src/pages/Analytics/index.tsx
import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart3, Users, TrendingUp, GitCompare, Brain, ArrowLeft, Heart, Medal } from 'lucide-react';
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

  const { data: quickStats, isLoading } = useQuery<QuickStats>({
    queryKey: ['analytics-quick-stats'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/quick-stats');
      return response.data;
    }
  });

  const analyticsCards = [
    {
      title: "Department Reports",
      description: "View performance metrics across different departments",
      icon: BarChart3,
      link: "department-report",
    },
    {
      title: "Development Metrics",
      description: "Track team member growth and development progress",
      icon: Brain,
      link: "development-metrics",
    },
    {
      title: "Performance Analytics",
      description: "Analyze individual and team performance trends",
      icon: TrendingUp,
      link: "performance-analytics",
    },
    {
      title: "Team Comparison",
      description: "Compare metrics between different teams and shifts",
      icon: GitCompare,
      link: "team-comparison",
    },
    {
      title: "Team Dynamics",
      description: "Assess team relationships and leadership effectiveness",
      icon: Users,
      link: "team-dynamics",
    },
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
  ];

  if (!isMainAnalyticsPage) {
    return <Outlet />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Analytics Hub</h1>
        <div className="flex gap-4">
          <Select defaultValue="last30">
            <SelectTrigger className="w-[180px] rounded-xl">
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeleton
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-gray-100 rounded-xl"></div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : !quickStats ? (
          // Empty state
          <Card className="md:col-span-3">
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No analytics data available</p>
            </CardContent>
          </Card>
        ) : (
          // Data state
          <>
            <Card className="rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Team Members</p>
                    <p className="text-2xl font-semibold mt-1">{quickStats.teamMembers}</p>
                  </div>
                  <Users className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                    <p className="text-2xl font-semibold mt-1">{quickStats.avgPerformance}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Development Goals</p>
                    <p className="text-2xl font-semibold mt-1">{quickStats.developmentGoals}% ↑</p>
                  </div>
                  <Brain className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyticsCards.map((card) => (
          <Link key={card.link} to={card.link}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsHub;