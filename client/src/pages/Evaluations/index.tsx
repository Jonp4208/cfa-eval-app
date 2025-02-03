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
  Mail,
  Bell
} from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import api from '@/lib/axios';
import { handleError } from '@/lib/utils/error-handler';
import { toast } from '@/components/ui/use-toast';

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
  
  // Add debug logging
  console.log('User data:', {
    user,
    isAdmin: user?.isAdmin,
    position: user?.position
  });
  
  const [view, setView] = useState<'all' | 'pending' | 'completed'>(user?.position === 'Team Member' ? 'all' : 'pending');
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
      // Create and show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center';
      notification.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Evaluation deleted successfully</span>
      `;
      document.body.appendChild(notification);

      // Remove the notification after 3 seconds
      setTimeout(() => {
        notification.remove();
      }, 3000);

      refetch();
    },
    onError: (error: any) => {
      // Create and show error notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center';
      notification.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span>${error.response?.data?.message || 'Failed to delete evaluation'}</span>
      `;
      document.body.appendChild(notification);

      // Remove the notification after 3 seconds
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
  });

  // Add this with other mutations at the top of the component
  const sendUnacknowledgedNotification = useMutation({
    mutationFn: async (evaluationId: string) => {
      return api.post(`/api/evaluations/${evaluationId}/notify-unacknowledged`);
    },
    onSuccess: () => {
      // Create and show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg z-[9999] flex items-center transform transition-all duration-300 translate-y-0';
      notification.style.cssText = 'position: fixed; top: 1rem; right: 1rem; z-index: 9999;';
      notification.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Acknowledgement reminder sent successfully</span>
      `;
      document.body.appendChild(notification);

      // Add entrance animation
      requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
      });

      // Remove the notification after 3 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    },
    onError: (error: any) => {
      // Create and show error notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-xl shadow-lg z-[9999] flex items-center transform transition-all duration-300 translate-y-0';
      notification.style.cssText = 'position: fixed; top: 1rem; right: 1rem; z-index: 9999;';
      notification.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span>${error.response?.data?.message || 'Failed to send notification'}</span>
      `;
      document.body.appendChild(notification);

      // Add entrance animation
      requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
      });

      // Remove the notification after 3 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
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
      let shouldShow = true;

      // Status filter
      if (view === 'pending') {
        shouldShow = evaluation.status !== 'completed';
      } else if (view === 'completed') {
        shouldShow = evaluation.status === 'completed';
      }

      // Department filter
      if (shouldShow && departmentFilter !== 'all') {
        const employeeDepartment = evaluation.employee?.position?.split(' ')[0];
        shouldShow = employeeDepartment === departmentFilter;
      }

      // Search filter
      if (shouldShow && searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        shouldShow = evaluation.employee?.name?.toLowerCase().includes(searchLower) ||
                    evaluation.template?.name?.toLowerCase().includes(searchLower);
      }

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
    const isEmployee = user?._id === evaluation.employee?._id;
    const isManager = user?._id === evaluation.evaluator?._id;

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
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-4 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Performance Reviews</h1>
                <p className="text-white/80 mt-1 sm:mt-2 text-base sm:text-lg">Track and manage employee evaluations</p>
              </div>
              <Button 
                className="bg-white text-[#E51636] hover:bg-white/90 h-10 sm:h-12 px-4 sm:px-6 rounded-xl inline-flex items-center justify-center font-medium transition-colors"
                onClick={() => navigate('/evaluations/new')}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                New Evaluation
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white rounded-[20px] hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#27251F]/60 font-medium">Pending Reviews</p>
                  <h3 className="text-2xl font-bold mt-2 text-[#27251F]">
                    {evaluations?.filter((e: Evaluation) => e.status !== 'completed').length || 0}
                  </h3>
                </div>
                <div className="h-12 w-12 bg-[#E51636]/10 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-[#E51636]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-[20px] hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#27251F]/60 font-medium">In Review</p>
                  <h3 className="text-2xl font-bold mt-2 text-[#27251F]">
                    {evaluations?.filter((e: Evaluation) => e.status === 'in_review_session').length || 0}
                  </h3>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-[20px] hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#27251F]/60 font-medium">Completed</p>
                  <h3 className="text-2xl font-bold mt-2 text-[#27251F]">
                    {evaluations?.filter((e: Evaluation) => e.status === 'completed').length || 0}
                  </h3>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-[20px] hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#27251F]/60 font-medium">Unacknowledged</p>
                  <h3 className="text-2xl font-bold mt-2 text-[#27251F]">
                    {evaluations?.filter((e: Evaluation) => !e.acknowledgement?.acknowledged).length || 0}
                  </h3>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Bell className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white rounded-[20px] shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#27251F]/40 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search evaluations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent text-base"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={view === 'all' ? 'default' : 'outline'}
                  onClick={() => setView('all')}
                  className={`rounded-full ${
                    view === 'all' 
                      ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                      : 'hover:bg-[#E51636]/10 hover:text-[#E51636]'
                  }`}
                >
                  All Reviews
                </Button>
                <Button
                  variant={view === 'pending' ? 'default' : 'outline'}
                  onClick={() => setView('pending')}
                  className={`rounded-full ${
                    view === 'pending' 
                      ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                      : 'hover:bg-[#E51636]/10 hover:text-[#E51636]'
                  }`}
                >
                  Pending
                </Button>
                <Button
                  variant={view === 'completed' ? 'default' : 'outline'}
                  onClick={() => setView('completed')}
                  className={`rounded-full ${
                    view === 'completed' 
                      ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                      : 'hover:bg-[#E51636]/10 hover:text-[#E51636]'
                  }`}
                >
                  Completed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evaluations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E51636]" />
            </div>
          ) : filteredEvaluations?.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-[#27251F]/60">No evaluations found</p>
            </div>
          ) : (
            filteredEvaluations?.sort(sortEvaluations).map((evaluation: Evaluation) => (
              <Card
                key={evaluation._id}
                className="bg-white rounded-[20px] hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/evaluations/${evaluation._id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-[#27251F]">{evaluation.employee.name}</h3>
                      <p className="text-sm text-[#27251F]/60">{evaluation.employee.position}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      evaluation.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : evaluation.status === 'in_review_session'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {evaluation.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#27251F]/60">Template:</span>
                      <span className="font-medium text-[#27251F]">{evaluation.template.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#27251F]/60">Scheduled:</span>
                      <span className="font-medium text-[#27251F]">
                        {new Date(evaluation.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#27251F]/60">Evaluator:</span>
                      <span className="font-medium text-[#27251F]">{evaluation.evaluator.name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}