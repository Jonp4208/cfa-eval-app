import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Target, 
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import '../../styles/scrollbar.css';

interface Evaluation {
  _id: string;
  date: string;
  type: string;
  status: 'pending_self_evaluation' | 'pending_manager_review' | 'in_review_session' | 'completed';
  score?: number;
  employee: {
    _id: string;
    name: string;
    position?: string;
  };
}

interface Goal {
  _id: string;
  title: string;
  status: 'not-started' | 'in-progress' | 'completed';
  dueDate: string;
  progress: number;
}

interface DashboardData {
  upcomingEvaluations: Evaluation[];
  recentEvaluations: Evaluation[];
  goals: Goal[];
  metrics: {
    evaluationScores: Array<{ date: string; score: number }>;
    completedEvaluations: number;
    completedGoals: number;
    averageScore: number;
  };
}

export default function Dashboard() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard', currentUser?._id],
    queryFn: async () => {
      const response = await api.get('/api/dashboard');
      return response.data;
    },
    enabled: !!currentUser
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {currentUser?.name}</h1>
        <p className="text-gray-500">Here's an overview of your performance and goals</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {data?.metrics.completedEvaluations || 0}
              </div>
              <p className="text-sm text-gray-500">Completed Evaluations</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {data?.metrics.averageScore || 0}%
              </div>
              <p className="text-sm text-gray-500">Average Score</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {data?.metrics.completedGoals || 0}
              </div>
              <p className="text-sm text-gray-500">Completed Goals</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.metrics.evaluationScores || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Evaluations */}
      <Card className="h-[200px]">
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Evaluations</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/evaluations')}>
              View All →
            </Button>
          </div>
          <div className="space-y-4 flex-1 overflow-auto scrollbar-custom">
            {data?.upcomingEvaluations.map((evaluation) => (
              <div key={evaluation._id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{evaluation.employee?.name}</p>
                    <p className="text-sm text-gray-500">
                      {evaluation.type} • Due {new Date(evaluation.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline">Start</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Development Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Development Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.goals.map((goal) => (
              <div 
                key={goal._id}
                className="p-4 border rounded-lg"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium">{goal.title}</h4>
                    <p className="text-sm text-gray-500">
                      Due: {new Date(goal.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    goal.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : goal.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {goal.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {(!data?.goals || data.goals.length === 0) && (
              <p className="text-center text-gray-500">No active goals</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 