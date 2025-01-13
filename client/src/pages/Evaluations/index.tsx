import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, FileText, Users, Trash2, Calendar, ArrowUpDown, Filter, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  const { toast } = useToast();
  const [view, setView] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

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
      toast({
        title: 'Success',
        description: 'Evaluation deleted successfully',
        duration: 5000,
      });
      refetch();
    },
    onError: (error: any) => {
      handleError(error);
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
      // Status filter
      if (view === 'pending') {
        return evaluation.status !== 'completed';
      } 
      if (view === 'completed') {
        return evaluation.status === 'completed';
      }

      // Department filter
      if (departmentFilter !== 'all') {
        const employeeDepartment = evaluation.employee?.position?.split(' ')[0];
        if (employeeDepartment !== departmentFilter) {
          return false;
        }
      }

      return true;
    })
    .sort(sortEvaluations);

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

  const getDueStatus = (date: string) => {
    const dueDate = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', class: 'text-red-600' };
    if (diffDays <= 7) return { text: `Due in ${diffDays} days`, class: 'text-yellow-600' };
    return { text: `Due in ${diffDays} days`, class: 'text-gray-500' };
  };

  // Handle error state in the UI
  if (error instanceof Error) {
    handleError({ message: error.message });
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
              <h1 className="text-xl font-semibold mb-2">Error Loading Evaluations</h1>
              <p className="text-gray-600 mb-4">There was a problem loading the evaluations. Please try again later.</p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Evaluations</h1>
          <p className="text-gray-500">Manage and track evaluations</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user?.role === 'admin' && (
            <Button 
              variant="outline" 
              onClick={() => navigate('/templates')}
              className="border-red-200 hover:bg-red-50"
            >
              <FileText className="w-4 h-4 mr-2" />
              Manage Templates
            </Button>
          )}
          <Button onClick={() => navigate('/evaluations/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Evaluation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex gap-2">
          <Button
            variant={view === 'all' ? 'default' : 'outline'}
            onClick={() => setView('all')}
            className="flex-1"
          >
            All
          </Button>
          <Button
            variant={view === 'pending' ? 'default' : 'outline'}
            onClick={() => setView('pending')}
            className="flex-1"
          >
            Pending
          </Button>
          <Button
            variant={view === 'completed' ? 'default' : 'outline'}
            onClick={() => setView('completed')}
            className="flex-1"
          >
            Completed
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              {departmentFilter === 'all' ? 'All Departments' : departmentFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setDepartmentFilter('all')}>
              All Departments
            </DropdownMenuItem>
            {departments.map(dept => (
              <DropdownMenuItem 
                key={dept.value} 
                onClick={() => setDepartmentFilter(dept.value)}
              >
                {dept.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Sort by {sortField}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => {
              setSortField('date');
              setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
            }}>
              Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setSortField('name');
              setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
            }}>
              Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setSortField('status');
              setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
            }}>
              Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-4 flex justify-center items-center">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                <span>Loading evaluations...</span>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-4 text-center text-red-600">
              <p>Error loading evaluations</p>
              <Button 
                variant="outline" 
                onClick={() => refetch()} 
                className="mt-2"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredEvaluations?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              {view === 'pending' ? (
                <p>No pending evaluations found</p>
              ) : view === 'completed' ? (
                <p>No completed evaluations found</p>
              ) : (
                <p>No evaluations found</p>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredEvaluations?.map((evaluation: Evaluation) => (
            <Card
              key={evaluation._id}
              className="cursor-pointer hover:border-red-200 transition-colors"
              onClick={() => navigate(`/evaluations/${evaluation._id}`)}
            >
              <CardContent className="py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {evaluation.template?.name || 'Template Deleted'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{evaluation.employee?.name || 'Unknown Employee'}</span>
                        <span>•</span>
                        <span>{evaluation.employee?.position || 'Unknown Position'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-sm">
                      <div className={`px-2 py-1 rounded-full ${getStatusBadgeColor(evaluation.status)}`}>
                        {getStatusDisplay(evaluation)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className={getDueStatus(evaluation.scheduledDate).class}>
                          {getDueStatus(evaluation.scheduledDate).text}
                        </span>
                      </div>
                      {evaluation.reviewSessionDate && (
                        <span className="text-gray-500">
                          Review on {new Date(evaluation.reviewSessionDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {user?.role === 'admin' && (
                      <button
                        onClick={(e) => handleDelete(e, evaluation._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}