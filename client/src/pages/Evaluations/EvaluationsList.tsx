// client/src/pages/Evaluations/EvaluationsList.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronDown,
  Clock,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import api from '../../lib/axios';

interface Evaluation {
  id: string;
  employee: {
    id: string;
    name: string;
  };
  evaluator: {
    id: string;
    name: string;
  };
  template: {
    id: string;
    name: string;
  };
  status: 'draft' | 'submitted' | 'acknowledged';
  scheduledDate: string;
  submittedAt?: string;
  acknowledgedAt?: string;
}

interface FilterState {
  status: string;
  dateRange: string;
  evaluator: string;
  template: string;
}

export default function EvaluationsList() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    dateRange: 'all',
    evaluator: 'all',
    template: 'all'
  });
  const [sortBy, setSortBy] = useState('scheduledDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch evaluations with filters
  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['evaluations', filters, search, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: filters.status,
        dateRange: filters.dateRange,
        evaluator: filters.evaluator,
        template: filters.template,
        search,
        sortBy,
        sortOrder
      });
      try {
        const response = await api.get(`/api/evaluations?${params}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching evaluations:', error);
        return [];
      }
    }
  });

  // Define the possible status types
type StatusType = 'draft' | 'submitted' | 'acknowledged';

// Define the styles mapping with proper typing
const statusStyles: Record<StatusType, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-blue-100 text-blue-800',
  acknowledged: 'bg-green-100 text-green-800'
};

// Update the function to use the proper type
const getStatusBadge = (status: StatusType) => {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'submitted':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'acknowledged':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  interface Option {
    value: string | number;
    label: string;
  }
  
  interface FilterDropdownProps {
    label: string;
    options: Option[];
    value: string | number;
    onChange: (value: string) => void;
  }
  
  const FilterDropdown = ({ label, options, value, onChange }: FilterDropdownProps) => (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
      >
        {options.map((option: Option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Evaluations</h1>
        <Link
          to="/evaluations/new"
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Evaluation
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search evaluations..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FilterDropdown
                label="Status"
                value={filters.status}
                onChange={(value: string) => handleFilterChange('status', value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'submitted', label: 'Submitted' },
                  { value: 'acknowledged', label: 'Acknowledged' }
                ]}
              />
              <FilterDropdown
                label="Date Range"
                value={filters.dateRange}
                onChange={(value: string) => handleFilterChange('dateRange', value)}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'quarter', label: 'This Quarter' }
                ]}
              />
              <FilterDropdown
                label="Evaluator"
                value={filters.evaluator}
                onChange={(value: string) => handleFilterChange('evaluator', value)}
                options={[
                  { value: 'all', label: 'All Evaluators' },
                  // Add evaluator options dynamically
                ]}
              />
              <FilterDropdown
                label="Template"
                value={filters.template}
                onChange={(value: string) => handleFilterChange('template', value)}
                options={[
                  { value: 'all', label: 'All Templates' },
                  // Add template options dynamically
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluations List */}
      <Card>
        <CardHeader>
          <CardTitle>All Evaluations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evaluator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
                      </div>
                    </td>
                  </tr>
                ) : evaluations?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No evaluations found
                    </td>
                  </tr>
                ) : (
                  evaluations?.map((evaluation: Evaluation) => (
                    <tr
                      key={evaluation.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => window.location.href = `/evaluations/${evaluation.id}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{evaluation.employee.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {evaluation.template.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(evaluation.status)}
                          {getStatusBadge(evaluation.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(evaluation.scheduledDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {evaluation.evaluator.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
  {evaluation.submittedAt || evaluation.acknowledgedAt 
    ? new Date(evaluation.submittedAt || evaluation.acknowledgedAt || '').toLocaleString()
    : 'Not updated'}
</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}