import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';

interface TeamMemberDashboardData {
  name: string;
  position: string;
  departments: string[];
  currentPerformance: number | null;
  nextEvaluation: {
    date: string | null;
    templateName: string;
    status: string;
    evaluator: string | null;
    id: string | null;
    acknowledged?: boolean;
    lastEvaluationDate?: string | null;
  };
  activeGoals: number;
  goals: Array<{
    id: string;
    name: string;
    progress: number;
    targetDate: string;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    date: string;
    type?: 'award' | 'milestone' | 'other';
  }>;
  training: {
    required: Array<{
      id: string;
      name: string;
      progress: number;
      dueDate: string;
    }>;
    completed: Array<{
      id: string;
      name: string;
      completedAt: string;
      type: string;
    }>;
  };
  schedule: Array<{
    id: string;
    name: string;
    date: string;
    type: string;
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
    },
  });

  const [dashboardData, setDashboardData] = useState<TeamMemberDashboardData>({
    name: data?.name || 'Team Member',
    position: data?.position || 'Position',
    departments: data?.departments || [],
    currentPerformance: data?.currentPerformance || 0,
    nextEvaluation: data?.nextEvaluation || {
      date: null,
      templateName: '',
      status: '',
      evaluator: null,
      id: null
    },
    activeGoals: data?.activeGoals || 0,
    goals: data?.goals || [],
    training: {
      required: data?.training?.required || [],
      completed: data?.training?.completed || []
    },
    achievements: data?.achievements || [],
    schedule: data?.schedule || []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardResponse, trainingResponse] = await Promise.all([
          api.get('/api/dashboard/team-member'),
          api.get('/api/training/progress')
        ]);

        const dashboardData = dashboardResponse.data;
        const trainingData = trainingResponse.data;

        // Transform training data for dashboard
        const activeTraining = trainingData
          .filter(progress => progress.status === 'IN_PROGRESS')
          .map(progress => ({
            id: progress._id,
            name: progress.trainingPlan.name,
            type: progress.trainingPlan.type,
            completedModules: progress.moduleProgress.filter(mp => mp.completed).length,
            totalModules: progress.trainingPlan.modules.length,
            progress: Math.round((progress.moduleProgress.filter(mp => mp.completed).length / 
                     progress.trainingPlan.modules.length) * 100)
          }));

        const completedTraining = trainingData
          .filter(progress => progress.status === 'COMPLETED')
          .map(progress => ({
            id: progress._id,
            name: progress.trainingPlan.name,
            type: progress.trainingPlan.type,
            completedAt: progress.completedAt
          }))
          .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
          .slice(0, 3);

        setDashboardData(prev => ({
          ...dashboardData,
          training: {
            required: activeTraining,
            completed: completedTraining
          }
        }));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title={`Welcome back, ${dashboardData.name}!`}
          subtitle={`${dashboardData.position} • ${dashboardData.departments.join(', ')}`}
          actions={
            <button
              onClick={() => navigate(`/users/${user?._id}`)}
              className="w-full bg-white hover:bg-gray-50 text-[#E51636] flex items-center justify-center gap-2 py-2 md:py-2.5 px-3 md:px-4 rounded-[6px] md:rounded-[8px] transition-colors"
            >
              <User className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-sm md:text-base font-medium">View Full Profile</span>
            </button>
          }
        />

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#27251F]/60 font-medium">Current Performance</p>
                  <h3 className="text-3xl font-bold mt-2 text-[#27251F]">{dashboardData.currentPerformance}%</h3>
                </div>
                <div className="h-14 w-14 bg-[#E51636]/10 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-[#E51636]" />
                </div>
              </div>
              <div className="mt-6">
                <div className="w-full bg-[#E51636]/10 rounded-full h-2">
                  <div 
                    className="bg-[#E51636] h-2 rounded-full" 
                    style={{ width: `${dashboardData.currentPerformance}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#27251F]/60 font-medium">Next Evaluation</p>
                  {dashboardData.nextEvaluation.date ? (
                    <>
                      <h3 className="text-3xl font-bold mt-2 text-[#27251F]">
                        {new Date(dashboardData.nextEvaluation.date).toLocaleDateString()}
                      </h3>
                      <p className="text-[#27251F]/60 mt-1">
                        {Math.ceil((new Date(dashboardData.nextEvaluation.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days away
                      </p>
                      {dashboardData.nextEvaluation.lastEvaluationDate && (
                        <p className="text-[#27251F]/60 mt-2 text-sm">
                          Last evaluation: {new Date(dashboardData.nextEvaluation.lastEvaluationDate).toLocaleDateString()}
                        </p>
                      )}
                      {dashboardData.nextEvaluation.status === 'pending_self_evaluation' && (
                        <Button 
                          onClick={() => navigate(`/evaluations/${dashboardData.nextEvaluation.id}`)}
                          className="mt-4 bg-[#4CD964] text-white hover:bg-[#3CC954] w-full"
                        >
                          Complete Self-Evaluation →
                        </Button>
                      )}
                      {dashboardData.nextEvaluation.status === 'pending_manager_review' && (
                        <div className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl text-center">
                          Pending Manager Review
                        </div>
                      )}
                      {dashboardData.nextEvaluation.status === 'completed' && !dashboardData.nextEvaluation.acknowledged && (
                        <Button 
                          onClick={() => navigate(`/evaluations/${dashboardData.nextEvaluation.id}`)}
                          className="mt-4 bg-[#4CD964] text-white hover:bg-[#3CC954] w-full"
                        >
                          Review & Acknowledge →
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="text-3xl font-bold mt-2 text-[#27251F]">Not Scheduled</h3>
                      <p className="text-[#27251F]/60 mt-1">No upcoming evaluation</p>
                      {dashboardData.nextEvaluation.lastEvaluationDate && (
                        <p className="text-[#27251F]/60 mt-2 text-sm">
                          Last evaluation: {new Date(dashboardData.nextEvaluation.lastEvaluationDate).toLocaleDateString()}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="h-14 w-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Calendar className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#27251F]/60 font-medium">Active Goals</p>
                  <h3 className="text-3xl font-bold mt-2 text-[#27251F]">{dashboardData.activeGoals}</h3>
                  <p className="text-[#27251F]/60 mt-1">goals in progress</p>
                </div>
                <div className="h-14 w-14 bg-green-100 rounded-2xl flex items-center justify-center">
                  <Star className="h-7 w-7 text-green-600" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Goals and Training */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Goals */}
            <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#27251F]">Current Goals</h2>
                    <p className="text-[#27251F]/60 mt-1">Track your progress</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {dashboardData.goals.length === 0 ? (
                    <p className="text-[#27251F]/60 text-center py-4">No active goals</p>
                  ) : (
                    dashboardData.goals.map((goal) => (
                      <div key={goal.id} className="p-4 bg-[#F4F4F4] rounded-xl hover:bg-[#F4F4F4]/80 transition-colors">
                        <div className="flex justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-[#27251F]">{goal.name}</h3>
                            <p className="text-sm text-[#27251F]/60">Due {new Date(goal.targetDate).toLocaleDateString()}</p>
                          </div>
                          <span className="text-sm font-medium text-[#27251F]">{goal.progress}%</span>
                        </div>
                        <div className="w-full bg-[#E51636]/10 rounded-full h-2">
                          <div 
                            className="bg-[#E51636] h-2 rounded-full" 
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
            <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#27251F]">Training Progress</h2>
                    <p className="text-[#27251F]/60 mt-1">Your assigned training plans</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/training')}
                    className="text-[#E51636] border-[#E51636] hover:bg-[#E51636]/10"
                  >
                    View All
                  </Button>
                </div>

                {/* Active Training Plans */}
                <div className="space-y-6">
                  {dashboardData.training.required.length === 0 ? (
                    <p className="text-[#27251F]/60 text-center py-4">No active training plans</p>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <h3 className="font-medium text-[#27251F]">Active Training</h3>
                        {dashboardData.training.required.map((training) => (
                          <div 
                            key={training.id} 
                            className="p-4 bg-[#F4F4F4] rounded-xl hover:bg-[#F4F4F4]/80 transition-colors cursor-pointer"
                            onClick={() => navigate(`/training/progress/${training.id}`)}
                          >
                            <div className="flex justify-between mb-2">
                              <div>
                                <h3 className="font-medium text-[#27251F]">{training.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm text-[#27251F]/60">
                                    {training.completedModules} of {training.totalModules} tasks completed
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#E51636]/10 text-[#E51636]">
                                    {training.type}
                                  </span>
                                </div>
                              </div>
                              <span className="text-sm font-medium text-[#27251F]">{training.progress}%</span>
                            </div>
                            <div className="w-full bg-[#E51636]/10 rounded-full h-2">
                              <div 
                                className="bg-[#E51636] h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${training.progress}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Recently Completed Training */}
                      {dashboardData.training.completed.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="font-medium text-[#27251F]">Recently Completed</h3>
                          {dashboardData.training.completed.slice(0, 3).map((training) => (
                            <div 
                              key={training.id} 
                              className="p-4 bg-[#F4F4F4] rounded-xl hover:bg-[#F4F4F4]/80 transition-colors cursor-pointer"
                              onClick={() => navigate(`/training/progress/${training.id}`)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-medium text-[#27251F]">{training.name}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-[#27251F]/60">
                                      Completed {new Date(training.completedAt).toLocaleDateString()}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                                      {training.type}
                                    </span>
                                  </div>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                  <BadgeCheck className="h-5 w-5 text-green-600" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Achievements and Schedule */}
          <div className="space-y-6">
            {/* Recent Achievements */}
            <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#27251F]">Recent Achievements</h2>
                    <p className="text-[#27251F]/60 mt-1">Your latest accomplishments</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {dashboardData.achievements.length === 0 ? (
                    <p className="text-[#27251F]/60 text-center py-4">No recent achievements</p>
                  ) : (
                    dashboardData.achievements.map((achievement) => (
                      <div key={achievement.id} className="p-4 bg-[#F4F4F4] rounded-xl hover:bg-[#F4F4F4]/80 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-[#E51636]/10 flex items-center justify-center">
                            <span className="text-[#E51636] text-lg font-bold">
                              {achievement.type === 'award' ? '🏆' : achievement.type === 'milestone' ? '⭐' : '📜'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-[#27251F]">{achievement.title}</h3>
                            <p className="text-sm text-[#27251F]/60">{achievement.date}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            {/* Upcoming Schedule */}
            <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#27251F]">Upcoming Schedule</h2>
                    <p className="text-[#27251F]/60 mt-1">Your next events</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {isLoading ? (
                    <p className="text-[#27251F]/60 text-center py-4">Loading...</p>
                  ) : !dashboardData?.schedule ? (
                    <p className="text-[#27251F]/60 text-center py-4">No schedule data available</p>
                  ) : dashboardData.schedule.length === 0 ? (
                    <p className="text-[#27251F]/60 text-center py-4">No upcoming events</p>
                  ) : (
                    dashboardData.schedule.map((event) => (
                      <div key={event.id} className="p-4 bg-[#F4F4F4] rounded-xl hover:bg-[#F4F4F4]/80 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-[#27251F]">{event.name}</h3>
                            <p className="text-sm text-[#27251F]/60">{new Date(event.date).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            event.type === 'Training' ? 'bg-blue-100 text-blue-800' :
                            event.type === 'Evaluation' ? 'bg-[#E51636]/10 text-[#E51636]' :
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
          {[
            { icon: FileText, label: 'My Evaluations', description: 'View evaluation history', path: '/evaluations', color: 'text-blue-600 bg-blue-100' },
            { icon: Star, label: 'Development Goals', description: 'Track your progress', path: '/goals', color: 'text-[#E51636] bg-[#E51636]/10' },
            { icon: BookOpen, label: 'Training', description: 'View required training', path: '/training', color: 'text-green-600 bg-green-100' },
          ].map((link, index) => {
            const Icon = link.icon;
            return (
              <Card key={index} className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <Link to={link.path} className="p-4 rounded-xl flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg ${link.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#27251F]">{link.label}</h3>
                    <p className="text-sm text-[#27251F]/60">{link.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#27251F]/40 ml-auto" />
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
} 