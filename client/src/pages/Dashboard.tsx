// client/src/pages/Dashboard.tsx
import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { useNotification } from '@/contexts/NotificationContext';
import PageHeader from '@/components/PageHeader';
import { useDashboardStats } from '@/hooks/useDashboardStats';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  progress?: number;
  onClick: () => void;
  className?: string;
}

interface Evaluation {
  _id: string;
  employeeName: string;
  scheduledDate: string;
  templateName: string;
}

interface Incident {
  id: string;
  name: string;
  type: string;
  severity: string;
  date: string;
}

interface DashboardStats {
  pendingEvaluations: number;
  completedEvaluations: number;
  totalEmployees: number;
  activeTemplates: number;
  completedReviewsLast30Days: number;
  openDisciplinaryIncidents: number;
  resolvedDisciplinaryThisMonth: number;
  upcomingEvaluations: Array<Evaluation>;
  disciplinary?: {
    active: number;
    followUps: number;
    recent: Array<Incident>;
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

// Memoized card components for better performance
const StatCard = React.memo<StatCardProps>(({ title, value, subtitle, icon: Icon, color, progress, onClick, className }) => (
  <Card 
    className={className || "bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"}
    onClick={onClick}
  >
    <CardContent className="p-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#27251F]/60 font-medium">{title}</p>
          <h3 className="text-3xl font-bold mt-2 text-[#27251F]">{value}</h3>
          <p className="text-[#27251F]/60 mt-1">{subtitle}</p>
        </div>
        <div className={`h-14 w-14 ${color} rounded-2xl flex items-center justify-center`}>
          <Icon className="h-7 w-7" />
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-6">
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </CardContent>
  </Card>
));

interface PerformanceChartProps {
  data: Array<{
    date: string;
    FOH: number;
    BOH: number;
  }>;
}

const PerformanceChart = React.memo<PerformanceChartProps>(({ data }) => (
  <div className="h-[300px]">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="date" 
          stroke="#27251F"
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <YAxis
          stroke="#27251F"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey="FOH" 
          stroke="#E51636"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="BOH" 
          stroke="#DD0031"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
));

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  // Use our custom hook for all dashboard data and calculations
  const {
    stats,
    chartData,
    upcomingEvaluations,
    recentIncidents,
    performanceMetrics,
    trainingMetrics,
    isLoading
  } = useDashboardStats();
  
  // Explicitly type the stats as DashboardStats
  const typedStats = stats as DashboardStats;
  
  // Show Team Member dashboard for Team Members and Trainers
  if (user?.position === 'Team Member' || user?.position === 'Trainer') {
    return <TeamMemberDashboard />;
  }

  // Memoize navigation handlers
  const handleNavigate = useCallback((path: string) => () => navigate(path), [navigate]);

  if (isLoading) {
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
                onClick={handleNavigate('/evaluations/new')}
                className="w-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 py-2 md:py-2.5 px-3 md:px-4 rounded-[6px] md:rounded-[8px] transition-colors"
              >
                <ClipboardList className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base font-medium">New Evaluation</span>
              </button>
              <button
                onClick={handleNavigate('/disciplinary/new')}
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
          <StatCard
            title="Pending Reviews"
            value={typedStats?.pendingEvaluations || 0}
            subtitle={`${typedStats?.completedReviewsLast30Days || 0} completed in 30 days`}
            icon={ClipboardList}
            color="bg-[#E51636]/10 text-[#E51636]"
            progress={(typedStats?.completedReviewsLast30Days || 0) / ((typedStats?.completedReviewsLast30Days || 0) + (typedStats?.pendingEvaluations || 0)) * 100}
            onClick={handleNavigate('/evaluations')}
          />
          <StatCard
            title="Open Incidents"
            value={typedStats?.openDisciplinaryIncidents || 0}
            subtitle={`${typedStats?.resolvedDisciplinaryThisMonth || 0} resolved this month`}
            icon={AlertCircle}
            color="bg-orange-100 text-orange-600"
            progress={(typedStats?.resolvedDisciplinaryThisMonth || 0) / ((typedStats?.resolvedDisciplinaryThisMonth || 0) + (typedStats?.openDisciplinaryIncidents || 0)) * 100}
            onClick={handleNavigate('/disciplinary')}
          />
          <StatCard
            title="Team Size"
            value={typedStats?.totalEmployees || 0}
            subtitle={`${trainingMetrics.inTraining} in training`}
            icon={Users}
            color="bg-[#E51636]/10 text-[#E51636]"
            progress={trainingMetrics.trainingRate}
            onClick={handleNavigate('/users')}
          />
          <StatCard
            title="Overall Performance"
            value={`${performanceMetrics.average}%`}
            subtitle="+2.5% from last month"
            icon={Award}
            color="bg-green-100 text-green-600"
            progress={performanceMetrics.average}
            onClick={handleNavigate('/analytics')}
          />
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
              <PerformanceChart data={chartData} />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between p-8">
              <CardTitle className="text-xl font-bold text-[#27251F]">Quick Actions</CardTitle>
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
                      onClick={handleNavigate(action.path)}
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
              <Button variant="ghost" size="sm" onClick={handleNavigate('/evaluations')}>
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-4">
                {upcomingEvaluations.map((evaluation: Evaluation) => (
                  <div 
                    key={evaluation._id} 
                    className="p-4 bg-[#F4F4F4] rounded-xl hover:bg-[#F4F4F4]/80 transition-colors cursor-pointer"
                    onClick={handleNavigate(`/evaluations/${evaluation._id}`)}
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
                {!upcomingEvaluations.length && (
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
              <Button variant="ghost" size="sm" onClick={handleNavigate('/disciplinary')}>
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-4">
                {recentIncidents.map((incident: Incident) => (
                  <div 
                    key={incident.id} 
                    className="p-4 bg-[#F4F4F4] rounded-xl hover:bg-[#F4F4F4]/80 transition-colors cursor-pointer"
                    onClick={handleNavigate(`/disciplinary/${incident.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-[#27251F]">{incident.name}</p>
                          <p className="text-sm text-[#27251F]/60 mt-1">
                            {incident.type} • {incident.severity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-[#27251F]">
                          {new Date(incident.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {!recentIncidents.length && (
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
