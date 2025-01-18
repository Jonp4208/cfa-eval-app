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
  ChevronDown,
  ChevronRight
} from 'lucide-react';

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
  }>;
}

export default function TeamMemberDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['teamMemberDashboard'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/team-member');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const dashboardData: TeamMemberDashboardData = {
    name: data?.name || '',
    position: data?.position || '',
    departments: data?.departments || [],
    currentPerformance: data?.currentPerformance,
    nextEvaluation: data?.nextEvaluation || {
      date: null,
      templateName: '',
      status: '',
      evaluator: null,
      id: null,
    },
    activeGoals: data?.activeGoals || 0,
    goals: data?.goals || [],
    achievements: data?.achievements || [],
  };

  const NextEvaluationCard = ({ nextEvaluation }: { nextEvaluation: TeamMemberDashboardData['nextEvaluation'] }) => {
    const navigate = useNavigate();

    const getStatusDisplay = () => {
      if (!nextEvaluation.date) return 'Not Scheduled';
      const daysUntil = Math.ceil((new Date(nextEvaluation.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return `${daysUntil} days`;
    };

    const handleAction = () => {
      if (nextEvaluation.id) {
        navigate(`/evaluations/${nextEvaluation.id}`);
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Next Evaluation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {nextEvaluation.date ? (
              <>
                <p className="text-sm text-muted-foreground">Scheduled in {getStatusDisplay()}</p>
                <p className="font-medium">{nextEvaluation.templateName}</p>
                {nextEvaluation.evaluator && (
                  <p className="text-sm text-muted-foreground">with {nextEvaluation.evaluator}</p>
                )}
                {nextEvaluation.status === 'pending_self_evaluation' && (
                  <Button 
                    onClick={handleAction}
                    className="mt-2"
                  >
                    Complete Self Evaluation
                  </Button>
                )}
                {nextEvaluation.status === 'completed' && !nextEvaluation.acknowledged && (
                  <Button 
                    onClick={handleAction}
                    className="mt-2"
                    variant="outline"
                  >
                    Review & Acknowledge Evaluation
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not Scheduled</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Welcome, {dashboardData.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NextEvaluationCard nextEvaluation={dashboardData.nextEvaluation} />
        {/* ... other dashboard cards ... */}
      </div>
    </div>
  );
} 