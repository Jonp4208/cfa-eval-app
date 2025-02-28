// client/src/pages/Evaluations/NewEvaluation.tsx
import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import evaluationService from '../../lib/services/evaluations';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { handleError, handleValidationError } from '@/lib/utils/error-handler';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

const steps = ['Select Employees', 'Choose Template', 'Schedule'];

export default function NewEvaluation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedCountByDepartment, setSelectedCountByDepartment] = useState<Record<string, number>>({});
  const queryClient = useQueryClient();
  const [showAllEmployees, setShowAllEmployees] = useState(true);

  // Predefined departments that match the server's enum values
  const DEPARTMENTS = ['all', 'FOH', 'BOH', 'Leadership'];

  // Get selected count by department
  React.useEffect(() => {
    const counts: Record<string, number> = {};
    selectedEmployees.forEach((emp) => {
      const department = emp.department || 'Uncategorized';
      counts[department] = (counts[department] || 0) + 1;
    });
    setSelectedCountByDepartment(counts);
  }, [selectedEmployees]);

  // Fetch employees with their pending evaluations
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/api/users');
      
      // Fetch all evaluations to check for pending ones
      const evaluationsResponse = await api.get('/api/evaluations');
      const pendingEvaluations = evaluationsResponse.data.evaluations.filter(
        (evaluation: any) => evaluation.status !== 'completed'
      );

      console.log('Fetched users:', response.data.users);
      console.log('Pending evaluations:', pendingEvaluations);

      return response.data.users.map((user: any) => {
        const pendingEval = pendingEvaluations.find(
          (evaluation: any) => evaluation.employee._id === user._id
        );
        
        console.log(`Processing user ${user.name}:`, {
          id: user._id,
          manager: user.manager,
          pendingEval: pendingEval
        });

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
    console.log('Filtering employees with:', {
      currentUserId: user?._id,
      totalEmployees: employees.length,
      searchQuery,
      selectedDepartment,
      showAllEmployees
    });

    const filtered = employees.filter((emp: Employee) => {
      // Exclude current user (manager) from the list
      if (emp._id === user?._id) {
        console.log(`Excluding self: ${emp.name}`);
        return false;
      }
      
      // Check if current user is the employee's manager or is a director
      const isDirector = user?.position === 'Director';
      const reportsToCurrentUser = typeof emp.manager === 'string'
        ? emp.manager === user?._id
        : emp.manager?._id === user?._id;

      // For directors, check the toggle setting
      const shouldInclude = isDirector 
        ? (showAllEmployees || reportsToCurrentUser)
        : reportsToCurrentUser;

      console.log(`Employee ${emp.name}:`, {
        id: emp._id,
        managerId: typeof emp.manager === 'string' ? emp.manager : emp.manager?._id,
        currentUserId: user?._id,
        isDirector,
        reportsToCurrentUser,
        showAllEmployees,
        shouldInclude,
        department: emp.department,
        selectedDepartment,
        matchesDepartment: selectedDepartment === 'all' || emp.department === selectedDepartment,
        searchQuery,
        matchesSearch: emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      emp.position.toLowerCase().includes(searchQuery.toLowerCase())
      });

      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = selectedDepartment === 'all' || emp.department === selectedDepartment;

      return shouldInclude && matchesSearch && matchesDepartment;
    });

    console.log('Filtered results:', {
      totalFiltered: filtered.length,
      employees: filtered.map(emp => ({
        name: emp.name,
        department: emp.department,
        hasPendingEval: !!emp.pendingEvaluation
      }))
    });

    return filtered;
  }, [employees, searchQuery, selectedDepartment, user?._id, showAllEmployees]);

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
    const isDirector = user?.position === 'Director';
    const reportsToCurrentUser = typeof employee.manager === 'string'
      ? employee.manager === user?._id
      : employee.manager?._id === user?._id;
    
    if (!employee.pendingEvaluation && (isDirector || reportsToCurrentUser)) {
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
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-4 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Create Evaluation</h1>
                <p className="text-white/80 mt-1 sm:mt-2 text-base sm:text-lg">Schedule performance evaluations</p>
              </div>
              <Button 
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white border-0 h-10 sm:h-12 px-4 sm:px-6 flex-none"
                onClick={() => navigate('/evaluations')}
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <Card className="bg-white rounded-[20px] shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`flex flex-col items-center ${index + 1 === currentStep ? 'text-[#E51636]' : 'text-[#27251F]/40'}`}>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 ${
                      index + 1 === currentStep 
                        ? 'border-[#E51636] bg-[#E51636]/10' 
                        : index + 1 < currentStep
                        ? 'border-[#E51636] bg-[#E51636]/10'
                        : 'border-gray-200'
                    }`}>
                      {index + 1 < currentStep ? (
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#E51636]" />
                      ) : (
                        <span className={index + 1 === currentStep ? 'text-[#E51636] font-semibold text-sm sm:text-base' : 'text-[#27251F]/40 text-sm sm:text-base'}>
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <span className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium hidden sm:block">{step}</span>
                    <span className="mt-1 text-xs font-medium sm:hidden">
                      {step.split(' ')[0]}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-full mx-2 sm:mx-4 h-[2px] bg-gray-200">
                      <div className={`h-full bg-[#E51636] transition-all ${
                        index + 1 < currentStep ? 'w-full' : 'w-0'
                      }`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Section */}
        <Card className="bg-white rounded-[20px] shadow-md">
          <CardContent className="p-4 sm:p-6">
            {currentStep === 1 && (
              <>
                {/* Filters */}
                <Card className="bg-white rounded-[20px] shadow-md">
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#27251F]/40 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Search employees..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent text-base"
                        />
                      </div>
                      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger className="h-11 sm:h-12 rounded-xl border-gray-200 hover:border-gray-300">
                          <SelectValue placeholder="All Departments" />
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
                    {user?.position === 'Director' && (
                      <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
                        <Switch
                          id="show-all"
                          checked={showAllEmployees}
                          onCheckedChange={setShowAllEmployees}
                        />
                        <Label htmlFor="show-all" className="text-sm text-gray-600">
                          {showAllEmployees ? 'All Employees' : 'My Team Only'}
                        </Label>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Department Filters */}
                <div className="mt-6 -mx-4 px-4">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {DEPARTMENTS.map((dept) => (
                      <Button
                        key={dept}
                        variant={selectedDepartment === dept ? 'default' : 'outline'}
                        onClick={() => setSelectedDepartment(dept)}
                        size="sm"
                        className={`rounded-full px-4 whitespace-nowrap flex-shrink-0 h-9 sm:h-10 ${
                          selectedDepartment === dept 
                            ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                            : 'hover:bg-[#E51636]/10 hover:text-[#E51636]'
                        }`}
                      >
                        {dept === 'all' ? 'All' : dept}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Search Results */}
                <div className="mt-6">
                  {/* Headers */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <h2 className="text-base sm:text-lg font-medium text-[#27251F]">Available for Evaluation</h2>
                      {Object.values(selectedCountByDepartment).some(count => count > 0) && (
                        <Badge variant="outline" className="bg-[#E51636]/10 text-[#E51636] border-[#E51636]/20">
                          {Object.values(selectedCountByDepartment).reduce((a, b) => a + b, 0)} selected
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:gap-8">
                    {/* Available Employees */}
                    <div>
                      <div className="grid grid-cols-1 gap-6">
                        {Object.entries(groupedEmployees)
                          .filter(([_, employees]) => employees.some(emp => !emp.pendingEvaluation))
                          .map(([department, departmentEmployees]) => {
                            const availableEmployees = departmentEmployees.filter(emp => !emp.pendingEvaluation);
                            if (availableEmployees.length === 0) return null;
                            
                            return (
                              <div key={department} className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-[#27251F]">{department}</h3>
                                    {selectedCountByDepartment[department] > 0 && (
                                      <Badge variant="outline" className="bg-[#E51636]/10 text-[#E51636] border-[#E51636]/20">
                                        {selectedCountByDepartment[department]} selected
                                      </Badge>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const newSelected = [...selectedEmployees];
                                      availableEmployees.forEach(emp => {
                                        if (!newSelected.find(selected => selected._id === emp._id)) {
                                          newSelected.push(emp);
                                        }
                                      });
                                      setSelectedEmployees(newSelected);
                                    }}
                                    className="text-sm text-[#E51636] hover:text-[#E51636] hover:bg-[#E51636]/10"
                                  >
                                    Select All
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                                  {availableEmployees.map((employee) => (
                                    <Card
                                      key={employee._id}
                                      className={`cursor-pointer transition-all rounded-xl hover:shadow-md touch-manipulation ${
                                        selectedEmployees.find(emp => emp._id === employee._id)
                                          ? 'ring-2 ring-[#E51636] bg-[#E51636]/10'
                                          : 'hover:border-[#E51636]/20'
                                      }`}
                                      onClick={(e) => handleEmployeeToggle(employee, e)}
                                    >
                                      <CardContent className="p-3 sm:p-4">
                                        <div className="flex items-center gap-3">
                                          {employee.imageUrl ? (
                                            <img
                                              src={employee.imageUrl}
                                              alt={employee.name}
                                              className="w-10 h-10 rounded-full"
                                            />
                                          ) : (
                                            <div className="w-10 h-10 rounded-full bg-[#E51636]/10 flex items-center justify-center flex-shrink-0">
                                              <Users className="w-5 h-5 text-[#E51636]" />
                                            </div>
                                          )}
                                          <div className="min-w-0 flex-1">
                                            <p className="font-medium text-[#27251F] truncate text-sm sm:text-base">{employee.name}</p>
                                            <p className="text-xs sm:text-sm text-[#27251F]/60 truncate">{employee.position}</p>
                                          </div>
                                          {selectedEmployees.find(emp => emp._id === employee._id) && (
                                            <CheckCircle className="w-5 h-5 text-[#E51636] flex-shrink-0" />
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Pending Evaluations */}
                    <div>
                      <h2 className="text-base sm:text-lg font-medium text-[#27251F] mb-4">Pending Evaluations</h2>
                      <div className="grid grid-cols-1 gap-6">
                        {Object.entries(groupedEmployees)
                          .filter(([_, employees]) => employees.some(emp => emp.pendingEvaluation))
                          .map(([department, departmentEmployees]) => {
                            const pendingEmployees = departmentEmployees.filter(emp => emp.pendingEvaluation);
                            if (pendingEmployees.length === 0) return null;
                            
                            return (
                              <div key={department} className="space-y-3">
                                <h3 className="font-medium text-[#27251F]">{department}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                                  {pendingEmployees.map((employee) => (
                                    <Card
                                      key={employee._id}
                                      className="rounded-xl opacity-50 cursor-not-allowed"
                                    >
                                      <CardContent className="p-3 sm:p-4">
                                        <div className="flex items-center gap-3">
                                          {employee.imageUrl ? (
                                            <img
                                              src={employee.imageUrl}
                                              alt={employee.name}
                                              className="w-10 h-10 rounded-full"
                                            />
                                          ) : (
                                            <div className="w-10 h-10 rounded-full bg-[#E51636]/10 flex items-center justify-center flex-shrink-0">
                                              <Users className="w-5 h-5 text-[#E51636]" />
                                            </div>
                                          )}
                                          <div className="min-w-0 flex-1">
                                            <p className="font-medium text-[#27251F] truncate text-sm sm:text-base">{employee.name}</p>
                                            <p className="text-xs sm:text-sm text-[#27251F]/60 truncate">{employee.position}</p>
                                          </div>
                                          <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 flex-shrink-0 text-xs">
                                            Pending
                                          </Badge>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Choose Template */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  <h2 className="text-base sm:text-lg font-medium text-[#27251F]">Select a Template</h2>
                  <div className="overflow-x-auto -mx-4 px-4">
                    <div className="flex gap-2 mb-4 min-w-max">
                      <Button
                        variant={selectedTag === 'All' ? 'default' : 'outline'}
                        onClick={() => setSelectedTag('All')}
                        size="sm"
                        className={`rounded-full px-4 h-9 sm:h-10 ${
                          selectedTag === 'All' 
                            ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                            : 'hover:bg-[#E51636]/10 hover:text-[#E51636]'
                        }`}
                      >
                        All
                      </Button>
                      {['FOH', 'BOH', 'Leadership', 'General'].map((tag) => (
                        <Button
                          key={tag}
                          variant={selectedTag === tag ? 'default' : 'outline'}
                          onClick={() => setSelectedTag(tag)}
                          size="sm"
                          className={`rounded-full px-4 h-9 sm:h-10 ${
                            selectedTag === tag 
                              ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                              : 'hover:bg-[#E51636]/10 hover:text-[#E51636]'
                          }`}
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {loadingTemplates ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E51636] mx-auto"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {(templates || [])
                      .filter((template: Template) => 
                        selectedTag === 'All' || (template.tags && template.tags.includes(selectedTag))
                      )
                      .map((template: Template) => (
                        <Card
                          key={`template-${template._id || template.id}`}
                          onClick={() => setSelectedTemplate(template)}
                          className={`cursor-pointer transition-all rounded-[20px] hover:shadow-md touch-manipulation
                            ${selectedTemplate?.id === (template.id || template._id) 
                              ? 'ring-2 ring-[#E51636] bg-[#E51636]/10' 
                              : 'hover:border-[#E51636]/20'
                            }`}
                        >
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium text-[#27251F] text-sm sm:text-base">{template.name}</h3>
                              <FileText className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                selectedTemplate?.id === (template.id || template._id) 
                                  ? 'text-[#E51636]' 
                                  : 'text-[#27251F]/40'
                              }`} />
                            </div>
                            <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                              {(template.tags || []).map(tag => (
                                <Badge 
                                  key={tag} 
                                  variant="secondary" 
                                  className="text-xs bg-[#27251F]/10 text-[#27251F]/60"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs sm:text-sm text-[#27251F]/60">{template.description}</p>
                            <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm text-[#27251F]/60">
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
                  <h2 className="text-base sm:text-lg font-medium text-[#27251F] mb-4">Schedule the Evaluation</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#27251F]/60 mb-1">
                        Scheduled Date
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent text-base"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-4 sm:mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            className={`h-10 sm:h-12 px-4 sm:px-6 rounded-xl border-gray-200 hover:bg-gray-50 text-[#27251F] ${currentStep === 1 ? 'invisible' : ''}`}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={isNextDisabled()}
            className="bg-[#E51636] hover:bg-[#E51636]/90 text-white h-10 sm:h-12 px-4 sm:px-6 rounded-xl"
          >
            {currentStep === steps.length ? 'Create Evaluation' : 'Next'}
            {currentStep !== steps.length && <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}