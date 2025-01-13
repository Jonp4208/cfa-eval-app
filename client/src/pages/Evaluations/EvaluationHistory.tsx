// client/src/pages/Evaluations/EvaluationHistory.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, FileText, Download, TrendingUp, Calendar } from 'lucide-react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, ResponsiveContainer } from 'recharts';
import api from '../../lib/axios';
import { generatePDF } from '@/utils/PdfExport';

interface HistoricalEvaluation {
  id: string;
  date: string;
  evaluator: {
    name: string;
  };
  template: {
    name: string;
  };
  ratings: Record<string, {
    rating: number;
    comment: string;
  }>;
  overallScore: number;
}

export function EvaluationHistory({ employeeId }: { employeeId: string }) {
  const [timeframe, setTimeframe] = useState('year'); // year, quarter, all

  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['evaluationHistory', employeeId, timeframe],
    queryFn: async () => {
      try {
        const response = await api.get(`/api/evaluations/history/${employeeId}?timeframe=${timeframe}`);
        return response.data;
      } catch (error) {
        throw error;
      }
    }
  });

  // Process data for trend analysis
  const trendData = evaluations?.map((evaluation: HistoricalEvaluation) => ({
    date: new Date(evaluation.date).toLocaleDateString(),
    score: evaluation.overallScore
  }));

  // Calculate averages and improvements
  const calculateMetrics = (evals: HistoricalEvaluation[]) => {
    if (!evals?.length) return null;

    const averageScore = evals.reduce((acc, curr) => acc + curr.overallScore, 0) / evals.length;
    const improvement = evals[evals.length - 1]?.overallScore - evals[0]?.overallScore;

    return {
      averageScore: averageScore.toFixed(1),
      improvement: improvement.toFixed(1),
      totalEvaluations: evals.length
    };
  };

  const metrics = calculateMetrics(evaluations || []);

  const exportToPDF = async (evaluation: HistoricalEvaluation) => {
    try {
      const response = await api.get(`/api/evaluations/${evaluation.id}`);
      const fullEvaluation = response.data;
      
      const pdfBlob = await generatePDF(fullEvaluation);
      const url = URL.createObjectURL(pdfBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `Evaluation_${evaluation.date}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-semibold mt-1">{metrics?.averageScore}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Improvement</p>
                <p className="text-2xl font-semibold mt-1">
                  {Number(metrics?.improvement) > 0 ? '+' : ''}{metrics?.improvement}
                </p>
              </div>
              <History className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Evaluations</p>
                <p className="text-2xl font-semibold mt-1">{metrics?.totalEvaluations}</p>
              </div>
              <FileText className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Performance Trend</CardTitle>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="p-2 border rounded-md"
            >
              <option value="year">Past Year</option>
              <option value="quarter">Past Quarter</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#dc2626" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation List */}
      <Card>
        <CardHeader>
          <CardTitle>Past Evaluations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : evaluations?.map((evaluation: HistoricalEvaluation) => (
              <div 
                key={evaluation.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{evaluation.template.name}</p>
                  <p className="text-sm text-gray-500">
                    By {evaluation.evaluator.name} • {new Date(evaluation.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">Score</p>
                    <p className="text-sm text-gray-500">{evaluation.overallScore}/5</p>
                  </div>
                  <button
                    onClick={() => exportToPDF(evaluation)}
                    className="p-2 text-gray-500 hover:text-red-600"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}