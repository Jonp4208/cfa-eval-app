// client/src/pages/Dashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ClipboardList, 
  Users, 
  FileText, 
  Calendar, 
  AlertCircle, 
  TrendingUp, 
  ChevronRight,
  Clock,
  Target,
  Award
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import TeamMemberDashboard from './TeamMemberDashboard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Progress } from '@/components/ui/progress';
import api from '../lib/axios';
import { useNotification } from '@/contexts/NotificationContext';
import PageHeader from '@/components/PageHeader';

interface DashboardStats {
  pendingEvaluations: number;
  completedEvaluations: number;
  totalEmployees: number;
  activeTemplates: number;
  completedReviewsLast30Days: number;
  openDisciplinaryIncidents: number;
  resolvedDisciplinaryThisMonth: number;
  upcomingEvaluations: Array<{
    _id: string;
    employeeName: string;
    scheduledDate: string;
    templateName: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    date: string;
  }>;
  disciplinary?: {
    active: number;
    followUps: number;
    recent: Array<{
      id: string;
      name: string;
      type: string;
      severity: string;
      date: string;
    }>;
    last30Days: number;
  };
  team?: {
    inTraining: number;
    performance: {
      foh: number;
      boh: number;
    };
    newHiresLast30Days: number;
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  console.log('Dashboard - user details:', {
    name: user?.name,
    position: user?.position,
    role: user?.role
  });
  
  // Show Team Member dashboard for Team Members and Trainers
  // Show Manager dashboard for Leaders and Directors
  if (user?.position === 'Team Member' || user?.position === 'Trainer') {
    return <TeamMemberDashboard />;
  }

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await api.get('/api/dashboard/stats');
      return response.data;
    }
  });

  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['performanceTrends'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/performance-trends');
      return response.data.performanceTrends;
    }
  });

  if (statsLoading || performanceLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E51636]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <PageHeader
          title={`Welcome back, ${user?.name}`}
          subtitle={`CFA Store #${user?.store?.storeNumber}`}
          showBackButton={false}
          actions={
            <>
              <button
                onClick={() => navigate('/evaluations/new')}
                className="w-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 py-2 md:py-2.5 px-3 md:px-4 rounded-[6px] md:rounded-[8px] transition-colors"
              >
                <ClipboardList className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base font-medium">New Evaluation</span>
              </button>
              <button
                onClick={() => navigate('/disciplinary/new')}
                className="w-full bg-white hover:bg-gray-50 text-[#E51636] flex items-center justify-center gap-2 py-2 md:py-2.5 px-3 md:px-4 rounded-[6px] md:rounded-[8px] transition-colors"
              >
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base font-medium">New Incident</span>
              </button>
            </>
          }
        />

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card 
            className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            onClick={() => navigate('/evaluations')}
          >
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#27251F]/60 font-medium">Pending Reviews</p>
                  <h3 className="text-3xl font-bold mt-2 text-[#27251F]">{stats?.pendingEvaluations || 0}</h3>
                  <p className="text-[#27251F]/60 mt-1">
                    {stats?.completedReviewsLast30Days || 0} completed in 30 days
                  </p>
                </div>
                <div className="h-14 w-14 bg-[#E51636]/10 rounded-2xl flex items-center justify-center">
                  <ClipboardList className="h-7 w-7 text-[#E51636]" />
                </div>
              </div>
              <div className="mt-6">
                <Progress 
                  value={stats?.completedReviewsLast30Days ? (stats.completedReviewsLast30Days / (stats.completedReviewsLast30Days + stats.pendingEvaluations)) * 100 : 0} 
                  className="h-2 bg-[#E51636]/10" 
                />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            onClick={() => navigate('/disciplinary')}
          >
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#27251F]/60 font-medium">Open Incidents</p>
                  <h3 className="text-3xl font-bold mt-2 text-[#27251F]">{stats?.openDisciplinaryIncidents || 0}</h3>
                  <p className="text-[#27251F]/60 mt-1">
                    {stats?.resolvedDisciplinaryThisMonth || 0} resolved this month
                  </p>
                </div>
                <div className="h-14 w-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="h-7 w-7 text-orange-600" />
                </div>
              </div>
              <div className="mt-6">
                <Progress 
                  value={stats?.resolvedDisciplinaryThisMonth ? (stats.resolvedDisciplinaryThisMonth / (stats.resolvedDisciplinaryThisMonth + stats.openDisciplinaryIncidents)) * 100 : 0} 
                  className="h-2 bg-orange-100" 
                />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            onClick={() => navigate('/users')}
          >
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#27251F]/60 font-medium">Team Size</p>
                  <h3 className="text-3xl font-bold mt-2 text-[#27251F]">{stats?.totalEmployees || 0}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex -space-x-2">
                      {[1,2,3].map((i) => (
                        <div key={i} className="h-6 w-6 rounded-full bg-[#E51636]/10 border-2 border-white flex items-center justify-center">
                          <Users className="h-3 w-3 text-[#E51636]" />
                        </div>
                      ))}
                    </div>
                    <p className="text-[#27251F]/60">+{(stats?.totalEmployees || 0) - 3} more</p>
                  </div>
                </div>
                <div className="h-14 w-14 bg-[#E51636]/10 rounded-2xl flex items-center justify-center">
                  <Users className="h-7 w-7 text-[#E51636]" />
                </div>
              </div>
              <div className="mt-6">
                <Progress 
                  value={stats?.team?.inTraining ? (stats.team.inTraining / stats.totalEmployees) * 100 : 0} 
                  className="h-2 bg-[#E51636]/10" 
                />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            onClick={() => navigate('/analytics')}
          >
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#27251F]/60 font-medium">Overall Performance</p>
                  <h3 className="text-3xl font-bold mt-2 text-[#27251F]">
                    {stats?.team?.performance ? 
                      Math.round((stats.team.performance.foh + stats.team.performance.boh) / 2) : 0}%
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <p className="text-sm font-medium">+2.5% from last month</p>
                  </div>
                </div>
                <div className="h-14 w-14 bg-green-100 rounded-2xl flex items-center justify-center">
                  <Award className="h-7 w-7 text-green-600" />
                </div>
              </div>
              <div className="mt-6">
                <Progress 
                  value={stats?.team?.performance ? 
                    (stats.team.performance.foh + stats.team.performance.boh) / 2 : 0} 
                  className="h-2 bg-green-100" 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Lists Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Chart */}
          <Card className="bg-white rounded-[20px] lg:col-span-2 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between p-8">
              <div>
                <CardTitle className="text-xl font-bold text-[#27251F]">Performance Trends</CardTitle>
                <p className="text-[#27251F]/60 mt-1">FOH vs BOH performance over time</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#E51636]" />
                  <span className="text-sm text-[#27251F]/60">FOH</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#DD0031]" />
                  <span className="text-sm text-[#27251F]/60">BOH</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="FOHGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E51636" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#E51636" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="BOHGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DD0031" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#DD0031" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#27251F"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#27251F" 
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border">
                              <p className="font-medium text-[#27251F] mb-2">{label}</p>
                              {payload.map((entry: any, index: number) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div 
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-[#27251F]">
                                    {entry.name}: {entry.value === null ? 'No data' : `${entry.value}%`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="FOH" 
                      name="Front of House"
                      stroke="#E51636" 
                      fillOpacity={1}
                      fill="url(#FOHGradient)"
                      strokeWidth={2}
                      connectNulls={false}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="BOH" 
                      name="Back of House"
                      stroke="#DD0031" 
                      fillOpacity={1}
                      fill="url(#BOHGradient)"
                      strokeWidth={2}
                      connectNulls={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-bold text-[#27251F]">Quick Actions</CardTitle>
              <p className="text-[#27251F]/60 mt-1">Frequently used actions</p>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-4">
                {[
                  { icon: Clock, label: 'Schedule Evaluation', path: '/evaluations/new', color: 'text-blue-600 bg-blue-100' },
                  { icon: Target, label: 'Set Team Goals', path: '/goals', color: 'text-purple-600 bg-purple-100' },
                  { icon: Users, label: 'View Team', path: '/users', color: 'text-[#E51636] bg-[#E51636]/10' },
                  { icon: FileText, label: 'Training Materials', path: '/future', color: 'text-green-600 bg-green-100' },
                ].map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => navigate(action.path)}
                      className="w-full p-4 rounded-xl bg-[#F4F4F4] hover:bg-[#F4F4F4]/80 transition-colors flex items-center gap-4"
                    >
                      <div className={`h-10 w-10 rounded-lg ${action.color} flex items-center justify-center`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-[#27251F]">{action.label}</span>
                      <ChevronRight className="h-5 w-5 text-[#27251F]/40 ml-auto" />
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lists Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evaluations Section */}
          <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between p-8">
              <div>
                <CardTitle className="text-xl font-bold text-[#27251F]">Upcoming Evaluations</CardTitle>
                <p className="text-[#27251F]/60 mt-1">Next 7 days</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/evaluations')}>
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-4">
                {stats?.upcomingEvaluations?.map((evaluation) => (
                  <div 
                    key={evaluation._id} 
                    className="p-4 bg-[#F4F4F4] rounded-xl hover:bg-[#F4F4F4]/80 transition-colors cursor-pointer"
                    onClick={() => navigate(`/evaluations/${evaluation._id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#E51636]/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-[#E51636]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#27251F]">{evaluation.employeeName}</p>
                          <p className="text-sm text-[#27251F]/60 mt-1">
                            {evaluation.templateName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-[#27251F]">
                          {new Date(evaluation.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {!stats?.upcomingEvaluations?.length && (
                  <div className="text-center py-6">
                    <p className="text-[#27251F]/60">No upcoming evaluations</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Incidents Section */}
          <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between p-8">
              <div>
                <CardTitle className="text-xl font-bold text-[#27251F]">Recent Incidents</CardTitle>
                <p className="text-[#27251F]/60 mt-1">Last 7 days</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/disciplinary')}>
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-4">
                {stats?.disciplinary?.recent?.map((incident) => (
                  <div 
                    key={incident.id} 
                    className="p-4 bg-[#F4F4F4] rounded-xl hover:bg-[#F4F4F4]/80 transition-colors cursor-pointer"
                    onClick={() => navigate(`/disciplinary/${incident.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-[#27251F]">{incident.name}</p>
                          <p className="text-sm text-[#27251F]/60 mt-1">{incident.type}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        incident.severity === 'Minor' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {incident.severity}
                      </span>
                    </div>
                  </div>
                ))}
                {!stats?.disciplinary?.recent?.length && (
                  <div className="text-center py-6">
                    <p className="text-[#27251F]/60">No active incidents</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}