// client/src/pages/Analytics/DevelopmentMetrics.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  Smile,
  BookOpen,
  Target,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend
} from 'recharts';
import api from '@/lib/axios';
import { AnalyticsPageHeader } from './index';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface LeadershipMetric {
  trait: string;
  current: number;
  previous: number;
  focus: string;
}

interface SoftSkill {
  name: string;
  description: string;
  level: number;
  recentAchievement: string;
  nextGoal: string;
}

interface CrossTrainingPosition {
  role: string;
  level: number;
  lastTrained: string;
  nextStep: string;
}

interface Milestone {
  id: string;
  description: string;
  completed: boolean;
}

interface PersonalGoal {
  id: string;
  title: string;
  description: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number;
  targetDate: string;
  milestones?: Milestone[];
}

interface DevelopmentMetricsData {
  leadershipMetrics: LeadershipMetric[];
  softSkills: SoftSkill[];
  crossTraining: CrossTrainingPosition[];
  personalGoals: PersonalGoal[];
}

export function DevelopmentMetrics() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [timeframe, setTimeframe] = useState('quarter');

  const { data, isLoading } = useQuery<DevelopmentMetricsData>({
    queryKey: ['development-metrics', selectedEmployee, timeframe],
    queryFn: async () => {
      const response = await api.get('/api/analytics/development', {
        params: { employeeId: selectedEmployee, timeframe }
      });
      return response.data;
    }
  });

  const hasData = data && (
    (data.leadershipMetrics?.length > 0) ||
    (data.softSkills?.length > 0) ||
    (data.crossTraining?.length > 0) ||
    (data.personalGoals?.length > 0)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AnalyticsPageHeader title="Development Metrics" />
        {/* Filters */}
        <div className="flex gap-4">
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Employees</SelectItem>
              <SelectItem value="active">Active Employees</SelectItem>
              <SelectItem value="new">New Hires</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
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
        <AnalyticsPageHeader title="Development Metrics" />
        {/* Filters */}
        <div className="flex gap-4">
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Employees</SelectItem>
              <SelectItem value="active">Active Employees</SelectItem>
              <SelectItem value="new">New Hires</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-500">
              There is currently no development metrics data available for the selected filters.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnalyticsPageHeader title="Development Metrics" />

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-[180px] rounded-xl">
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Employees</SelectItem>
            <SelectItem value="active">Active Employees</SelectItem>
            <SelectItem value="new">New Hires</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px] rounded-xl">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LeadershipDevelopment />
        <SoftSkillsProgress />
        <CrossTrainingMatrix />
        <PersonalGoalsTracking />
      </div>
    </div>
  );

  // Leadership Development Section
  function LeadershipDevelopment() {
    if (!data?.leadershipMetrics?.length) {
      return (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Leadership Development
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No leadership metrics available</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Leadership Development
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data.leadershipMetrics}>
                <PolarGrid />
                <PolarAngleAxis dataKey="trait" />
                <PolarRadiusAxis 
                  domain={[0, 5]} 
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
                  name="Current"
                  dataKey="current"
                  stroke="#dc2626"
                  fill="#dc2626"
                  fillOpacity={0.5}
                />
                <Radar
                  name="Previous"
                  dataKey="previous"
                  stroke="#6b7280"
                  fill="#6b7280"
                  fillOpacity={0.3}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {data.leadershipMetrics.map((metric) => (
              <div key={metric.trait} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{metric.trait}</span>
                  <span className={`text-sm ${
                    metric.current > metric.previous ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.current > metric.previous ? '↑' : '↓'} {metric.current}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{metric.focus}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Soft Skills Progress Section
  function SoftSkillsProgress() {
    if (!data?.softSkills?.length) {
      return (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="w-5 h-5 text-red-600" />
              Soft Skills Development
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No soft skills data available</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-red-600" />
            Soft Skills Development
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.softSkills.map((skill) => (
              <div key={skill.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{skill.name}</h3>
                    <p className="text-sm text-gray-500">{skill.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-xl text-sm ${
                    skill.level >= 4 ? 'bg-green-100 text-green-800' :
                    skill.level >= 3 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Level {skill.level}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-xl h-2">
                  <div
                    className="bg-red-600 rounded-xl h-2 transition-all duration-500"
                    style={{ width: `${(skill.level / 5) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Recent Achievement: {skill.recentAchievement}</span>
                  <span>Next Goal: {skill.nextGoal}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Cross-Training Matrix
  function CrossTrainingMatrix() {
    if (!data?.crossTraining?.length) {
      return (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-red-600" />
              Cross-Training Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No cross-training data available</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-red-600" />
            Cross-Training Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 bg-gray-50 rounded-l-xl">Position</th>
                  <th className="text-center py-3 px-4 bg-gray-50">Training Level</th>
                  <th className="text-center py-3 px-4 bg-gray-50">Last Trained</th>
                  <th className="text-center py-3 px-4 bg-gray-50 rounded-r-xl">Next Step</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.crossTraining.map((position) => (
                  <tr key={position.role}>
                    <td className="py-3 px-4">{position.role}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              i < position.level ? 'bg-red-600' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-500">
                      {new Date(position.lastTrained).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center text-sm">
                      {position.nextStep}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Personal Goals Tracking
  function PersonalGoalsTracking() {
    if (!data?.personalGoals?.length) {
      return (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-red-600" />
              Personal Goals Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No personal goals available</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-600" />
            Personal Goals Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.personalGoals.map((goal) => (
              <div key={goal.id} className="border-b pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{goal.title}</h3>
                    <p className="text-sm text-gray-500">{goal.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-xl text-sm ${
                    goal.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    goal.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {goal.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-xl h-2 mb-2">
                  <div
                    className="bg-red-600 rounded-xl h-2 transition-all duration-500"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Target Date: {new Date(goal.targetDate).toLocaleDateString()}</span>
                  <span>{goal.progress}% Complete</span>
                </div>
                {goal.milestones && goal.milestones.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium mb-1">Key Milestones:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {goal.milestones.map((milestone) => (
                        <li key={milestone.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={milestone.completed}
                            disabled
                            className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 rounded-lg"
                          />
                          <span>{milestone.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
}