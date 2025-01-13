// client/src/pages/Dashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Users, FileText, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import TeamMemberDashboard from './TeamMemberDashboard';
import api from '../lib/axios';

interface DashboardStats {
  pendingEvaluations: number;
  completedEvaluations: number;
  totalEmployees: number;
  activeTemplates: number;
  upcomingEvaluations: Array<{
    id: string;
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
  };
  team?: {
    inTraining: number;
    performance: {
      foh: number;
      boh: number;
    };
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // If user is a regular team member, show the team member dashboard
  if (user?.role === 'user') {
    return <TeamMemberDashboard />;
  }

  // Admin/Manager Dashboard
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await api.get('/api/dashboard/stats');
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Quick Actions */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex flex-col items-center">
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold">Manager Dashboard</h1>
                <p className="text-gray-500">CFA Store #{user?.store?.storeNumber}</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-center">
                <Button variant="outline" className="flex-1 sm:flex-initial whitespace-nowrap" onClick={() => navigate('/evaluations/new')}>
                  New Evaluation
                </Button>
                <Button className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-700 text-white whitespace-nowrap" onClick={() => navigate('/disciplinary/new')}>
                  New Incident
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate('/evaluations')}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-red-600 mb-3 border-b pb-2">Evaluations</h3>
              <div>
                <p className="text-sm text-gray-500">Pending Reviews</p>
                <div className="mt-1 flex items-baseline">
                  <p className="text-2xl font-bold text-red-600">{stats?.pendingEvaluations || 0}</p>
                  <p className="ml-2 text-sm text-gray-500">to complete</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate('/disciplinary')}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-red-600 mb-3 border-b pb-2">Disciplinary</h3>
              <div>
                <p className="text-sm text-gray-500">Active Incidents</p>
                <div className="mt-1 flex items-baseline">
                  <p className="text-2xl font-bold text-red-600">{stats?.disciplinary?.active || 0}</p>
                  <p className="ml-2 text-sm text-gray-500">open</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate('/disciplinary?filter=followup')}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-red-600 mb-3 border-b pb-2">Follow-ups</h3>
              <div>
                <p className="text-sm text-gray-500">Due for Review</p>
                <div className="mt-1 flex items-baseline">
                  <p className="text-2xl font-bold text-red-600">{stats?.disciplinary?.followUps || 0}</p>
                  <p className="ml-2 text-sm text-gray-500">this week</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate('/users')}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-red-600 mb-3 border-b pb-2">Team</h3>
              <div>
                <p className="text-sm text-gray-500">Team Members</p>
                <div className="mt-1 flex items-baseline">
                  <p className="text-2xl font-bold text-red-600">{stats?.totalEmployees || 0}</p>
                  <p className="ml-2 text-sm text-gray-500">total</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Evaluations Column */}
          <div className="space-y-6">
            <Card className="h-[200px]">
              <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Evaluations</h2>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/evaluations')}>
                    View All →
                  </Button>
                </div>
                <div className="space-y-4 flex-1 overflow-auto">
                  {stats?.upcomingEvaluations?.map((evaluation) => (
                    <div key={evaluation.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{evaluation.employeeName}</p>
                          <p className="text-sm text-gray-500">
                            {evaluation.templateName} • Due {new Date(evaluation.scheduledDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/evaluations/${evaluation.id}`)}
                        >
                          Start
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!stats?.upcomingEvaluations?.length && (
                    <p className="text-gray-500 text-center py-4">No upcoming evaluations</p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Disciplinary Column */}
          <div className="space-y-6">
            <Card className="h-[200px]">
              <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Active Incidents</h2>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/disciplinary')}>
                    View All →
                  </Button>
                </div>
                <div className="space-y-4 flex-1 overflow-auto">
                  {stats?.disciplinary?.recent?.map((incident) => (
                    <div key={incident.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{incident.name}</p>
                          <p className="text-sm text-gray-500">
                            {incident.type} • {new Date(incident.date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-sm ${
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
                    <p className="text-gray-500 text-center py-4">No active incidents</p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Team Performance Column */}
          <div className="space-y-6">
            {/* Performance Metrics */}
            <Card className="h-[200px]">
              <div className="p-6 h-full flex flex-col">
                <h2 className="text-lg font-semibold mb-4">Team Performance</h2>
                <div className="space-y-4 flex-1">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-500">FOH Performance</span>
                      <span className="font-medium">{stats?.team?.performance?.foh || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${stats?.team?.performance?.foh || 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-500">BOH Performance</span>
                      <span className="font-medium">{stats?.team?.performance?.boh || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${stats?.team?.performance?.boh || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Additional Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-6">
          <Card className="hover:bg-gray-50 transition-colors">
            <Link to="/templates" className="block p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-medium">Evaluation Templates</h3>
                  <p className="text-sm text-gray-500">Manage evaluation forms</p>
                </div>
              </div>
            </Link>
          </Card>

          <Card className="hover:bg-gray-50 transition-colors">
            <Link to="/users" className="block p-6">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-medium">Team Members</h3>
                  <p className="text-sm text-gray-500">Manage employees and roles</p>
                </div>
              </div>
            </Link>
          </Card>

          <Card className="hover:bg-gray-50 transition-colors">
            <Link to="/evaluations/new" className="block p-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-medium">Schedule Reviews</h3>
                  <p className="text-sm text-gray-500">Plan upcoming evaluations</p>
                </div>
              </div>
            </Link>
          </Card>

          <Card className="hover:bg-gray-50 transition-colors">
            <Link to="/future" className="block p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-medium">Documents</h3>
                  <p className="text-sm text-gray-500">Access important files</p>
                </div>
              </div>
            </Link>
          </Card>

          <Card className="hover:bg-gray-50 transition-colors">
            <Link to="/future" className="block p-6">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-medium">Training</h3>
                  <p className="text-sm text-gray-500">Manage training materials</p>
                </div>
              </div>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}