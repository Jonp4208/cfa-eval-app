import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  position: string;
  department: string;
  averageScore: number | null;
  numberOfEvaluations: number;
  recentScore: number | null;
  recentPoints: string | null;
  recentEvaluationDate: string | null;
}

interface TeamScoresResponse {
  teamMembers: TeamMember[];
}

export default function TeamScores() {
  const { data, isLoading } = useQuery<TeamScoresResponse>({
    queryKey: ["team-scores"],
    queryFn: async () => {
      const response = await api.get("/api/analytics/team-scores");
      return response.data;
    },
  });

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-gray-500";
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const formatScore = (score: number | null) => {
    if (score === null) return "N/A";
    return `${score.toFixed(2)}%`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      // Handle MongoDB date format which comes as a string
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      
      // Format the date - show only date without time
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };
      
      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (error) {
      console.error('Date formatting error:', error);
      return "N/A";
    }
  };

  const calculateTeamStats = () => {
    if (!data?.teamMembers.length) return { avgScore: null, totalEvals: 0 };
    
    const validScores = data.teamMembers.filter(m => m.averageScore !== null);
    const totalEvals = data.teamMembers.reduce((sum, m) => sum + m.numberOfEvaluations, 0);
    const avgScore = validScores.length 
      ? validScores.reduce((sum, m) => sum + (m.averageScore || 0), 0) / validScores.length 
      : null;

    return { avgScore, totalEvals };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E51636]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Team Performance Scores</h1>
                <p className="text-white/80 mt-2 text-lg">Overview of all team members' evaluation scores</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white rounded-[20px] shadow-md hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#27251F]/60 font-medium">Team Average</p>
                  <h3 className="text-3xl font-bold mt-2 text-[#27251F]">
                    {formatScore(calculateTeamStats().avgScore)}
                  </h3>
                </div>
                <div className="h-14 w-14 bg-[#E51636]/10 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-[#E51636]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-[20px] shadow-md hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#27251F]/60 font-medium">Total Evaluations</p>
                  <h3 className="text-3xl font-bold mt-2 text-[#27251F]">
                    {calculateTeamStats().totalEvals}
                  </h3>
                </div>
                <div className="h-14 w-14 bg-[#E51636]/10 rounded-2xl flex items-center justify-center">
                  <Loader2 className="h-7 w-7 text-[#E51636]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scores Table */}
        <Card className="bg-white rounded-[20px] shadow-md hover:shadow-xl transition-all duration-300">
          <CardHeader className="border-b bg-white p-8">
            <CardTitle className="text-xl font-semibold text-[#27251F]">Team Member Scores</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-[#F4F4F4]">
                  <TableHead className="font-semibold text-[#27251F]/60">Name</TableHead>
                  <TableHead className="font-semibold text-[#27251F]/60">Position</TableHead>
                  <TableHead className="font-semibold text-[#27251F]/60">Department</TableHead>
                  <TableHead className="text-right font-semibold text-[#27251F]/60">Average Score</TableHead>
                  <TableHead className="text-right font-semibold text-[#27251F]/60">Recent Score</TableHead>
                  <TableHead className="text-right font-semibold text-[#27251F]/60"># of Evaluations</TableHead>
                  <TableHead className="font-semibold text-[#27251F]/60">Last Evaluation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.teamMembers.map((member) => (
                  <TableRow key={member.id} className="hover:bg-[#F4F4F4]">
                    <TableCell className="font-medium text-[#27251F]">{member.name}</TableCell>
                    <TableCell className="text-[#27251F]">{member.position}</TableCell>
                    <TableCell className="text-[#27251F]">{member.department}</TableCell>
                    <TableCell className={`text-right font-medium ${getScoreColor(member.averageScore)}`}>
                      {formatScore(member.averageScore)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${getScoreColor(member.recentScore)}`}>
                      <div>{member.recentPoints || "N/A"}</div>
                      <div className="text-sm text-[#27251F]/60">{formatScore(member.recentScore)}</div>
                    </TableCell>
                    <TableCell className="text-right text-[#27251F]">{member.numberOfEvaluations}</TableCell>
                    <TableCell className="text-[#27251F]">
                      {formatDate(member.recentEvaluationDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 