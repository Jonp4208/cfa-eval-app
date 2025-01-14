// client/src/pages/Evaluations/NewEvaluation.tsx
import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { 
  Users, 
  FileText, 
  Calendar, 
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  CheckCircle
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import evaluationService from '../../lib/services/evaluations';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { handleError, handleValidationError } from '@/lib/utils/error-handler';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Employee {
  _id: string;
  name: string;
  position: string;
  department: string;
  imageUrl?: string;
  manager?: {
    _id: string;
    name: string;
  };
  email?: string;
  lastEvaluation?: string;
  pendingEvaluation?: {
    status: string;
    scheduledDate: string;
  };
}

interface Template {
  id: string;
  _id?: string;  // Keep for backward compatibility
  name: string;
  description: string;
  sections: any[];
  tags: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  sectionsCount: number;
  criteriaCount: number;
}

const steps = [
  { id: 1, name: 'Select Employee', icon: Users },
  { id: 2, name: 'Choose Template', icon: FileText },
  { id: 3, name: 'Schedule', icon: Calendar },
  { id: 4, name: 'Review', icon: ClipboardList }
];

export default function NewEvaluation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  // Predefined departments that match the server's enum values
  const DEPARTMENTS = ['all', 'FOH', 'BOH', 'Leadership'];

  // Fetch employees with their pending evaluations
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/api/users');
      console.log('Fetched employees:', response.data.users);

      // Fetch all evaluations to check for pending ones
      const evaluationsResponse = await api.get('/api/evaluations');
      const pendingEvaluations = evaluationsResponse.data.evaluations.filter(
        (evaluation: any) => evaluation.status !== 'completed'
      );

      return response.data.users.map((user: any) => {
        // Find any pending evaluation for this user
        const pendingEval = pendingEvaluations.find(
          (evaluation: any) => evaluation.employee._id === user._id
        );

        return {
          _id: user._id,
          name: user.name,
          position: user.position || 'Employee',
          department: user.department || 'Uncategorized',
          imageUrl: user.imageUrl,
          email: user.email,
          lastEvaluation: user.lastEvaluation,
          manager: user.manager || null,
          pendingEvaluation: pendingEval ? {
            status: pendingEval.status,
            scheduledDate: pendingEval.scheduledDate
          } : undefined
        };
      });
    }
  });

  // Filter employees by search query and department
  const filteredEmployees = React.useMemo(() => {
    if (!employees) return [];
    console.log('Current user:', user); // Debug log
    console.log('Filtering employees:', employees); // Debug log
    return employees.filter((emp: Employee) => {
      // Exclude current user (manager) from the list
      if (emp._id === user?._id) return false;
      
      // Only show employees that report to the current user
      // Handle manager as either an ObjectId or an object with _id
      const reportsToCurrentUser = typeof emp.manager === 'string' 
        ? emp.manager === user?._id
        : emp.manager?._id === user?._id;
      console.log(`Employee ${emp.name} reports to current user: ${reportsToCurrentUser}`); // Debug log

      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = selectedDepartment === 'all' || emp.department === selectedDepartment;
      return reportsToCurrentUser && matchesSearch && matchesDepartment;
    });
  }, [employees, searchQuery, selectedDepartment, user?._id]);

  // Group employees by department
  const groupedEmployees = React.useMemo(() => {
    if (!filteredEmployees) return {};
    const groups: { [key: string]: Employee[] } = {};
    filteredEmployees.forEach((emp: Employee) => {
      const department = emp.department || 'Uncategorized';
      if (!groups[department]) {
        groups[department] = [];
      }
      groups[department].push(emp);
    });
    return groups;
  }, [filteredEmployees]);

  // Get selected count by department
  const selectedCountByDepartment = React.useMemo(() => {
    if (!selectedEmployees) return {};
    const counts: { [key: string]: number } = {};
    selectedEmployees.forEach((emp: Employee) => {
      const department = emp.department || 'Uncategorized';
      counts[department] = (counts[department] || 0) + 1;
    });
    return counts;
  }, [selectedEmployees]);

  // Fetch templates
  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await api.get('/api/templates');
      return response.data.templates;
    }
  });

  // Create evaluation mutation
  const createEvaluation = useMutation({
    mutationFn: (evaluationData: any) => {
      console.log('Submitting evaluation with template:', selectedTemplate);
      return evaluationService.createEvaluation(evaluationData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Evaluation created successfully",
        duration: 5000,
      });
      navigate('/evaluations');
    },
    onError: (error: any) => {
      handleError(error);
    }
  });

  const handleEmployeeToggle = (employee: Employee, event: React.MouseEvent) => {
    event.stopPropagation();
    // Check if employee can be selected (has manager and reports to current user)
    const reportsToCurrentUser = typeof employee.manager === 'string'
      ? employee.manager === user?._id
      : employee.manager?._id === user?._id;
    
    if (!employee.pendingEvaluation && reportsToCurrentUser) {
      setSelectedEmployees(prev => {
        const isSelected = prev.find(emp => emp._id === employee._id);
        if (isSelected) {
          return prev.filter(emp => emp._id !== employee._id);
        } else {
          return [...prev, employee];
        }
      });
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (selectedEmployees.length === 0 || !selectedTemplate || !scheduledDate) {
      handleValidationError({
        message: 'Please select employees, a template, and a scheduled date.'
      });
      return;
    }

    console.log('Submitting evaluation with template:', selectedTemplate);

    createEvaluation.mutate({
      employeeIds: selectedEmployees.map(emp => emp._id),
      templateId: selectedTemplate.id,
      scheduledDate,
    });
  };

  const isNextDisabled = () => {
    switch (currentStep) {
      case 1: return selectedEmployees.length === 0;
      case 2: return !selectedTemplate;
      case 3: return !scheduledDate;
      default: return false;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create New Evaluation</h1>
          <p className="text-gray-500">Follow the steps below to create a new evaluation</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="p-6">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center">
            {steps.map((step, stepIdx) => {
              const Icon = step.icon;
              return (
                <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'flex-1' : ''}`}>
                  {stepIdx !== steps.length - 1 && (
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200" />
                  )}
                  <div className="relative flex items-center justify-center group">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 bg-white relative z-10
                      ${currentStep === step.id ? 'border-red-600 bg-red-50' : 'border-gray-300'}`}>
                      <Icon className={`w-5 h-5 ${currentStep === step.id ? 'text-red-600' : 'text-gray-500'}`} />
                    </div>
                    <span className={`absolute -bottom-8 text-sm font-medium whitespace-nowrap
                      ${currentStep === step.id ? 'text-red-600' : 'text-gray-500'}`}>
                      {step.name}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </Card>

      {/* Step Content */}
      <Card className="p-6">
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <>
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept === 'all' ? 'All Departments' : dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employee List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.keys(groupedEmployees).length === 0 ? (
                  <div className="col-span-full">
                    <Card className="p-8">
                      <CardContent className="flex flex-col items-center text-center">
                        <Users className="w-12 h-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Team Members Found</h3>
                        <p className="text-gray-500 mb-4">
                          You don't have any team members assigned for evaluations. Please contact your administrator to assign team members to you.
                        </p>
                        <Button variant="outline" onClick={() => navigate('/evaluations')}>
                          Back to Evaluations
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  Object.entries(groupedEmployees).map(([department, departmentEmployees]) => (
                    <div key={department}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{department}</h3>
                        {selectedCountByDepartment[department] > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                            {selectedCountByDepartment[department]} selected
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        {departmentEmployees.map((employee) => (
                          <Card
                            key={employee._id}
                            className={`cursor-pointer transition-colors ${
                              selectedEmployees.find(emp => emp._id === employee._id)
                                ? 'bg-red-50 border-red-200'
                                : employee.pendingEvaluation
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:border-red-200'
                            }`}
                            onClick={(e) => handleEmployeeToggle(employee, e)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {employee.imageUrl ? (
                                    <img
                                      src={employee.imageUrl}
                                      alt={employee.name}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                      <Users className="w-4 h-4 text-gray-400" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium">{employee.name}</p>
                                    <p className="text-sm text-gray-500">{employee.position}</p>
                                  </div>
                                </div>
                                {employee.pendingEvaluation ? (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                                    Pending
                                  </Badge>
                                ) : selectedEmployees.find(emp => emp._id === employee._id) ? (
                                  <Check className="w-5 h-5 text-red-600" />
                                ) : null}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Step 2: Choose Template */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-medium">Select a Template</h2>
                <div className="overflow-x-auto -mx-4 px-4 pb-2">
                  <div className="flex gap-2 mb-4 min-w-max">
                    <Button
                      variant={selectedTag === 'All' ? 'default' : 'outline'}
                      onClick={() => setSelectedTag('All')}
                      size="sm"
                      className={selectedTag === 'All' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      All
                    </Button>
                    {['FOH', 'BOH', 'Leadership', 'General'].map((tag) => (
                      <Button
                        key={tag}
                        variant={selectedTag === tag ? 'default' : 'outline'}
                        onClick={() => setSelectedTag(tag)}
                        size="sm"
                        className={selectedTag === tag ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {loadingTemplates ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(templates || [])
                    .filter((template: Template) => 
                      selectedTag === 'All' || (template.tags && template.tags.includes(selectedTag))
                    )
                    .map((template: Template) => (
                      <Card
                        key={`template-${template._id || template.id}`}
                        onClick={() => setSelectedTemplate(template)}
                        className={`cursor-pointer transition-all hover:shadow-md
                          ${selectedTemplate?.id === (template.id || template._id) ? 'ring-2 ring-red-600 bg-red-50' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{template.name}</h3>
                            <FileText className={`w-5 h-5 ${selectedTemplate?.id === (template.id || template._id) ? 'text-red-600' : 'text-gray-400'}`} />
                          </div>
                          <div className="flex gap-2 mb-3">
                            {(template.tags || []).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-gray-500">{template.description}</p>
                          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {template.sectionsCount} {template.sectionsCount === 1 ? 'section' : 'sections'}
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              {template.criteriaCount} {template.criteriaCount === 1 ? 'question' : 'questions'}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Schedule */}
          {currentStep === 3 && (
            <div className="max-w-md mx-auto space-y-6">
              <div>
                <h2 className="text-lg font-medium mb-4">Schedule the Evaluation</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full p-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Selected Employees ({selectedEmployees.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedEmployees.length > 0 && Object.entries(
                        selectedEmployees.reduce((acc: { [key: string]: Employee[] }, emp) => {
                          const dept = emp.department || 'Uncategorized';
                          if (!acc[dept]) acc[dept] = [];
                          acc[dept].push(emp);
                          return acc;
                        }, {})
                      ).map(([department, employees]) => (
                        <div key={`review-${department}`}>
                          <h4 className="font-medium text-gray-700 mb-2">
                            {department} ({employees.length})
                          </h4>
                          <div className="space-y-2">
                            {employees.map(employee => (
                              <div key={`review-${employee._id}`} className="flex items-center gap-2 text-sm">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span>{employee.name}</span>
                                <span className="text-gray-500">({employee.position})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Selected Template</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-medium">{selectedTemplate?.name}</h3>
                      <p className="text-sm text-gray-500 mt-2">{selectedTemplate?.description}</p>
                      <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {selectedTemplate?.sectionsCount} {selectedTemplate?.sectionsCount === 1 ? 'section' : 'sections'}
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          {selectedTemplate?.criteriaCount} {selectedTemplate?.criteriaCount === 1 ? 'question' : 'questions'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Scheduled Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{new Date(scheduledDate).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t">
            <Button
              onClick={handleBack}
              disabled={currentStep === 1}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={isNextDisabled()}
              className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
            >
              {currentStep === steps.length ? 'Create Evaluation' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}