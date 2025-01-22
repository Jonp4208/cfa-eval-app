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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading team scores...</div>
            </CardContent>
          </Card>
        </div>
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
            <h1 className="text-3xl md:text-4xl font-bold">Team Performance Scores</h1>
            <p className="text-white/80 mt-2 text-lg">
              Overview of all team members' evaluation scores
            </p>
          </div>
        </div>

        {/* Scores Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team Member Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Average Score</TableHead>
                  <TableHead className="text-right">Recent Score</TableHead>
                  <TableHead className="text-right"># of Evaluations</TableHead>
                  <TableHead>Last Evaluation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.position}</TableCell>
                    <TableCell>{member.department}</TableCell>
                    <TableCell className={`text-right font-medium ${getScoreColor(member.averageScore)}`}>
                      {formatScore(member.averageScore)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${getScoreColor(member.recentScore)}`}>
                      <div>{member.recentPoints || "N/A"}</div>
                      <div className="text-sm text-[#27251F]/60">{formatScore(member.recentScore)}</div>
                    </TableCell>
                    <TableCell className="text-right">{member.numberOfEvaluations}</TableCell>
                    <TableCell>
                      {member.recentEvaluationDate
                        ? new Date(member.recentEvaluationDate).toLocaleDateString()
                        : "N/A"}
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