// client/src/pages/Analytics/PerformanceAnalytics.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Sun, 
  Moon, 
  Users,
  UtensilsCrossed,
  TrendingUp,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import api from '@/lib/axios';
import { AnalyticsPageHeader } from './index';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AnalyticsFilters {
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  department: 'all' | 'foh' | 'boh';
  shift: 'all' | 'day' | 'night';
}

interface PerformanceAverages {
  overall: number;
  foh: number;
  boh: number;
  dayShift: number;
  nightShift: number;
}

interface DepartmentComparison {
  category: string;
  foh: number;
  boh: number;
}

interface ShiftComparison {
  date: string;
  dayShift: number;
  nightShift: number;
}

interface PerformanceData {
  averages: PerformanceAverages;
  departmentComparison: DepartmentComparison[];
  shiftComparison: ShiftComparison[];
}

export function PerformanceAnalytics() {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeframe: 'month',
    department: 'all',
    shift: 'all'
  });

  // Fetch analytics data
  const { data, isLoading } = useQuery<PerformanceData>({
    queryKey: ['performance-analytics', filters],
    queryFn: async () => {
      const response = await api.get('/api/analytics/performance', { 
        params: filters 
      });
      return response.data;
    }
  });

  const hasData = data && (
    data.averages.overall > 0 ||
    data.departmentComparison?.length > 0 ||
    data.shiftComparison?.length > 0
  );

  const averageScores = {
    overall: data?.averages?.overall || 0,
    foh: data?.averages?.foh || 0,
    boh: data?.averages?.boh || 0,
    day: data?.averages?.dayShift || 0,
    night: data?.averages?.nightShift || 0
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AnalyticsPageHeader title="Performance Analytics" />
        {/* Keep filters visible during loading */}
        <div className="flex gap-4">
          <Select 
            value={filters.timeframe} 
            onValueChange={(value: AnalyticsFilters['timeframe']) => 
              setFilters(prev => ({ ...prev, timeframe: value }))
            }
          >
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.department} 
            onValueChange={(value: AnalyticsFilters['department']) => 
              setFilters(prev => ({ ...prev, department: value }))
            }
          >
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="foh">Front of House</SelectItem>
              <SelectItem value="boh">Back of House</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.shift} 
            onValueChange={(value: AnalyticsFilters['shift']) => 
              setFilters(prev => ({ ...prev, shift: value }))
            }
          >
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Select shift" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Shifts</SelectItem>
              <SelectItem value="day">Day Shift</SelectItem>
              <SelectItem value="night">Night Shift</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <AnalyticsPageHeader title="Performance Analytics" />
        {/* Keep filters visible when no data */}
        <div className="flex gap-4">
          <Select 
            value={filters.timeframe} 
            onValueChange={(value: AnalyticsFilters['timeframe']) => 
              setFilters(prev => ({ ...prev, timeframe: value }))
            }
          >
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.department} 
            onValueChange={(value: AnalyticsFilters['department']) => 
              setFilters(prev => ({ ...prev, department: value }))
            }
          >
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="foh">Front of House</SelectItem>
              <SelectItem value="boh">Back of House</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.shift} 
            onValueChange={(value: AnalyticsFilters['shift']) => 
              setFilters(prev => ({ ...prev, shift: value }))
            }
          >
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Select shift" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Shifts</SelectItem>
              <SelectItem value="day">Day Shift</SelectItem>
              <SelectItem value="night">Night Shift</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Average</p>
                  <p className="text-2xl font-semibold mt-1 text-gray-400">0.00</p>
                </div>
                <TrendingUp className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600">FOH Average</p>
                  <p className="text-2xl font-semibold mt-1 text-gray-400">0.00</p>
                </div>
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600">BOH Average</p>
                  <p className="text-2xl font-semibold mt-1 text-gray-400">0.00</p>
                </div>
                <UtensilsCrossed className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600">Day Shift</p>
                  <p className="text-2xl font-semibold mt-1 text-gray-400">0.00</p>
                </div>
                <Sun className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600">Night Shift</p>
                  <p className="text-2xl font-semibold mt-1 text-gray-400">0.00</p>
                </div>
                <Moon className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Department Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="transparent" />
                  <XAxis dataKey="category" tick={{ fill: 'transparent' }} />
                  <YAxis domain={[0, 5]} tick={{ fill: 'transparent' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="foh" name="Front of House" fill="#dc2626" />
                  <Bar dataKey="boh" name="Back of House" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Shift Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Day vs Night Shift Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="transparent" />
                  <XAxis dataKey="date" tick={{ fill: 'transparent' }} />
                  <YAxis domain={[0, 5]} tick={{ fill: 'transparent' }} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="dayShift" 
                    name="Day Shift" 
                    stroke="#dc2626" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="nightShift" 
                    name="Night Shift" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnalyticsPageHeader title="Performance Analytics" />

      {/* Filters */}
      <div className="flex gap-4">
        <Select 
          value={filters.timeframe} 
          onValueChange={(value: AnalyticsFilters['timeframe']) => 
            setFilters(prev => ({ ...prev, timeframe: value }))
          }
        >
          <SelectTrigger className="w-[180px] rounded-xl">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.department} 
          onValueChange={(value: AnalyticsFilters['department']) => 
            setFilters(prev => ({ ...prev, department: value }))
          }
        >
          <SelectTrigger className="w-[180px] rounded-xl">
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="foh">Front of House</SelectItem>
            <SelectItem value="boh">Back of House</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.shift} 
          onValueChange={(value: AnalyticsFilters['shift']) => 
            setFilters(prev => ({ ...prev, shift: value }))
          }
        >
          <SelectTrigger className="w-[180px] rounded-xl">
            <SelectValue placeholder="Select shift" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Shifts</SelectItem>
            <SelectItem value="day">Day Shift</SelectItem>
            <SelectItem value="night">Night Shift</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Average</p>
                <p className={`text-2xl font-semibold mt-1 ${getScoreColor(averageScores.overall)}`}>
                  {averageScores.overall.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">FOH Average</p>
                <p className={`text-2xl font-semibold mt-1 ${getScoreColor(averageScores.foh)}`}>
                  {averageScores.foh.toFixed(2)}
                </p>
              </div>
              <Users className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">BOH Average</p>
                <p className={`text-2xl font-semibold mt-1 ${getScoreColor(averageScores.boh)}`}>
                  {averageScores.boh.toFixed(2)}
                </p>
              </div>
              <UtensilsCrossed className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Day Shift</p>
                <p className={`text-2xl font-semibold mt-1 ${getScoreColor(averageScores.day)}`}>
                  {averageScores.day.toFixed(2)}
                </p>
              </div>
              <Sun className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Night Shift</p>
                <p className={`text-2xl font-semibold mt-1 ${getScoreColor(averageScores.night)}`}>
                  {averageScores.night.toFixed(2)}
                </p>
              </div>
              <Moon className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Department Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.departmentComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="transparent" />
                <XAxis dataKey="category" tick={{ fill: 'transparent' }} />
                <YAxis domain={[0, 5]} tick={{ fill: 'transparent' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="foh" name="Front of House" fill="#dc2626" />
                <Bar dataKey="boh" name="Back of House" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Shift Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Day vs Night Shift Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.shiftComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="transparent" />
                <XAxis dataKey="date" tick={{ fill: 'transparent' }} />
                <YAxis domain={[0, 5]} tick={{ fill: 'transparent' }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="dayShift" 
                  name="Day Shift" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="nightShift" 
                  name="Night Shift" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}