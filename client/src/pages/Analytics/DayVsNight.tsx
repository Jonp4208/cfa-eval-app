import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Sun, Moon } from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ShiftMetrics {
  category: string;
  day: number;
  night: number;
}

interface ShiftComparison {
  metrics: ShiftMetrics[];
  averages: {
    day: number;
    night: number;
  };
  topPerformers: {
    day: Array<{
      name: string;
      score: number;
      position: string;
    }>;
    night: Array<{
      name: string;
      score: number;
      position: string;
    }>;
  };
  departmentComparison: {
    category: string;
    day: number;
    night: number;
  }[];
}

const DayVsNight = () => {
  const { user } = useAuth();
  const [timeframe] = useState('month');

  const { data, isLoading, error } = useQuery<ShiftComparison>({
    queryKey: ['shift-comparison', timeframe],
    queryFn: async () => {
      try {
        const response = await api.get('/api/analytics/shift-comparison', {
          params: { 
            timeframe,
            store: user?.store?._id
          }
        });
        return response.data;
      } catch (error) {
        throw new Error('Failed to fetch shift comparison data');
      }
    }
  });

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Day vs Night Analysis</h1>
                <p className="text-white/80 mt-2 text-lg">Shift Performance Comparison</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load shift comparison data. Please try again later.</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <Card key={i} className="bg-white rounded-[20px] shadow-md">
                <CardContent className="p-8">
                  <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shift Overview */}
            <Card className="bg-white rounded-[20px] shadow-md hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="grid grid-cols-2 gap-8">
                  {/* Day Shift */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 bg-[#E51636]/10 rounded-xl flex items-center justify-center">
                        <Sun className="h-6 w-6 text-[#E51636]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#27251F]">Day Shift</h3>
                        <p className="text-2xl font-bold text-[#E51636]">
                          {data.averages.day.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {data.topPerformers.day.slice(0, 3).map((performer, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-[#E51636]/5 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-medium text-[#E51636]">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-[#27251F]">{performer.name}</p>
                            <p className="text-sm text-[#27251F]/60">{performer.score.toFixed(1)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Night Shift */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 bg-[#E51636]/10 rounded-xl flex items-center justify-center">
                        <Moon className="h-6 w-6 text-[#E51636]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#27251F]">Night Shift</h3>
                        <p className="text-2xl font-bold text-[#E51636]">
                          {data.averages.night.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {data.topPerformers.night.slice(0, 3).map((performer, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-[#E51636]/5 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-medium text-[#E51636]">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-[#27251F]">{performer.name}</p>
                            <p className="text-sm text-[#27251F]/60">{performer.score.toFixed(1)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Chart */}
            <Card className="bg-white rounded-[20px] shadow-md hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="font-semibold text-[#27251F] mb-6">Performance by Category</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.departmentComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="category" 
                        tick={{ fill: '#27251F', fontSize: 12 }}
                        tickLine={{ stroke: '#E5E7EB' }}
                      />
                      <YAxis 
                        tick={{ fill: '#27251F', fontSize: 12 }}
                        tickLine={{ stroke: '#E5E7EB' }}
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="day" 
                        name="Day Shift" 
                        fill="#E51636" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="night" 
                        name="Night Shift" 
                        fill="#27251F" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default DayVsNight; 