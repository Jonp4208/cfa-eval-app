// client/src/pages/users/[id]/index.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  User, Mail, Phone, Calendar, Award, 
  TrendingUp, ClipboardList, Star, 
  FileText, AlertCircle, BookOpen,
  CheckCircle, Activity, Target,
  ArrowLeft, Pencil
} from 'lucide-react';
import api from '@/lib/axios';
import Draggable from 'react-draggable';
import disciplinaryService from '@/services/disciplinaryService';

interface Evaluation {
  id?: string;
  date: string;
  score: number;
  type: string;
  strengths: string[];
  improvements: string[];
}

interface Goal {
  id?: string;
  goal: string;
  status: 'not-started' | 'in-progress' | 'completed';
  targetDate: string;
  progress: number;
  notes: string[];
}

interface Document {
  id?: string;
  type: 'review' | 'disciplinary' | 'coaching';
  date: string;
  title: string;
  description: string;
  createdBy: string;
}

interface Metrics {
  evaluationScores: Array<{
    date: string;
    score: number;
  }>;
  trainingCompletion: number;
  goalAchievement: number;
  leadershipScore: number;
  heartsAndHands?: {
    x: number;
    y: number;
  };
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  role: string;
  status: 'active' | 'inactive';
  store: {
    _id: string;
    name: string;
    storeNumber: string;
  };
  manager?: {
    _id: string;
    name: string;
  };
  startDate: string;
  evaluations?: Evaluation[];
  development?: Goal[];
  documentation?: Document[];
  metrics?: Metrics;
}

interface DisciplinaryIncident {
  _id: string;
  date: string;
  type: string;
  severity: string;
  status: string;
  description: string;
  actionTaken: string;
  createdBy: {
    name: string;
  };
  supervisor: {
    name: string;
  };
}

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const dragContainerRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [heartsAndHandsPosition, setHeartsAndHandsPosition] = useState({
    x: 50,
    y: 50
  });
  const [disciplinaryIncidents, setDisciplinaryIncidents] = useState<DisciplinaryIncident[]>([]);

  // Fetch user data
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      try {
        console.log('Fetching user with ID:', id);
        const response = await api.get(`/api/users/${id}`);
        console.log('User API Response:', response.data);
        return response.data;
      } catch (error: any) {
        console.error('Error fetching user:', error);
        throw error;
      }
    }
  });

  // Update positions when profile data changes
  useEffect(() => {
    const initializePosition = () => {
      if (profile?.metrics?.heartsAndHands && dragContainerRef.current) {
        const rect = dragContainerRef.current.getBoundingClientRect();
        const dotSize = 32;
        const savedPosition = profile.metrics.heartsAndHands;

        console.log('Initializing position with:', savedPosition);
        
        // Force set both positions
        setHeartsAndHandsPosition(savedPosition);
        setPosition({
          x: (savedPosition.x / 100) * (rect.width - dotSize),
          y: ((100 - savedPosition.y) / 100) * (rect.height - dotSize)
        });

        setContainerSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    // Try multiple times to ensure initialization
    const timeoutId = setTimeout(initializePosition, 100);
    const intervalId = setInterval(initializePosition, 500);

    // Clean up after 2 seconds
    const cleanupId = setTimeout(() => {
      clearInterval(intervalId);
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(cleanupId);
      clearInterval(intervalId);
    };
  }, [profile?.metrics?.heartsAndHands]);

  // Remove the separate pixel position effect since we're handling it in the initialization
  useEffect(() => {
    const handleResize = () => {
      if (dragContainerRef.current && profile?.metrics?.heartsAndHands) {
        const rect = dragContainerRef.current.getBoundingClientRect();
        const dotSize = 32;
        const savedPosition = profile.metrics.heartsAndHands;
        
        setPosition({
          x: (savedPosition.x / 100) * (rect.width - dotSize),
          y: ((100 - savedPosition.y) / 100) * (rect.height - dotSize)
        });

        setContainerSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [profile?.metrics?.heartsAndHands]);

  // Update Hearts & Hands position
  const updateHeartsAndHandsMutation = useMutation({
    mutationFn: async (position: { x: number; y: number }) => {
      console.log('Saving position:', position);
      const response = await api.patch(`/api/users/${id}/metrics`, {
        heartsAndHands: position
      });
      console.log('Save response:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Save successful, new data:', data);
      toast({
        title: "Success",
        description: "Position updated successfully",
      });
      // Explicitly refetch to ensure we have latest data
      refetch();
    },
    onError: (error: any) => {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update position",
        variant: "destructive",
      });
      // Reset position on error
      if (profile?.metrics?.heartsAndHands) {
        setHeartsAndHandsPosition(profile.metrics.heartsAndHands);
      }
    }
  });

  // Fetch potential managers
  const { data: potentialManagers, isLoading: loadingManagers } = useQuery({
    queryKey: ['potential-managers', profile?.store?._id],
    queryFn: async () => {
      try {
        if (!profile?.store?._id) {
          return [];
        }
        const response = await api.get('/api/users', {
          params: {
            role: ['manager', 'admin'],
            store: profile.store._id,
            excludeId: id
          }
        });
        return response.data.users || [];
      } catch (error) {
        console.error('Error fetching potential managers:', error);
        return [];
      }
    },
    enabled: !!profile?.store?._id && currentUser?.role === 'admin'
  });

  // Update manager mutation
  const updateManager = useMutation({
    mutationFn: async (managerId: string) => {
      const response = await api.patch(`/api/users/${id}`, {
        managerId: managerId || null
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Manager updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update manager',
        variant: 'destructive',
      });
    }
  });

  // Set initial selected manager
  useEffect(() => {
    if (profile?.manager?._id) {
      setSelectedManagerId(profile.manager._id);
    }
  }, [profile]);

  // Add this new effect to fetch disciplinary incidents
  useEffect(() => {
    const fetchDisciplinaryIncidents = async () => {
      try {
        console.log('Fetching disciplinary incidents for user:', id);
        const data = await disciplinaryService.getEmployeeIncidents(id as string);
        console.log('Disciplinary incidents data:', data);
        setDisciplinaryIncidents(data);
      } catch (error) {
        console.error('Error fetching disciplinary incidents:', error);
      }
    };

    if (id) {
      fetchDisciplinaryIncidents();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 space-y-4">
        <Button
          variant="outline"
          onClick={() => navigate('/users')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Button>
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-semibold text-red-600">User not found</h1>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="bg-[#F4F4F4] min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] p-8 rounded-[20px] shadow-xl relative overflow-hidden mx-6 mt-6">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold text-white mb-2">{profile.name}</h1>
              <p className="text-white/60">View and manage user profile details</p>
            </div>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/users/${id}/edit`)}
                  className="w-fit bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Profile
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={() => navigate(currentUser?._id === profile._id ? '/' : '/users')}
                className="w-fit bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {currentUser?._id === profile._id ? 'Back to Dashboard' : 'Back to Users'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Basic Info Card */}
        <Card className="bg-white rounded-[20px] shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <p className="text-[#27251F]/60 uppercase">
                  {profile.position} • {profile.departments.join(', ')}
                  {profile.manager && (
                    <>
                      <span className="mx-2">|</span>
                      <span>Manager: {profile.manager.name}</span>
                    </>
                  )}
                  <span className="mx-2">|</span>
                  <span className={`inline-block px-3 py-1 rounded-xl text-sm font-medium ${
                    profile.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {profile.status}
                  </span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#E51636]/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#E51636]" />
                </div>
                <div>
                  <p className="text-sm text-[#27251F]/60">Email</p>
                  <p className="font-medium text-[#27251F]">{profile.email}</p>
                </div>
              </div>
              
              {profile.phone && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#E51636]/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#E51636]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#27251F]/60">Phone</p>
                    <p className="font-medium text-[#27251F]">{profile.phone}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#E51636]/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#E51636]" />
                </div>
                <div>
                  <p className="text-sm text-[#27251F]/60">Start Date</p>
                  <p className="font-medium text-[#27251F]">{new Date(profile.startDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="bg-white rounded-xl p-1 flex flex-nowrap overflow-x-auto">
            <TabsTrigger 
              value="performance" 
              className="flex-1 data-[state=active]:bg-[#E51636] data-[state=active]:text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger 
              value="development"
              className="flex-1 data-[state=active]:bg-[#E51636] data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Development
            </TabsTrigger>
            <TabsTrigger 
              value="documentation"
              className="flex-1 data-[state=active]:bg-[#E51636] data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Documentation
            </TabsTrigger>
            <TabsTrigger 
              value="metrics"
              className="flex-1 data-[state=active]:bg-[#E51636] data-[state=active]:text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Performance Tab Content */}
          <TabsContent value="performance">
            <div className="grid gap-6">
              <Card className="bg-white rounded-[20px] shadow-md">
                <CardHeader className="pb-0">
                  <CardTitle className="text-[#27251F] text-xl">Performance Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={profile.metrics?.evaluationScores || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27251F/10" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString()}
                          stroke="#27251F/60"
                        />
                        <YAxis domain={[0, 100]} stroke="#27251F/60" />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#E51636" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-[20px] shadow-md">
                <CardHeader className="pb-0">
                  <CardTitle className="text-[#27251F] text-xl">Recent Evaluations</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {profile.evaluations?.map((evaluation: Evaluation, index: number) => (
                      <Card key={evaluation.id || index} className="bg-white rounded-xl shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-medium text-[#27251F]">{evaluation.type}</h4>
                              <p className="text-sm text-[#27251F]/60">
                                {new Date(evaluation.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-semibold text-[#E51636]">{evaluation.score}%</span>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="text-sm font-medium mb-2 flex items-center gap-2 text-[#27251F]">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Strengths
                              </h5>
                              <ul className="list-disc pl-4 text-sm text-[#27251F]/60 space-y-1">
                                {evaluation.strengths?.map((strength: string, i: number) => (
                                  <li key={i}>{strength}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h5 className="text-sm font-medium mb-2 flex items-center gap-2 text-[#27251F]">
                                <Target className="w-4 h-4 text-[#E51636]" />
                                Areas for Improvement
                              </h5>
                              <ul className="list-disc pl-4 text-sm text-[#27251F]/60 space-y-1">
                                {evaluation.improvements?.map((improvement: string, i: number) => (
                                  <li key={i}>{improvement}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Development Tab Content */}
          <TabsContent value="development">
            <div className="grid gap-6">
              <Card className="bg-white rounded-[20px] shadow-md">
                <CardHeader className="pb-0">
                  <CardTitle className="text-[#27251F] text-xl">Development Goals</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {profile.development?.map((goal: Goal, index: number) => (
                      <Card key={goal.id || index} className="bg-white rounded-xl shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-medium text-[#27251F]">{goal.goal}</h4>
                              <p className="text-sm text-[#27251F]/60">
                                Target: {new Date(goal.targetDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-xl text-sm font-medium ${
                              goal.status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : goal.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {goal.status}
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-[#27251F]/60">Progress</span>
                                <span className="text-[#27251F]">{goal.progress}%</span>
                              </div>
                              <div className="w-full bg-[#27251F]/10 rounded-full h-2">
                                <div 
                                  className="bg-[#E51636] h-2 rounded-full" 
                                  style={{ width: `${goal.progress}%` }}
                                />
                              </div>
                            </div>
                            
                            {goal.notes?.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium mb-2 text-[#27251F]">Progress Notes</h5>
                                <ul className="space-y-2">
                                  {goal.notes?.map((note: string, i: number) => (
                                    <li key={i} className="text-sm text-[#27251F]/60">
                                      {note}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documentation Tab Content */}
          <TabsContent value="documentation">
            <div className="grid gap-6">
              {/* Disciplinary Incidents Section */}
              <Card className="bg-white rounded-[20px] shadow-md">
                <CardHeader className="pb-0">
                  <CardTitle className="text-[#27251F] text-xl">Disciplinary Incidents</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {disciplinaryIncidents.map((incident) => (
                      <Card key={incident._id} className="bg-white rounded-xl shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-[#E51636]" />
                                <h4 className="font-medium text-[#27251F]">{incident.type}</h4>
                              </div>
                              <p className="text-sm text-[#27251F]/60">
                                {new Date(incident.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm ${
                                incident.status === 'Open' ? 'bg-yellow-100 text-yellow-800' :
                                incident.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {incident.status}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm ${
                                incident.severity === 'Minor' ? 'bg-gray-100 text-gray-800' :
                                incident.severity === 'Moderate' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {incident.severity}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <h5 className="text-sm font-medium text-[#27251F]">Description</h5>
                              <p className="text-sm text-[#27251F]/60 mt-1">{incident.description}</p>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-[#27251F]">Action Taken</h5>
                              <p className="text-sm text-[#27251F]/60 mt-1">{incident.actionTaken}</p>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-[#27251F]/10">
                            <div className="flex justify-between items-center">
                              <div className="flex flex-wrap gap-2 text-sm text-[#27251F]/60">
                                <span>Issued by: {incident.createdBy.name}</span>
                                <span>•</span>
                                <span>Manager: {incident.supervisor.name}</span>
                              </div>
                              <Button
                                variant="outline"
                                className="flex items-center gap-2 text-[#E51636] hover:bg-[#E51636]/10"
                                onClick={() => navigate(`/disciplinary/${incident._id}`)}
                              >
                                <FileText className="w-4 h-4" />
                                View Write-up
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {disciplinaryIncidents.length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-[#27251F]/60">No disciplinary incidents on record</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-[20px] shadow-md">
                <CardHeader className="pb-0">
                  <CardTitle className="text-[#27251F] text-xl">Document History</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {profile.documentation?.map((doc: Document, index: number) => (
                      <Card key={doc.id || index} className="bg-white rounded-xl shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {doc.type === 'review' && <ClipboardList className="w-4 h-4 text-[#E51636]" />}
                                {doc.type === 'disciplinary' && <AlertCircle className="w-4 h-4 text-[#E51636]" />}
                                {doc.type === 'coaching' && <BookOpen className="w-4 h-4 text-[#E51636]" />}
                                <h4 className="font-medium text-[#27251F]">{doc.title}</h4>
                              </div>
                              <p className="text-sm text-[#27251F]/60">
                                {new Date(doc.date).toLocaleDateString()} • By {doc.createdBy}
                              </p>
                              <p className="text-sm mt-2 text-[#27251F]">{doc.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab Content */}
          <TabsContent value="metrics">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white rounded-[20px] shadow-md">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl font-bold text-[#E51636] mb-2">
                        {profile.metrics?.trainingCompletion || 0}%
                      </div>
                      <p className="text-sm text-[#27251F]/60 text-center">Training Completion Rate</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white rounded-[20px] shadow-md">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl font-bold text-[#E51636] mb-2">
                        {profile.metrics?.goalAchievement || 0}%
                      </div>
                      <p className="text-sm text-[#27251F]/60 text-center">Goal Achievement Rate</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white rounded-[20px] shadow-md">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl font-bold text-[#E51636] mb-2">
                        {profile.metrics?.leadershipScore || 0}%
                      </div>
                      <p className="text-sm text-[#27251F]/60 text-center">Leadership Score</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white rounded-[20px] shadow-md">
                <CardHeader className="pb-0">
                  <CardTitle className="text-[#27251F] text-xl">Hearts & Hands Assessment</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="max-w-[500px] mx-auto">
                    <div className="aspect-square relative bg-white p-4 mt-8">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-[#27251F]/60 font-medium">
                        Engagement & Commitment
                      </div>
                      
                      <div className="absolute -right-16 sm:-right-32 top-1/2 -translate-y-1/2 text-sm text-[#27251F]/60 font-medium rotate-90">
                        Skills & Abilities
                      </div>

                      <div 
                        className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 relative" 
                        ref={dragContainerRef}
                      >
                        <div className="bg-yellow-100 rounded-tl-lg border border-[#27251F]/10"></div>
                        <div className="bg-green-100 rounded-tr-lg border border-[#27251F]/10"></div>
                        <div className="bg-red-100 rounded-bl-lg border border-[#27251F]/10"></div>
                        <div className="bg-yellow-100 rounded-br-lg border border-[#27251F]/10"></div>

                        <Draggable 
                          bounds="parent"
                          nodeRef={draggableRef}
                          position={position}
                          onDrag={(e, data) => {
                            setPosition(data);
                            if (dragContainerRef.current) {
                              const rect = dragContainerRef.current.getBoundingClientRect();
                              const dotSize = 32;
                              const x = Math.max(0, Math.min(Math.round((data.x) / (rect.width - dotSize) * 100), 100));
                              const y = Math.max(0, Math.min(Math.round(100 - (data.y / (rect.height - dotSize) * 100)), 100));
                              setHeartsAndHandsPosition({ x, y });
                            }
                          }}
                          onStop={(e, data) => {
                            if (dragContainerRef.current) {
                              const rect = dragContainerRef.current.getBoundingClientRect();
                              const dotSize = 32;
                              const x = Math.max(0, Math.min(Math.round((data.x) / (rect.width - dotSize) * 100), 100));
                              const y = Math.max(0, Math.min(Math.round(100 - (data.y / (rect.height - dotSize) * 100)), 100));
                              setHeartsAndHandsPosition({ x, y });
                            }
                          }}
                        >
                          <div 
                            ref={draggableRef}
                            className="w-8 h-8 bg-[#E51636] rounded-full cursor-move absolute flex items-center justify-center"
                          >
                            <span className="text-xs font-medium text-white">
                              {profile?.name.split(' ').map((name: string) => name[0]).join('')}
                            </span>
                          </div>
                        </Draggable>
                      </div>
                    </div>

                    {(currentUser?.role === 'admin' || currentUser?._id === profile.manager?._id) && (
                      <div className="mt-4 space-y-4">
                        <div className="text-sm text-[#27251F]/60">
                          Drag the red dot to update the team member's position on the Hearts & Hands quadrant.
                        </div>
                        <div className="flex justify-end">
                          <Button
                            onClick={() => updateHeartsAndHandsMutation.mutate(heartsAndHandsPosition)}
                            disabled={updateHeartsAndHandsMutation.isPending}
                            className="bg-[#E51636] hover:bg-[#E51636]/90 text-white"
                          >
                            {updateHeartsAndHandsMutation.isPending ? (
                              <>
                                <span className="mr-2">Saving...</span>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                              </>
                            ) : (
                              'Save Position'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}