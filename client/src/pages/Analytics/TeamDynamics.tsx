// client/src/pages/Analytics/TeamDynamics.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  MessageSquare,
  UserPlus,
  Target,
  TrendingUp,
  Star,
  Award,
  Coffee,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import api from '@/lib/axios';
import { AnalyticsPageHeader } from './index';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CohesionMetric {
  attribute: string;
  score: number;
  insight: string;
}

interface CommunicationMetric {
  type: string;
  description: string;
  score: number;
  feedback: string;
}

interface ShiftTeam {
  id: string;
  name: string;
  teamwork: number;
  efficiency: number;
  morale: number;
  highlights: string[];
  improvements: string[];
}

interface MentorshipRelationship {
  id: string;
  mentor: string;
  mentee: string;
  startDate: string;
  status: 'Active' | 'Completed' | 'On Hold';
  goalsCompleted: number;
  totalGoals: number;
  achievements: string[];
}

interface TeamDynamicsData {
  cohesionMetrics: CohesionMetric[];
  communicationMetrics: CommunicationMetric[];
  shiftTeams: ShiftTeam[];
  mentorships: MentorshipRelationship[];
}

export function TeamDynamics() {
  const [selectedShift, setSelectedShift] = useState('all');
  const [timeframe, setTimeframe] = useState('month');

  // Fetch team dynamics data
  const { data, isLoading } = useQuery<TeamDynamicsData>({
    queryKey: ['team-dynamics', selectedShift, timeframe],
    queryFn: async () => {
      const response = await api.get('/api/analytics/team-dynamics', {
        params: { shift: selectedShift, timeframe }
      });
      return response.data;
    }
  });

  const hasData = data && (
    data.cohesionMetrics.length > 0 ||
    data.communicationMetrics.length > 0 ||
    data.shiftTeams.length > 0 ||
    data.mentorships.length > 0
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AnalyticsPageHeader title="Team Dynamics" />
        {/* Keep filters visible during loading */}
        <div className="flex gap-4">
          <Select value={selectedShift} onValueChange={setSelectedShift}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Select shift" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Shifts</SelectItem>
              <SelectItem value="morning">Morning Shift</SelectItem>
              <SelectItem value="afternoon">Afternoon Shift</SelectItem>
              <SelectItem value="evening">Evening Shift</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="week">Last Week</SelectItem>
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
        <AnalyticsPageHeader title="Team Dynamics" />
        {/* Keep filters visible when no data */}
        <div className="flex gap-4">
          <Select value={selectedShift} onValueChange={setSelectedShift}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Select shift" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Shifts</SelectItem>
              <SelectItem value="morning">Morning Shift</SelectItem>
              <SelectItem value="afternoon">Afternoon Shift</SelectItem>
              <SelectItem value="evening">Evening Shift</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TeamCohesionScore />
          <CommunicationMetrics />
          <ShiftTeamAnalysis />
          <MentorshipTracking />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnalyticsPageHeader title="Team Dynamics" />
      
      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedShift} onValueChange={setSelectedShift}>
          <SelectTrigger className="w-[180px] rounded-xl">
            <SelectValue placeholder="Select shift" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Shifts</SelectItem>
            <SelectItem value="morning">Morning Shift</SelectItem>
            <SelectItem value="afternoon">Afternoon Shift</SelectItem>
            <SelectItem value="evening">Evening Shift</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px] rounded-xl">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Cohesion Score */}
      <TeamCohesionScore />
      <CommunicationMetrics />
      <ShiftTeamAnalysis />
      <MentorshipTracking />
    </div>
  );

  // Team Cohesion Score
  function TeamCohesionScore() {
    if (!data?.cohesionMetrics?.length) {
      return (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600" />
              Team Cohesion Score
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No cohesion data available</p>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600" />
            Team Cohesion Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data.cohesionMetrics}>
                <PolarGrid stroke="transparent" />
                <PolarAngleAxis dataKey="attribute" tick={{ fill: 'transparent' }} />
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
                  dataKey="score"
                  stroke="#dc2626"
                  fill="#dc2626"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {/* Cohesion Breakdown */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {data.cohesionMetrics.map((metric) => (
              <div key={metric.attribute} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{metric.attribute}</span>
                  <span className="text-red-600">{metric.score.toFixed(1)}</span>
                </div>
                <p className="text-sm text-gray-600">{metric.insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Communication Effectiveness
  function CommunicationMetrics() {
    if (!data?.communicationMetrics?.length) {
      return (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-red-600" />
              Communication Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No communication metrics available</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-red-600" />
            Communication Effectiveness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.communicationMetrics.map((metric) => (
              <div key={metric.type} className="space-y-2">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{metric.type}</h3>
                    <p className="text-sm text-gray-500">{metric.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-sm ${
                    metric.score >= 4 ? 'bg-green-100 text-green-800' :
                    metric.score >= 3 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Score: {metric.score.toFixed(1)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-xl h-2">
                  <div
                    className="bg-red-600 rounded-xl h-2 transition-all duration-500"
                    style={{ width: `${(metric.score / 5) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-gray-500">
                  Feedback: {metric.feedback}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Shift Team Analysis
  function ShiftTeamAnalysis() {
    if (!data?.shiftTeams?.length) {
      return (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="w-5 h-5 text-red-600" />
              Shift Team Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No shift team data available</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-red-600" />
            Shift Team Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.shiftTeams.map((shift) => (
            <div key={shift.id} className="mb-6 last:mb-0">
              <h3 className="font-medium mb-3">{shift.name}</h3>
              <div className="space-y-4">
                {/* Team Strength Indicators */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl text-center">
                    <div className="text-2xl font-semibold text-red-600">
                      {shift.teamwork}%
                    </div>
                    <div className="text-sm text-gray-600">Teamwork</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl text-center">
                    <div className="text-2xl font-semibold text-red-600">
                      {shift.efficiency}%
                    </div>
                    <div className="text-sm text-gray-600">Efficiency</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl text-center">
                    <div className="text-2xl font-semibold text-red-600">
                      {shift.morale}%
                    </div>
                    <div className="text-sm text-gray-600">Team Morale</div>
                  </div>
                </div>
                
                {/* Team Highlights */}
                <div className="border rounded-xl p-4">
                  <h4 className="font-medium mb-2">Team Highlights</h4>
                  {shift.highlights.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">No highlights available</p>
                  ) : (
                    <ul className="space-y-2">
                      {shift.highlights.map((highlight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Star className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                          <span className="text-sm">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Areas for Improvement */}
                <div className="border rounded-xl p-4">
                  <h4 className="font-medium mb-2">Growth Opportunities</h4>
                  {shift.improvements.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">No improvements needed</p>
                  ) : (
                    <ul className="space-y-2">
                      {shift.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Target className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                          <span className="text-sm">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Mentorship Tracking
  function MentorshipTracking() {
    if (!data?.mentorships?.length) {
      return (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-red-600" />
              Mentorship Program
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No mentorship data available</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-red-600" />
            Mentorship Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.mentorships.map((relationship) => (
              <div key={relationship.id} className="border rounded-xl p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium">
                      {relationship.mentor} → {relationship.mentee}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Started {new Date(relationship.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-xl text-sm ${
                    relationship.status === 'Active' ? 'bg-green-100 text-green-800' :
                    relationship.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {relationship.status}
                  </span>
                </div>

                {/* Progress Tracking */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Goals Completed</span>
                      <span>{relationship.goalsCompleted}/{relationship.totalGoals}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-xl h-2">
                      <div
                        className="bg-red-600 rounded-xl h-2 transition-all duration-500"
                        style={{ width: `${(relationship.goalsCompleted / relationship.totalGoals) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Recent Achievements */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Recent Achievements</h4>
                    {relationship.achievements.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">No recent achievements</p>
                    ) : (
                      <ul className="space-y-2">
                        {relationship.achievements.map((achievement, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Award className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                            <span className="text-sm">{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
}