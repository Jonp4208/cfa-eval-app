import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import {
  TrendingUp,
  Award,
  Calendar,
  Star,
  BookOpen,
  BadgeCheck,
  User,
  FileText,
  ChevronDown
} from 'lucide-react';

interface TeamMemberDashboardData {
  name: string;
  position: string;
  department: string;
  currentPerformance: number;
  nextEvaluation: string;
  activeGoals: number;
  training: {
    required: Array<{
      id: string;
      name: string;
      progress: number;
      dueDate: string;
    }>;
  };
  achievements: Array<{
    id: string;
    title: string;
    date: string;
    type: 'award' | 'milestone' | 'certification';
  }>;
  goals: Array<{
    id: string;
    name: string;
    progress: number;
    dueDate: string;
  }>;
  schedule: Array<{
    id: string;
    type: 'Training' | 'Evaluation' | 'Meeting';
    name: string;
    date: string;
  }>;
}

export default function TeamMemberDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data, isLoading } = useQuery<TeamMemberDashboardData>({
    queryKey: ['teamMemberDashboard'],
    queryFn: async () => {
      const response = await api.get('/api/dashboard/team-member');
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  // Provide default values if data is missing
  const dashboardData = {
    name: data?.name || 'Team Member',
    position: data?.position || 'Position',
    department: data?.department || 'Department',
    currentPerformance: data?.currentPerformance || 0,
    nextEvaluation: data?.nextEvaluation || '',
    activeGoals: data?.activeGoals || 0,
    goals: data?.goals || [],
    training: {
      required: data?.training?.required || []
    },
    achievements: data?.achievements || [],
    schedule: data?.schedule || []
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Welcome back, {dashboardData.name}!</h1>
            <p className="text-gray-500">{dashboardData.position} • {dashboardData.department}</p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/users/${user?._id}`)}>View Full Profile</Button>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <h3 className="text-sm text-gray-500 mb-2">Current Performance</h3>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-red-600">{dashboardData.currentPerformance}%</span>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${dashboardData.currentPerformance}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-sm text-gray-500 mb-2">Next Evaluation</h3>
              <div className="flex flex-col">
                {dashboardData.nextEvaluation ? (
                  <>
                    <span className="text-xl font-medium text-blue-600">
                      {new Date(dashboardData.nextEvaluation).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-gray-500 mt-1">
                      {Math.ceil((new Date(dashboardData.nextEvaluation).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days away
                    </span>
                  </>
                ) : (
                  <span className="text-xl font-medium text-gray-600">Not Scheduled</span>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-sm text-gray-500 mb-2">Active Goals</h3>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-green-600">{dashboardData.activeGoals}</span>
                <span className="text-sm text-gray-500 mt-1">goals in progress</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Goals and Training */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Goals */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Current Goals</h2>
                <div className="space-y-4">
                  {dashboardData.goals.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No active goals</p>
                  ) : (
                    dashboardData.goals.map((goal) => (
                      <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <div>
                            <h3 className="font-medium">{goal.name}</h3>
                            <p className="text-sm text-gray-500">Due {new Date(goal.dueDate).toLocaleDateString()}</p>
                          </div>
                          <span className="text-sm font-medium">{goal.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            {/* Training Progress */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Training Progress</h2>
                <div className="space-y-4">
                  {dashboardData.training.required.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No required training</p>
                  ) : (
                    dashboardData.training.required.map((training) => (
                      <div key={training.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <div>
                            <h3 className="font-medium">{training.name}</h3>
                            <p className="text-sm text-gray-500">Due {new Date(training.dueDate).toLocaleDateString()}</p>
                          </div>
                          <span className="text-sm font-medium">{training.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ width: `${training.progress}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Achievements and Schedule */}
          <div className="space-y-6">
            {/* Recent Achievements */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Achievements</h2>
                <div className="space-y-4">
                  {dashboardData.achievements.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No recent achievements</p>
                  ) : (
                    dashboardData.achievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-full mr-3">
                          <span className="text-red-600 text-lg font-bold">
                            {achievement.type === 'award' ? '🏆' : achievement.type === 'milestone' ? '⭐' : '📜'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium">{achievement.title}</h3>
                          <p className="text-sm text-gray-500">{achievement.date}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            {/* Upcoming Schedule */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Upcoming Schedule</h2>
                <div className="space-y-4">
                  {dashboardData.schedule.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No upcoming events</p>
                  ) : (
                    dashboardData.schedule.map((event) => (
                      <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{event.name}</h3>
                            <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs 
                            ${event.type === 'Training' ? 'bg-blue-100 text-blue-800' :
                              event.type === 'Evaluation' ? 'bg-red-100 text-red-800' :
                              'bg-green-100 text-green-800'}`}>
                            {event.type}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <Link to="/evaluations" className="block p-6">
              <div className="flex flex-col items-center text-center">
                <h3 className="font-medium mb-1">My Evaluations</h3>
                <p className="text-sm text-gray-500">View evaluation history</p>
              </div>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <Link to="/goals" className="block p-6">
              <div className="flex flex-col items-center text-center">
                <h3 className="font-medium mb-1">Development Goals</h3>
                <p className="text-sm text-gray-500">Track your progress</p>
              </div>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <Link to="/training" className="block p-6">
              <div className="flex flex-col items-center text-center">
                <h3 className="font-medium mb-1">Training</h3>
                <p className="text-sm text-gray-500">View required training</p>
              </div>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
} 