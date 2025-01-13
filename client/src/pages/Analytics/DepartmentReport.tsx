// client/src/pages/Analytics/DepartmentReport.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import {
  TrendingUp, 
  Star,
  AlertCircle,
  Loader2
} from 'lucide-react';
import api from '@/lib/axios';
import { AnalyticsPageHeader } from './index';

interface DepartmentData {
  foh: {
    categories: {
      'Guest Service': number;
      'Speed of Service': number;
      'Order Accuracy': number;
      'Cleanliness': number;
      'Team Collaboration': number;
    };
    topPerformers: Array<{
      id: string;
      name: string;
      position: string;
      score: number;
      improvement: number;
    }>;
    improvementAreas: Array<{
      category: string;
      score: number;
      trend: 'up' | 'down' | 'stable';
    }>;
  };
  boh: {
    categories: {
      'Food Safety': number;
      'Food Quality': number;
      'Kitchen Efficiency': number;
      'Cleanliness': number;
      'Team Collaboration': number;
    };
    topPerformers: Array<{
      id: string;
      name: string;
      position: string;
      score: number;
      improvement: number;
    }>;
    improvementAreas: Array<{
      category: string;
      score: number;
      trend: 'up' | 'down' | 'stable';
    }>;
  };
}

export function DepartmentReport() {
  const [department, setDepartment] = useState<'foh' | 'boh'>('foh');
  const [timeframe, setTimeframe] = useState('month');

  const { data, isLoading } = useQuery({
    queryKey: ['department-report', department, timeframe],
    queryFn: async () => {
      const response = await api.get(`/api/analytics/department/${department}`, {
        params: { timeframe }
      });
      return response.data;
    }
  });

  const departmentMetrics = data?.[department];
  const hasData = departmentMetrics && 
    Object.keys(departmentMetrics.categories || {}).length > 0 || 
    (departmentMetrics?.topPerformers || []).length > 0 || 
    (departmentMetrics?.improvementAreas || []).length > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AnalyticsPageHeader title="Department Reports" />
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setDepartment('foh')}
            className={`px-4 py-2 rounded-md ${
              department === 'foh' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Front of House
          </button>
          <button
            onClick={() => setDepartment('boh')}
            className={`px-4 py-2 rounded-md ${
              department === 'boh' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Back of House
          </button>
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
        <AnalyticsPageHeader title="Department Reports" />
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setDepartment('foh')}
            className={`px-4 py-2 rounded-md ${
              department === 'foh' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Front of House
          </button>
          <button
            onClick={() => setDepartment('boh')}
            className={`px-4 py-2 rounded-md ${
              department === 'boh' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Back of House
          </button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-500">
              There is currently no performance data available for the {department === 'foh' ? 'Front of House' : 'Back of House'} department.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnalyticsPageHeader title="Department Reports" />
      
      {/* Department Selection */}
      <div className="flex gap-4 mb-6">
        <Button
          onClick={() => setDepartment('foh')}
          variant={department === 'foh' ? 'default' : 'outline'}
        >
          Front of House
        </Button>
        <Button
          onClick={() => setDepartment('boh')}
          variant={department === 'boh' ? 'default' : 'outline'}
        >
          Back of House
        </Button>
      </div>

      {/* Performance Radar */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(departmentMetrics?.categories || {}).length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={Object.entries(departmentMetrics.categories).map(([key, value]) => ({
                  category: key,
                  score: value
                }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis
                    domain={[0, 5]}
                    tickCount={6}
                    tick={(props) => {
                      const { payload, ...rest } = props;
                      return (
                        <text {...rest} fill="transparent">
                          {payload.value}
                        </text>
                      );
                    }}
                    stroke="transparent"
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    fill="#dc2626"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              No category performance data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          {departmentMetrics?.topPerformers?.length > 0 ? (
            <div className="grid gap-4">
              {departmentMetrics.topPerformers.map((performer: DepartmentData['foh']['topPerformers'][0]) => (
                <div
                  key={performer.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{performer.name}</h3>
                      <p className="text-sm text-gray-500">{performer.position}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{performer.score.toFixed(1)}</p>
                    <p className={`text-sm ${
                      performer.improvement > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {performer.improvement > 0 ? '+' : ''}{performer.improvement.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No top performers data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Improvement Areas */}
      <Card>
        <CardHeader>
          <CardTitle>Areas Needing Focus</CardTitle>
        </CardHeader>
        <CardContent>
          {departmentMetrics?.improvementAreas?.length > 0 ? (
            <div className="space-y-4">
              {departmentMetrics.improvementAreas.map((area: DepartmentData['foh']['improvementAreas'][0]) => (
                <div key={area.category} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{area.category}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <AlertCircle className={`w-4 h-4 ${
                          area.score < 3.5 ? 'text-red-600' : 'text-yellow-600'
                        }`} />
                        <span className="text-sm text-gray-500">
                          Current Score: {area.score.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className={`p-2 rounded-full ${
                      area.trend === 'up' ? 'bg-green-100' :
                      area.trend === 'down' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      <TrendingUp className={`w-4 h-4 ${
                        area.trend === 'up' ? 'text-green-600' :
                        area.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No improvement areas data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

