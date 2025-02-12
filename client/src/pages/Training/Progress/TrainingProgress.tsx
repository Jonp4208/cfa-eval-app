import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  IconButton,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  ButtonGroup,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { Employee } from '../../../types/training';
import { TrainingPlan, NewTrainingPlan, TraineeProgress } from '../../../types/training';
import { SimplifiedTrainingPlan, EmployeeWithProgress } from './types';
import TrainingPlanList from './components/TrainingPlanList';
import EmployeeProgress from './components/EmployeeProgress';
import AssignPlanDialog from './components/AssignPlanDialog';
import TrainingDashboard from './components/TrainingDashboard';
import TrainingCalendar from './components/TrainingCalendar';
import { Plus, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/axios';
import CreatePlanDialog from './components/CreatePlanDialog';
import { toast } from '@/components/ui/use-toast';
import PageHeader from '@/components/PageHeader';
import { Navigate } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>{children}</Box>}
  </div>
);

const MobileNav: React.FC<{
  activeTab: string;
  onTabChange: (value: string) => void;
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
}> = ({ activeTab, onTabChange, open, onClose, onOpen }) => {
  const { user } = useAuth();
  const navItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, value: 'dashboard' },
    { label: 'Employee Progress', icon: <PeopleIcon />, value: 'progress' },
    ...(user?.position !== 'Team Member' ? [{ label: 'Training Plans', icon: <DescriptionIcon />, value: 'plans' }] : []),
    { label: 'Calendar', icon: <CalendarIcon />, value: 'calendar' },
  ];

  return (
    <SwipeableDrawer
      anchor="left"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
    >
      <Box sx={{ width: 250 }} role="presentation">
        <List>
          {navItems.map((item) => (
            <React.Fragment key={item.value}>
              <ListItem
                onClick={() => {
                  onTabChange(item.value);
                  onClose();
                }}
                sx={{
                  backgroundColor: activeTab === item.value ? 'rgba(229, 22, 54, 0.08)' : 'transparent',
                  '&:hover': {
                    backgroundColor: activeTab === item.value ? 'rgba(229, 22, 54, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                  },
                  cursor: 'pointer'
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography component="span">{item.label}</Typography>
                  }
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Box>
    </SwipeableDrawer>
  );
};

// Add type definitions at the top
interface TrainingPlanWithModules {
  _id: string;
  modules: Array<{
    _id: string;
    title: string;
    description?: string;
    estimatedDuration: number;
  }>;
}

const TrainingProgress: React.FC = () => {
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [trainingPlans, setTrainingPlans] = useState<SimplifiedTrainingPlan[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithProgress[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'active' | 'completed'>('active');
  const [traineeProgress, setTraineeProgress] = useState<TraineeProgress[]>([]);

  // Add refs for storing computed values
  const employeeProgressMapRef = useRef(new Map<string, any>());
  const planProgressMapRef = useRef(new Map<string, any>());
  const departmentProgressMapRef = useRef(new Map<string, any>());

  // Add effect to handle filter changes and log data
  useEffect(() => {
    console.log('Filter changed to:', filter);
    console.log('Current employees data:', employees.map(emp => ({
      name: emp.name,
      progress: emp.trainingProgress?.map(p => ({
        id: p._id,
        status: p.status,
        planName: p.trainingPlan?.name
      }))
    })));
  }, [filter, employees]);

  // Modify the fetchData function to better handle progress data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching fresh training data...');

      // Always fetch fresh data
      const [plansRes, employeesRes, progressRes] = await Promise.all([
        api.get('/api/training/plans'),
        api.get('/api/users'),
        api.get('/api/training/employees/training-progress')
      ]);

      const progress = progressRes.data;
      console.log('Raw progress data:', progress);

      // Transform progress data to ensure status is set correctly
      const validatedProgress = progress.map((emp: any) => ({
        ...emp,
        trainingProgress: (emp.trainingProgress || []).map((p: any) => ({
          ...p,
          // Ensure status is either IN_PROGRESS or COMPLETED
          status: p.status || 'IN_PROGRESS'
        }))
      }));

      setEmployees(validatedProgress);
      setTrainingPlans(plansRes.data);
      setTraineeProgress(progress.flatMap((emp: any) => emp.trainingProgress || []));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch training data. Please try again.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    console.log('Current Employees State:', employees);
    console.log('Current Training Plans State:', trainingPlans);
  }, [employees, trainingPlans]);

  const handleAssignPlan = async (employeeId: string, planId: string, startDate: Date) => {
    try {
      const response = await api.post('/api/training/plans/assign', {
        employeeId,
        planId,
        startDate,
      });

      console.log('Assignment response:', response.data);
      
      // Show success message
      toast({
        title: "Success",
        description: "Training plan assigned successfully",
      });

      // Close the dialog first
      setIsAssignDialogOpen(false);
      
      // Then refresh data
      await fetchData();
    } catch (err) {
      console.error('Error assigning training plan:', err);
      toast({
        title: "Error",
        description: "Failed to assign training plan",
        variant: "destructive",
      });
    }
  };

  const handleCreatePlan = async (plan: NewTrainingPlan) => {
    try {
      const response = await api.post('/api/training/plans', plan);
      
      // Show success notification
      toast({
        title: "Success",
        description: "Training plan created successfully",
      });

      // Close the dialog
      setIsCreatePlanOpen(false);

      // Immediately update local state with the new plan
      const newPlan = response.data;
      setTrainingPlans(prevPlans => [...prevPlans, {
        ...newPlan,
        _id: newPlan._id,
        id: newPlan._id,
        startDate: newPlan.createdAt,
        modules: newPlan.modules || [],
        createdBy: {
          _id: user?._id || '',
          firstName: user?.firstName || '',
          lastName: user?.lastName || ''
        }
      }]);

      // Refresh data in background
      fetchData();
    } catch (err) {
      console.error('Error creating training plan:', err);
      toast({
        title: "Error",
        description: "Failed to create training plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePlan = async (planId: string, updatedPlan: Partial<TrainingPlan>) => {
    try {
      const response = await api.put(`/api/training/plans/${planId}`, updatedPlan);
      const updated = {
        id: response.data._id,
        name: response.data.name,
        startDate: response.data.createdAt || new Date().toISOString(),
        severity: response.data.severity || 1
      } as SimplifiedTrainingPlan;
      setTrainingPlans(trainingPlans.map(p => p.id === planId ? updated : p));
    } catch (err) {
      console.error('Error updating training plan:', err);
      setError('Failed to update training plan');
    }
  };

  const handleProgressUpdate = async () => {
    try {
      // Fetch fresh data
      await fetchData();
    } catch (err) {
      console.error('Error updating employee progress:', err);
      setError('Failed to update progress');
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Optimize filtered employees with memoization
  const filteredEmployees = useMemo(() => {
    if (!employees.length) return [];
    
    return employees.filter(employee => {
      const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = !departmentFilter || employee.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    }).map(employee => ({
      ...employee,
      progress: employeeProgressMapRef.current.get(employee.id) || {
        completed: 0,
        total: 0,
        rate: 0
      }
    }));
  }, [employees, searchQuery, departmentFilter]);

  // Optimize filtered plans with memoization
  const filteredPlans = useMemo(() => {
    if (!trainingPlans.length) return [];
    
    return trainingPlans.filter(plan => {
      const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = !departmentFilter || plan.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    }).map(plan => ({
      ...plan,
      progress: planProgressMapRef.current.get(plan._id) || {
        assignedCount: 0,
        completedCount: 0,
        trainees: new Set()
      }
    }));
  }, [trainingPlans, searchQuery, departmentFilter]);

  // Optimize department progress calculation
  const departmentProgress = useMemo(() => {
    const departments = Array.from(departmentProgressMapRef.current.entries()).map(([dept, stats]) => ({
      name: dept,
      completionRate: (stats.completedModules / stats.totalModules) * 100,
      employeeCount: stats.employees.size,
      totalModules: stats.totalModules,
      completedModules: stats.completedModules
    }));
    
    return departments.sort((a, b) => b.completionRate - a.completionRate);
  }, [traineeProgress]);

  // If auth is still loading, show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E51636]" />
      </div>
    );
  }

  // If auth is loaded but no user, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="container mx-auto py-4 md:py-8 px-4 md:px-8 space-y-4 md:space-y-6">
        <PageHeader
          title="Training"
          subtitle="Manage and track team training progress"
          actions={
            user?.position !== 'Team Member' && (
              <button
                onClick={() => setIsCreatePlanOpen(true)}
                className="w-full bg-white hover:bg-gray-50 text-[#E51636] flex items-center justify-center gap-2 py-2 md:py-2.5 px-3 md:px-4 rounded-[6px] md:rounded-[8px] transition-colors"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base font-medium">New Training Plan</span>
              </button>
            )
          }
        />

        {/* Main Content */}
        <Card className="bg-white rounded-[12px] md:rounded-[20px] shadow-md">
          <CardContent className="p-0">
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b overflow-x-auto scrollbar-hide">
                <TabsList className="h-10 md:h-12 w-full justify-start gap-1 md:gap-2 bg-transparent px-2 md:px-4">
                  <TabsTrigger
                    value="dashboard"
                    className="data-[state=active]:bg-[#E51636] data-[state=active]:text-white rounded-full px-3 md:px-4 text-xs md:text-sm whitespace-nowrap"
                  >
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger
                    value="progress"
                    className="data-[state=active]:bg-[#E51636] data-[state=active]:text-white rounded-full px-3 md:px-4 text-xs md:text-sm whitespace-nowrap"
                  >
                    {user?.position === 'Team Member' ? 'My Progress' : 'Team Training'}
                  </TabsTrigger>
                  {user?.position !== 'Team Member' && (
                    <TabsTrigger
                      value="plans"
                      className="data-[state=active]:bg-[#E51636] data-[state=active]:text-white rounded-full px-3 md:px-4 text-xs md:text-sm whitespace-nowrap"
                    >
                      Training Plans
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value="calendar"
                    className="data-[state=active]:bg-[#E51636] data-[state=active]:text-white rounded-full px-3 md:px-4 text-xs md:text-sm whitespace-nowrap"
                  >
                    Calendar
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="dashboard" className="p-3 md:p-6">
                <TrainingDashboard employees={employees} plans={trainingPlans} />
              </TabsContent>

              <TabsContent value="progress" className="p-3 md:p-6">
                <div className="space-y-4 md:space-y-6">
                  <div className="flex flex-col gap-3">
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 2, sm: 3 },
                      width: '100%'
                    }}>
                      <ButtonGroup 
                        variant="outlined" 
                        sx={{ 
                          display: 'flex',
                          width: { xs: '100%', sm: 'auto' },
                          '& .MuiButton-root': {
                            flex: { xs: 1, sm: 'none' },
                            borderColor: 'rgba(39, 37, 31, 0.1)',
                            color: 'rgba(39, 37, 31, 0.6)',
                            textTransform: 'none',
                            fontSize: { xs: '0.813rem', sm: '0.875rem' },
                            fontWeight: 500,
                            px: { xs: 2, sm: 2.5 },
                            py: 0.75,
                            minWidth: { xs: '80px', sm: '100px' },
                            height: '36px',
                            '&:hover': {
                              borderColor: 'rgba(39, 37, 31, 0.2)',
                              backgroundColor: 'rgba(39, 37, 31, 0.05)',
                            },
                            '&.active': {
                              backgroundColor: '#E51636',
                              borderColor: '#E51636',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: '#DD0031',
                                borderColor: '#DD0031',
                              }
                            }
                          }
                        }}
                      >
                        <Button 
                          className={filter === 'active' ? 'active' : ''} 
                          onClick={() => setFilter('active')}
                        >
                          Active
                        </Button>
                        <Button 
                          className={filter === 'completed' ? 'active' : ''} 
                          onClick={() => setFilter('completed')}
                        >
                          Completed
                        </Button>
                      </ButtonGroup>

                      <TextField
                        placeholder="Search employees..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon sx={{ color: 'rgba(39, 37, 31, 0.6)' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          width: '100%',
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            height: '36px',
                            '& fieldset': {
                              borderColor: 'rgba(39, 37, 31, 0.1)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(39, 37, 31, 0.2)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#E51636',
                            }
                          },
                          '& .MuiOutlinedInput-input': {
                            padding: '8px 14px',
                            fontSize: '0.875rem',
                            '&::placeholder': {
                              color: 'rgba(39, 37, 31, 0.6)',
                              opacity: 1,
                            },
                          }
                        }}
                      />

                      <FormControl sx={{ 
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          height: '36px',
                          borderRadius: '8px',
                        }
                      }}>
                        <Select
                          value={departmentFilter}
                          onChange={(e) => setDepartmentFilter(e.target.value)}
                          displayEmpty
                          renderValue={departmentFilter !== '' ? undefined : () => "Department"}
                          sx={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(39, 37, 31, 0.1)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(39, 37, 31, 0.2)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#E51636',
                            },
                            '& .MuiSelect-select': {
                              color: departmentFilter ? '#27251F' : 'rgba(39, 37, 31, 0.6)',
                            }
                          }}
                        >
                          <MenuItem value="">All Departments</MenuItem>
                          <MenuItem value="FOH">Front of House</MenuItem>
                          <MenuItem value="BOH">Back of House</MenuItem>
                        </Select>
                      </FormControl>

                      {user?.position !== 'Team Member' && (
                        <Button
                          variant="contained"
                          onClick={() => setIsAssignDialogOpen(true)}
                          startIcon={<AddIcon />}
                          sx={{
                            backgroundColor: '#E51636',
                            color: 'white',
                            borderRadius: '8px',
                            textTransform: 'none',
                            px: { xs: 2, sm: 3 },
                            py: 1,
                            height: '36px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            boxShadow: 'none',
                            width: '100%',
                            '&:hover': {
                              backgroundColor: '#D31430',
                              boxShadow: 'none',
                            }
                          }}
                        >
                          Assign Plan
                        </Button>
                      )}
                    </Box>
                  </div>
                  
                  <EmployeeProgress
                    key={filter}
                    employees={filteredEmployees}
                    onUpdateProgress={handleProgressUpdate}
                    filter={filter}
                  />
                </div>
              </TabsContent>

              <TabsContent value="plans" className="p-3 md:p-6">
                <TrainingPlanList
                  plans={filteredPlans}
                  onPlanUpdated={fetchData}
                />
              </TabsContent>

              <TabsContent value="calendar" className="p-3 md:p-6">
                <TrainingCalendar employees={employees} plans={trainingPlans} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Navigation */}
      {user && (
        <>
          <IconButton
            sx={{ position: 'fixed', bottom: 16, left: 16 }}
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <MobileNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            onOpen={() => setMobileOpen(true)}
          />
        </>
      )}

      {/* Assign Plan Dialog */}
      <AssignPlanDialog
        open={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        onAssign={handleAssignPlan}
        employees={employees}
        plans={trainingPlans}
      />

      {/* Create Plan Dialog */}
      <CreatePlanDialog
        open={isCreatePlanOpen}
        onClose={() => setIsCreatePlanOpen(false)}
        onSubmit={handleCreatePlan}
      />
    </div>
  );
};

export default TrainingProgress; 