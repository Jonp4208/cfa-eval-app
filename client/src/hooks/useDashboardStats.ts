import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

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

interface PerformanceData {
  date: string;
  FOH: number;
  BOH: number;
}

export function useDashboardStats() {
  // Fetch dashboard stats with optimized caching
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await api.get('/api/dashboard/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Cache persists for 30 minutes
    refetchOnWindowFocus: false
  });

  // Fetch performance data with separate caching strategy
  const { data: performanceData, isLoading: performanceLoading } = useQuery<PerformanceData[]>({
    queryKey: ['performanceTrends'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/performance-trends');
      return response.data.performanceTrends;
    },
    staleTime: 15 * 60 * 1000, // Performance data stays fresh longer
    cacheTime: 60 * 60 * 1000, // Cache persists for 1 hour
    refetchOnWindowFocus: false
  });

  // Memoized calculations
  const chartData = useMemo(() => {
    if (!performanceData) return [];
    return performanceData.map(data => ({
      ...data,
      date: new Date(data.date).toLocaleDateString()
    }));
  }, [performanceData]);

  const upcomingEvaluations = useMemo(() => {
    if (!stats?.upcomingEvaluations) return [];
    return stats.upcomingEvaluations.slice(0, 5);
  }, [stats?.upcomingEvaluations]);

  const recentIncidents = useMemo(() => {
    if (!stats?.disciplinary?.recent) return [];
    return stats.disciplinary.recent.slice(0, 5);
  }, [stats?.disciplinary?.recent]);

  const performanceMetrics = useMemo(() => {
    if (!stats?.team?.performance) return { foh: 0, boh: 0, average: 0 };
    const { foh, boh } = stats.team.performance;
    return {
      foh,
      boh,
      average: Math.round((foh + boh) / 2)
    };
  }, [stats?.team?.performance]);

  const trainingMetrics = useMemo(() => {
    if (!stats?.team) return { inTraining: 0, totalEmployees: 0, trainingRate: 0 };
    return {
      inTraining: stats.team.inTraining,
      totalEmployees: stats.totalEmployees,
      trainingRate: Math.round((stats.team.inTraining / stats.totalEmployees) * 100)
    };
  }, [stats?.team, stats?.totalEmployees]);

  return {
    stats,
    chartData,
    upcomingEvaluations,
    recentIncidents,
    performanceMetrics,
    trainingMetrics,
    isLoading: statsLoading || performanceLoading
  };
} 