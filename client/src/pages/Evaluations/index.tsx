import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  FileText, 
  Users, 
  Trash2, 
  Calendar, 
  ArrowUpDown, 
  Filter, 
  AlertTriangle,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Mail
} from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import api from '@/lib/axios';
import { handleError } from '@/lib/utils/error-handler';

interface Evaluation {
  _id: string;
  employee: {
    _id: string;
    name: string;
    position: string;
  };
  evaluator: {
    _id: string;
    name: string;
  };
  template: {
    _id: string;
    name: string;
  };
  status: 'pending_self_evaluation' | 'pending_manager_review' | 'in_review_session' | 'completed';
  scheduledDate: string;
  reviewSessionDate?: string;
  completedDate?: string;
  acknowledgement?: {
    acknowledged: boolean;
    date: string;
  };
}

type SortField = 'date' | 'name' | 'status';
type SortOrder = 'asc' | 'desc';

interface Department {
  value: string;
  label: string;
}

export default function Evaluations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [view, setView] = useState<'all' | 'pending' | 'completed'>('pending');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch evaluations
  const { data: evaluations, isLoading, error, refetch } = useQuery({
    queryKey: ['evaluations'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/evaluations');
        console.log('Raw API response:', response);
        console.log('Fetched evaluations:', response.data.evaluations);
        console.log('Current user:', user);
        return response.data.evaluations;
      } catch (error: any) {
        console.error('Error fetching evaluations:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch evaluations');
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 30000
  });

  // Delete evaluation mutation
  const deleteEvaluation = useMutation({
    mutationFn: async (evaluationId: string) => {
      await api.delete(`/api/evaluations/${evaluationId}`);
    },
    onSuccess: () => {
      showNotification({
        type: 'success',
        message: 'Evaluation Deleted',
      });
      refetch();
    },
    onError: (error: any) => {
      showNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete evaluation',
      });
    }
  });

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>, evaluationId: string) => {
    e.stopPropagation(); // Prevent card click navigation
    if (window.confirm('Are you sure you want to delete this evaluation?')) {
      deleteEvaluation.mutate(evaluationId);
    }
  };

  const departments: Department[] = [...new Set(evaluations?.map((evaluation: Evaluation) => evaluation.employee?.position?.split(' ')[0]) || [])]
    .filter((dept): dept is string => Boolean(dept))
    .map(dept => ({ value: dept, label: dept }));

  const sortEvaluations = (a: Evaluation, b: Evaluation) => {
    switch (sortField) {
      case 'date':
        return sortOrder === 'asc'
          ? new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
          : new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
      case 'name':
        return sortOrder === 'asc'
          ? (a.employee?.name || '').localeCompare(b.employee?.name || '')
          : (b.employee?.name || '').localeCompare(a.employee?.name || '');
      case 'status':
        return sortOrder === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      default:
        return 0;
    }
  };

  const filteredEvaluations = evaluations
    ?.filter((evaluation: Evaluation) => {
      console.log('Processing evaluation:', {
        id: evaluation._id,
        employee: evaluation.employee?.name,
        status: evaluation.status,
        view,
        departmentFilter,
        searchQuery
      });

      let shouldShow = true;

      // Status filter
      if (view === 'pending') {
        shouldShow = evaluation.status !== 'completed';
      } else if (view === 'completed') {
        shouldShow = evaluation.status === 'completed';
      }
      
      console.log('After status filter:', { shouldShow });

      // Department filter
      if (shouldShow && departmentFilter !== 'all') {
        const employeeDepartment = evaluation.employee?.position?.split(' ')[0];
        shouldShow = employeeDepartment === departmentFilter;
        console.log('After department filter:', { employeeDepartment, departmentFilter, shouldShow });
      }

      // Search filter
      if (shouldShow && searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        shouldShow = evaluation.employee?.name?.toLowerCase().includes(searchLower) ||
                    evaluation.template?.name?.toLowerCase().includes(searchLower);
        console.log('After search filter:', { searchQuery, shouldShow });
      }

      console.log('Final decision for evaluation:', { id: evaluation._id, shouldShow });
      return shouldShow;
    })
    .sort(sortEvaluations);

  // Debug log for final filtered results
  console.log('Final filtered evaluations:', {
    total: evaluations?.length || 0,
    filtered: filteredEvaluations?.length || 0,
    view,
    departmentFilter,
    searchQuery
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending_self_evaluation':
        return 'bg-blue-100 text-blue-800';
      case 'pending_manager_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_review_session':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplay = (evaluation: Evaluation) => {
    const status = evaluation.status.replace(/_/g, ' ');
    const isEmployee = user?._id === evaluation.employee._id;
    const isManager = user?._id === evaluation.evaluator._id;

    switch (evaluation.status) {
      case 'pending_self_evaluation':
        return isEmployee ? 'Action Required: Self-Evaluation' : 'Awaiting Self-Evaluation';
      case 'pending_manager_review':
        return isManager ? 'Action Required: Schedule Review' : 'Pending Manager Review';
      case 'in_review_session':
        return isManager ? 'Action Required: Complete Review' : 'In Review Session';
      case 'completed':
        return evaluation.acknowledgement?.acknowledged 
          ? 'Completed & Acknowledged'
          : isEmployee 
            ? 'Action Required: Acknowledge'
            : 'Completed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getDueStatus = (date: string, status: string, completedDate?: string) => {
    if (status === 'completed' && completedDate) {
      return { text: `Completed ${new Date(completedDate).toLocaleDateString()}`, class: 'text-green-600' };
    }

    const dueDate = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', class: 'text-red-600' };
    if (diffDays <= 7) return { text: `Due in ${diffDays} days`, class: 'text-yellow-600' };
    return { text: `Due in ${diffDays} days`, class: 'text-gray-500' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_self_evaluation':
        return Clock;
      case 'pending_manager_review':
        return AlertCircle;
      case 'in_review_session':
        return Users;
      case 'completed':
        return CheckCircle2;
      default:
        return AlertTriangle;
    }
  };

  const sendEvaluationEmail = async (evaluationId: string) => {
    try {
      const response = await api.post(`/api/evaluations/${evaluationId}/send-email`);
      
      if (!response.data) {
        throw new Error('Failed to send evaluation email');
      }
      
      showNotification(
        'success',
        'Email Sent',
        'Evaluation has been sent to the store email.'
      );
    } catch (error: any) {
      console.error('Error sending evaluation email:', error);
      showNotification(
        'error',
        'Email Failed',
        error.response?.data?.message || 'Failed to send evaluation email. Please try again.'
      );
    }
  };

  // Handle error state in the UI
  if (error instanceof Error) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="rounded-[20px] bg-white shadow-xl">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-[#E51636]" />
                </div>
                <h1 className="text-xl font-semibold mb-2 text-[#27251F]">Error Loading Evaluations</h1>
                <p className="text-[#27251F]/60 mb-6">There was a problem loading the evaluations. Please try again later.</p>
                <Button 
                  onClick={() => refetch()} 
                  variant="outline"
                  className="min-w-[120px]"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Evaluations</h1>
                <p className="text-white/80 mt-2 text-lg">Manage and track team performance</p>
              </div>
              <div className="flex flex-row gap-3">
                {user?.role === 'admin' && (
                  <Button 
                    variant="secondary"
                    className="bg-white/10 hover:bg-white/20 text-white border-0 h-12 px-6 flex-1 md:flex-none"
                    onClick={() => navigate('/templates')}
                  >
                    <FileText className="w-5 h-5" />
                    Manage Templates
                  </Button>
                )}
                <Button 
                  className="bg-white text-[#E51636] hover:bg-white/90 h-12 px-6 flex-1 md:flex-none"
                  onClick={() => navigate('/evaluations/new')}
                >
                  <Plus className="w-5 h-5" />
                  New Evaluation
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="bg-white rounded-[20px] shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search evaluations..."
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={view === 'all' ? 'default' : 'outline'}
                  onClick={() => setView('all')}
                  className={`h-10 px-4 md:px-8 rounded-full text-base md:text-lg font-medium ${
                    view === 'all' 
                      ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white border-0' 
                      : 'bg-white hover:bg-gray-50 text-[#27251F]'
                  }`}
                >
                  All
                </Button>
                <Button
                  variant={view === 'pending' ? 'default' : 'outline'}
                  onClick={() => setView('pending')}
                  className={`h-10 px-4 md:px-8 rounded-full text-base md:text-lg font-medium ${
                    view === 'pending' 
                      ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white border-0' 
                      : 'bg-white hover:bg-gray-50 text-[#27251F]'
                  }`}
                >
                  Pending
                </Button>
                <Button
                  variant={view === 'completed' ? 'default' : 'outline'}
                  onClick={() => setView('completed')}
                  className={`h-10 px-4 md:px-8 rounded-full text-base md:text-lg font-medium ${
                    view === 'completed' 
                      ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white border-0' 
                      : 'bg-white hover:bg-gray-50 text-[#27251F]'
                  }`}
                >
                  Completed
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-10 px-4 md:px-8 rounded-full text-base md:text-lg font-medium bg-white hover:bg-gray-50 text-[#27251F] flex items-center gap-2"
                  >
                    <Filter className="w-5 h-5" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2">
                    <h3 className="font-medium text-sm mb-2">Department</h3>
                    <select
                      className="w-full p-2 rounded-lg border border-gray-200"
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                    >
                      <option value="all">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Evaluations Grid */}
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            // Loading skeleton
            [...Array(3)].map((_, i) => (
              <Card key={i} className="bg-white rounded-[20px] shadow-md animate-pulse">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="h-6 w-48 bg-gray-200 rounded-md" />
                      <div className="h-4 w-32 bg-gray-200 rounded-md" />
                    </div>
                    <div className="h-10 w-24 bg-gray-200 rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredEvaluations?.length === 0 ? (
            // Empty state
            <Card className="bg-white rounded-[20px] shadow-md">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 bg-[#E51636]/10 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-[#E51636]" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2 text-[#27251F]">No Evaluations Found</h2>
                  <p className="text-[#27251F]/60 mb-6">No evaluations match your current filters.</p>
                  <Button onClick={() => navigate('/evaluations/new')}>
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Evaluation
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Evaluation cards
            filteredEvaluations?.map((evaluation: Evaluation) => {
              const StatusIcon = getStatusIcon(evaluation.status);
              const dueStatus = getDueStatus(evaluation.scheduledDate, evaluation.status, evaluation.completedDate);
              return (
                <Card 
                  key={evaluation._id}
                  className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/evaluations/${evaluation._id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-4">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                            evaluation.status === 'completed' 
                              ? 'bg-green-100' 
                              : evaluation.status === 'in_review_session'
                              ? 'bg-purple-100'
                              : 'bg-[#E51636]/10'
                          }`}>
                            {React.createElement(StatusIcon, { className: `w-6 h-6 ${
                              evaluation.status === 'completed'
                                ? 'text-green-600'
                                : evaluation.status === 'in_review_session'
                                ? 'text-purple-600'
                                : 'text-[#E51636]'
                            }` })}
                          </div>
                          <div>
                            <h3 className="font-medium text-[#27251F]">{evaluation.employee.name}</h3>
                            <p className="text-sm text-[#27251F]/60 mt-1">{evaluation.template.name}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Calendar className="w-4 h-4 text-[#27251F]/40" />
                              <span className={`text-sm ${dueStatus.class}`}>
                                {dueStatus.text}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span>{getStatusDisplay(evaluation)}</span>
                          </div>
                          {evaluation.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                sendEvaluationEmail(evaluation._id);
                              }}
                              title="Send evaluation to store email"
                              className="h-10 w-10 rounded-full text-[#E51636] hover:bg-[#E51636]/10 active:scale-95 transition-transform duration-100"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          {(user?._id === evaluation.evaluator._id) && evaluation.status !== 'completed' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDelete(e, evaluation._id)}
                              className="h-8 w-8 text-[#E51636] hover:text-[#E51636]/90 hover:bg-[#E51636]/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {(evaluation.status === 'pending_manager_review' || evaluation.status === 'in_review_session') && (
                        <div className="mt-auto flex justify-center md:justify-end">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                evaluation.status === 'pending_manager_review' 
                                  ? `/evaluations/${evaluation._id}?showSchedule=true`
                                  : `/evaluations/${evaluation._id}`
                              );
                            }}
                            className="bg-[#E51636] text-white hover:bg-[#E51636]/90 h-9 px-4 rounded-xl text-sm w-full md:w-auto"
                          >
                            {evaluation.status === 'pending_manager_review' ? 'Schedule Review' : 'Complete Review'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}