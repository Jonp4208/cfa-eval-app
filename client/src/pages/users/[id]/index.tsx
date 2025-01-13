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
  ArrowLeft
} from 'lucide-react';
import api from '@/lib/axios';
import Draggable from 'react-draggable';

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
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => navigate(currentUser?._id === profile._id ? '/' : '/users')}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        {currentUser?._id === profile._id ? 'Back to Dashboard' : 'Back to Users'}
      </Button>

      {/* Header with Basic Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold mb-1">{profile.name}</h1>
              <p className="text-gray-500">
                <span className="uppercase">{profile.position} • {profile.department}</span>
                {profile.manager && (
                  <>
                    <span className="mx-2">|</span>
                    <span>Manager: {profile.manager.name}</span>
                  </>
                )}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-4">
              {isAdmin && (
                <div className="min-w-[200px]">
                  <label className="text-sm font-medium text-gray-500 block mb-1">Manager</label>
                  <select
                    value={selectedManagerId}
                    onChange={(e) => {
                      setSelectedManagerId(e.target.value);
                      updateManager.mutate(e.target.value);
                    }}
                    className="w-full p-2 border rounded-md"
                    disabled={loadingManagers || updateManager.isPending}
                  >
                    <option value="">No Manager Assigned</option>
                    {potentialManagers?.map((manager: any) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.name} ({manager.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <span className={`px-3 py-1 rounded-full text-sm ${
                profile.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {profile.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
            </div>
            
            {profile.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{new Date(profile.startDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid grid-cols-4 gap-4 bg-muted p-1">
          <TabsTrigger 
            value="performance" 
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            <Activity className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger 
            value="development"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Development
          </TabsTrigger>
          <TabsTrigger 
            value="documentation"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Documentation
          </TabsTrigger>
          <TabsTrigger 
            value="metrics"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            <Activity className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="grid gap-6">
            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={profile.metrics?.evaluationScores || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString()}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#dc2626" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Evaluations */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Evaluations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.evaluations?.map((evaluation: Evaluation, index: number) => (
                    <Card key={evaluation.id || index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-medium">{evaluation.type}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(evaluation.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-semibold">{evaluation.score}%</span>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Strengths
                            </h5>
                            <ul className="list-disc pl-4 text-sm text-gray-600 space-y-1">
                              {evaluation.strengths?.map((strength: string, i: number) => (
                                <li key={i}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Target className="w-4 h-4 text-blue-500" />
                              Areas for Improvement
                            </h5>
                            <ul className="list-disc pl-4 text-sm text-gray-600 space-y-1">
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

        {/* Development Tab */}
        <TabsContent value="development">
          <div className="grid gap-6">
            {/* Development Goals */}
            <Card>
              <CardHeader>
                <CardTitle>Development Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.development?.map((goal: Goal, index: number) => (
                    <Card key={goal.id || index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-medium">{goal.goal}</h4>
                            <p className="text-sm text-gray-500">
                              Target: {new Date(goal.targetDate).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-sm ${
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
                              <span>Progress</span>
                              <span>{goal.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-red-600 h-2 rounded-full" 
                                style={{ width: `${goal.progress}%` }}
                              />
                            </div>
                          </div>
                          
                          {goal.notes?.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium mb-2">Progress Notes</h5>
                              <ul className="space-y-2">
                                {goal.notes?.map((note: string, i: number) => (
                                  <li key={i} className="text-sm text-gray-600">
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

        {/* Documentation Tab */}
        <TabsContent value="documentation">
          <div className="grid gap-6">
            {/* Documents List */}
            <Card>
              <CardHeader>
                <CardTitle>Document History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.documentation?.map((doc: Document, index: number) => (
                    <Card key={doc.id || index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {doc.type === 'review' && <ClipboardList className="w-4 h-4 text-blue-500" />}
                              {doc.type === 'disciplinary' && <AlertCircle className="w-4 h-4 text-red-500" />}
                              {doc.type === 'coaching' && <BookOpen className="w-4 h-4 text-green-500" />}
                              <h4 className="font-medium">{doc.title}</h4>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(doc.date).toLocaleDateString()} • By {doc.createdBy}
                            </p>
                            <p className="text-sm mt-2">{doc.description}</p>
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

        {/* Analytics Tab */}
        <TabsContent value="metrics">
          <div className="grid gap-6">
            {/* Key Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      {profile.metrics?.trainingCompletion || 0}%
                    </div>
                    <p className="text-sm text-gray-500 text-center">Training Completion Rate</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      {profile.metrics?.goalAchievement || 0}%
                    </div>
                    <p className="text-sm text-gray-500 text-center">Goal Achievement Rate</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      {profile.metrics?.leadershipScore || 0}%
                    </div>
                    <p className="text-sm text-gray-500 text-center">Leadership Score</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Hearts & Hands Quadrant */}
            <Card>
              <CardHeader>
                <CardTitle>Hearts & Hands Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-[500px] mx-auto">
                  <div className="aspect-square relative bg-white p-4 mt-8">
                    {/* Y-axis Label */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-gray-500 font-medium">
                      Engagement & Commitment
                    </div>
                    
                    {/* X-axis Label */}
                    <div className="absolute -right-32 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium rotate-90">
                      Skills & Abilities
                    </div>

                    <div 
                      className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 relative" 
                      ref={dragContainerRef}
                    >
                      {/* Top Left Quadrant */}
                      <div className="bg-yellow-100 rounded-tl-lg border border-gray-200"></div>
                      {/* Top Right Quadrant */}
                      <div className="bg-green-100 rounded-tr-lg border border-gray-200"></div>
                      {/* Bottom Left Quadrant */}
                      <div className="bg-red-100 rounded-bl-lg border border-gray-200"></div>
                      {/* Bottom Right Quadrant */}
                      <div className="bg-yellow-100 rounded-br-lg border border-gray-200"></div>

                      {/* Interactive Position Marker */}
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
                          className="w-8 h-8 bg-red-600 rounded-full cursor-move absolute flex items-center justify-center"
                        >
                          <span className="text-xs font-medium text-white">
                            {profile?.name.split(' ').map((name: string) => name[0]).join('')}
                          </span>
                        </div>
                      </Draggable>
                    </div>
                  </div>

                  {/* Position Update Form - Only visible to managers/admins */}
                  {(currentUser?.role === 'admin' || currentUser?._id === profile.manager?._id) && (
                    <div className="mt-4 space-y-4">
                      <div className="text-sm text-gray-500">
                        Drag the red dot to update the team member's position on the Hearts & Hands quadrant.
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={() => updateHeartsAndHandsMutation.mutate(heartsAndHandsPosition)}
                          disabled={updateHeartsAndHandsMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
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
  );
}