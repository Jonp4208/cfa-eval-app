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
  const [showSetupGuide, setShowSetupGuide] = useState(true);

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
      <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
            <div className="relative">
              <h1 className="text-3xl md:text-4xl font-bold">Department Reports</h1>
              <p className="text-white/80 mt-2 text-lg">Performance metrics by department</p>
            </div>
          </div>
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E51636]" />
          </div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
            <div className="relative">
              <h1 className="text-3xl md:text-4xl font-bold">Department Reports</h1>
              <p className="text-white/80 mt-2 text-lg">Performance metrics by department</p>
            </div>
          </div>
          
          {showSetupGuide && (
            <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-[#27251F] flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-[#E51636]" />
                  Template Setup Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-[#27251F]/60">To use department reports, your evaluation templates need specific sections based on the department:</p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-[#F4F4F4] rounded-xl">
                      <h3 className="font-semibold mb-2 text-[#27251F]">Front of House (FOH) Template:</h3>
                      <ul className="space-y-1 text-[#27251F]/60">
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                          Guest Service
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                          Speed of Service
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                          Order Accuracy
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                          Cleanliness
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                          Team Collaboration
                        </li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-[#F4F4F4] rounded-xl">
                      <h3 className="font-semibold mb-2 text-[#27251F]">Back of House (BOH) Template:</h3>
                      <ul className="space-y-1 text-[#27251F]/60">
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                          Food Safety
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                          Food Quality
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                          Kitchen Efficiency
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                          Cleanliness
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                          Team Collaboration
                        </li>
                      </ul>
                    </div>
                  </div>

                  <p className="text-[#27251F]/60">Each section should have criteria with numerical ratings to generate accurate reports.</p>
                  
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      className="text-[#27251F] hover:bg-[#F4F4F4]"
                      onClick={() => setShowSetupGuide(false)}
                    >
                      Got it
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4 mb-6">
            <Button
              onClick={() => setDepartment('foh')}
              variant={department === 'foh' ? 'default' : 'outline'}
              className={department === 'foh' ? 'bg-[#E51636] hover:bg-[#E51636]/90' : ''}
            >
              Front of House
            </Button>
            <Button
              onClick={() => setDepartment('boh')}
              variant={department === 'boh' ? 'default' : 'outline'}
              className={department === 'boh' ? 'bg-[#E51636] hover:bg-[#E51636]/90' : ''}
            >
              Back of House
            </Button>
          </div>
          <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300">
            <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
              <AlertCircle className="w-12 h-12 text-[#27251F]/40 mb-4" />
              <h3 className="text-lg font-medium text-[#27251F] mb-2">No Data Available</h3>
              <p className="text-[#27251F]/60">
                There is currently no performance data available for the {department === 'foh' ? 'Front of House' : 'Back of House'} department.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <h1 className="text-3xl md:text-4xl font-bold">Department Reports</h1>
            <p className="text-white/80 mt-2 text-lg">Performance metrics by department</p>
          </div>
        </div>

        {showSetupGuide && (
          <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-[#27251F] flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#E51636]" />
                Template Setup Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-[#27251F]/60">To get the most accurate reports, ensure your evaluation templates have these sections:</p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-[#F4F4F4] rounded-xl">
                    <h3 className="font-semibold mb-2 text-[#27251F]">Front of House (FOH) Template:</h3>
                    <ul className="space-y-1 text-[#27251F]/60">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                        Guest Service
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                        Speed of Service
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                        Order Accuracy
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                        Cleanliness
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                        Team Collaboration
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-[#F4F4F4] rounded-xl">
                    <h3 className="font-semibold mb-2 text-[#27251F]">Back of House (BOH) Template:</h3>
                    <ul className="space-y-1 text-[#27251F]/60">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                        Food Safety
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                        Food Quality
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                        Kitchen Efficiency
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                        Cleanliness
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#E51636]" />
                        Team Collaboration
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    className="text-[#27251F] hover:bg-[#F4F4F4]"
                    onClick={() => setShowSetupGuide(false)}
                  >
                    Got it
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Department Selection */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => setDepartment('foh')}
              variant={department === 'foh' ? 'default' : 'outline'}
              className={`w-full sm:w-auto ${
                department === 'foh' 
                  ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                  : ''
              }`}
            >
              Front of House
            </Button>
            <Button
              onClick={() => setDepartment('boh')}
              variant={department === 'boh' ? 'default' : 'outline'}
              className={`w-full sm:w-auto ${
                department === 'boh' 
                  ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                  : ''
              }`}
            >
              Back of House
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button
              onClick={() => setTimeframe('month')}
              variant={timeframe === 'month' ? 'default' : 'outline'}
              size="sm"
              className={`flex-1 sm:flex-none ${
                timeframe === 'month' 
                  ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                  : ''
              }`}
            >
              Month
            </Button>
            <Button
              onClick={() => setTimeframe('quarter')}
              variant={timeframe === 'quarter' ? 'default' : 'outline'}
              size="sm"
              className={`flex-1 sm:flex-none ${
                timeframe === 'quarter' 
                  ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                  : ''
              }`}
            >
              Quarter
            </Button>
            <Button
              onClick={() => setTimeframe('year')}
              variant={timeframe === 'year' ? 'default' : 'outline'}
              size="sm"
              className={`flex-1 sm:flex-none ${
                timeframe === 'year' 
                  ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                  : ''
              }`}
            >
              Year
            </Button>
          </div>
        </div>

        {/* Performance Radar */}
        <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#27251F]">Category Performance Overview</CardTitle>
            <p className="text-[#27251F]/60 mt-1">Performance metrics across key areas</p>
          </CardHeader>
          <CardContent>
            {Object.keys(departmentMetrics?.categories || {}).length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={Object.entries(departmentMetrics.categories).map(([key, value]) => ({
                    category: key,
                    score: value
                  }))}>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis 
                      dataKey="category" 
                      tick={{ fill: '#27251F', fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      domain={[0, 5]}
                      tickCount={6}
                      tick={(props) => {
                        const { payload, ...rest } = props;
                        return (
                          <text {...rest} fill="#27251F" fontSize={12}>
                            {payload.value}
                          </text>
                        );
                      }}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      fill="#E51636"
                      fillOpacity={0.2}
                      stroke="#E51636"
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-[#27251F]/60">
                No category performance data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#27251F]">Top Performers</CardTitle>
            <p className="text-[#27251F]/60 mt-1">Highest rated team members</p>
          </CardHeader>
          <CardContent>
            {departmentMetrics?.topPerformers?.length > 0 ? (
              <div className="grid gap-4">
                {departmentMetrics.topPerformers.map((performer) => (
                  <div
                    key={performer.id}
                    className="p-4 bg-[#F4F4F4] rounded-xl hover:bg-[#F4F4F4]/80 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-[#E51636]/10 rounded-xl flex items-center justify-center">
                          <Star className="w-6 h-6 text-[#E51636]" />
                        </div>
                        <div>
                          <h3 className="font-medium text-[#27251F]">{performer.name}</h3>
                          <p className="text-sm text-[#27251F]/60">{performer.position}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-[#27251F]">{performer.score.toFixed(1)}</p>
                        <p className={`text-sm ${
                          performer.improvement > 0 ? 'text-green-600' : 'text-[#E51636]'
                        }`}>
                          {performer.improvement > 0 ? '+' : ''}{performer.improvement.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#27251F]/60">
                No top performers data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Improvement Areas */}
        <Card className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#27251F]">Areas Needing Focus</CardTitle>
            <p className="text-[#27251F]/60 mt-1">Categories requiring attention</p>
          </CardHeader>
          <CardContent>
            {departmentMetrics?.improvementAreas?.length > 0 ? (
              <div className="space-y-4">
                {departmentMetrics.improvementAreas.map((area) => (
                  <div key={area.category} className="p-4 bg-[#F4F4F4] rounded-xl hover:bg-[#F4F4F4]/80 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-[#27251F]">{area.category}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <AlertCircle className={`w-4 h-4 ${
                            area.score < 3.5 ? 'text-[#E51636]' : 'text-yellow-600'
                          }`} />
                          <span className="text-sm text-[#27251F]/60">
                            Current Score: {area.score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className={`p-2 rounded-xl ${
                        area.trend === 'up' ? 'bg-green-100' :
                        area.trend === 'down' ? 'bg-[#E51636]/10' : 'bg-[#F4F4F4]'
                      }`}>
                        <TrendingUp className={`w-4 h-4 ${
                          area.trend === 'up' ? 'text-green-600' :
                          area.trend === 'down' ? 'text-[#E51636]' : 'text-[#27251F]/40'
                        }`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#27251F]/60">
                No improvement areas data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

