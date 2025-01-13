// client/src/pages/Analytics/TeamComparison.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { AnalyticsPageHeader } from './index';

type TimeframeValue = 'week' | 'month' | 'quarter' | 'year';
type SortValue = 'score' | 'improvement' | 'name';
type PositionValue = 'all' | 'cashier' | 'kitchen' | 'leader';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  score: number;
  improvement: number;
  categories: Record<string, number>;
  recentEvaluations: Array<{
    id: string;
    date: string;
    score: number;
  }>;
}

export function TeamComparison() {
  const [timeframe, setTimeframe] = useState<TimeframeValue>('month');
  const [sortBy, setSortBy] = useState<SortValue>('score');
  const [filterPosition, setFilterPosition] = useState<PositionValue>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['team-comparison', timeframe, sortBy, filterPosition],
    queryFn: async () => {
      try {
        const response = await api.get('/api/analytics/team', {
          params: { timeframe, sortBy, position: filterPosition }
        });
        return response.data;
      } catch (error) {
        throw new Error('Failed to fetch team comparison data');
      }
    }
  });

  const calculateImprovement = (current: number, previous: number) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const hasData = data?.members?.length > 0;

  return (
    <div className="space-y-6">
      <AnalyticsPageHeader title="Team Comparison" />

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              value={timeframe} 
              onValueChange={(value: string) => setTimeframe(value as TimeframeValue)}
            >
              <SelectTrigger className="w-full rounded-xl">
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
              value={sortBy} 
              onValueChange={(value: string) => setSortBy(value as SortValue)}
            >
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterPosition} 
              onValueChange={(value: string) => setFilterPosition(value as PositionValue)}
            >
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder="Filter position" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="kitchen">Kitchen</SelectItem>
                <SelectItem value="leader">Team Leader</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load team comparison data. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              <p className="text-gray-500">Loading team comparison data...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && !hasData && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <p>No team comparison data available for the selected filters.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Performance Grid */}
      {!isLoading && !error && hasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.members.map((member: TeamMember) => (
            <Card key={member.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-medium">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold">{member.score.toFixed(1)}</p>
                    <p className={`text-sm ${
                      member.improvement >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {member.improvement >= 0 ? '+' : ''}{member.improvement}%
                    </p>
                  </div>
                </div>

                {/* Category Scores */}
                <div className="space-y-2">
                  {Object.entries(member.categories).map(([category, score]) => (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{category}</span>
                        <span>{score.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 rounded-full h-2"
                          style={{ width: `${(score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Evaluations */}
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Recent Evaluations</h4>
                  <div className="space-y-2">
                    {member.recentEvaluations.map((evaluation) => (
                      <div key={evaluation.id} className="flex justify-between text-sm">
                        <span>{new Date(evaluation.date).toLocaleDateString()}</span>
                        <span className={evaluation.score >= 4 ? 'text-green-600' : 'text-red-600'}>
                          {evaluation.score.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}