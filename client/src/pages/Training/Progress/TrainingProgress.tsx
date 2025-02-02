import React, { useState, useEffect, useMemo } from 'react';
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
import { Employee } from '../../../types';
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

const TrainingProgress: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('progress');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainingPlans, setTrainingPlans] = useState<SimplifiedTrainingPlan[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithProgress[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const { user } = useAuth();
  const [filter, setFilter] = useState<'active' | 'completed'>('active');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansResponse, employeesResponse] = await Promise.all([
        api.get('/api/training/plans'),
        api.get('/api/training/employees/training-progress')
      ]);
      
      const plansWithId = plansResponse.data.map((plan: any) => ({
        id: plan._id,
        _id: plan._id,
        name: plan.name,
        startDate: plan.createdAt || new Date().toISOString(),
        severity: plan.severity || 1,
        type: plan.type || 'REGULAR',
        department: plan.department || 'FOH',
        numberOfDays: plan.numberOfDays || 1,
        modules: plan.modules || [],
        includesCoreValues: Boolean(plan.includesCoreValues),
        includesBrandStandards: Boolean(plan.includesBrandStandards),
        isTemplate: Boolean(plan.isTemplate),
        createdBy: {
          _id: plan.createdBy?._id || 'system',
          firstName: plan.createdBy?.firstName || 'System',
          lastName: plan.createdBy?.lastName || 'User'
        },
        store: plan.store || 'default',
        createdAt: new Date(plan.createdAt || new Date()),
        updatedAt: new Date(plan.updatedAt || new Date()),
        description: plan.description
      })) as SimplifiedTrainingPlan[];
      
      // Always update plans to ensure UI is in sync
      setTrainingPlans(plansWithId);
      
      const employeesWithId = employeesResponse.data.map((emp: any) => {
        const mappedTrainingProgress = Array.isArray(emp.trainingProgress) 
          ? emp.trainingProgress.map((progress: any) => ({
              ...progress,
              trainingPlan: progress.trainingPlan ? {
                id: progress.trainingPlan._id,
                _id: progress.trainingPlan._id,
                name: progress.trainingPlan.name,
                startDate: progress.trainingPlan.createdAt || new Date().toISOString(),
                severity: progress.trainingPlan.severity || 1,
                type: progress.trainingPlan.type || 'REGULAR',
                department: progress.trainingPlan.department || 'FOH',
                numberOfDays: progress.trainingPlan.numberOfDays || 1,
                modules: progress.trainingPlan.modules || [],
                includesCoreValues: Boolean(progress.trainingPlan.includesCoreValues),
                includesBrandStandards: Boolean(progress.trainingPlan.includesBrandStandards),
                isTemplate: Boolean(progress.trainingPlan.isTemplate),
                createdBy: {
                  _id: progress.trainingPlan.createdBy?._id || 'system',
                  firstName: progress.trainingPlan.createdBy?.firstName || 'System',
                  lastName: progress.trainingPlan.createdBy?.lastName || 'User'
                },
                store: progress.trainingPlan.store || 'default',
                createdAt: new Date(progress.trainingPlan.createdAt || new Date()),
                updatedAt: new Date(progress.trainingPlan.updatedAt || new Date()),
                description: progress.trainingPlan.description
              } : undefined,
              moduleProgress: Array.isArray(progress.moduleProgress) ? progress.moduleProgress : []
            }))
          : [];
        
        return {
          _id: emp._id,
          id: emp._id,
          name: emp.name,
          position: emp.position,
          department: emp.department || (Array.isArray(emp.departments) && emp.departments.length > 0 ? emp.departments[0] : 'FOH'),
          startDate: emp.startDate,
          trainingProgress: mappedTrainingProgress,
          moduleProgress: Array.isArray(emp.moduleProgress) ? emp.moduleProgress : []
        } as EmployeeWithProgress;
      });
      
      // Always update employees to ensure UI is in sync
      setEmployees(employeesWithId);
    } catch (err) {
      console.error('Error fetching training progress:', err);
      setError('Failed to load training progress data');
    } finally {
      setLoading(false);
    }
  };

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
      
      // Refresh data after successful assignment
      await fetchData();
      setIsAssignDialogOpen(false);
    } catch (err) {
      console.error('Error assigning training plan:', err);
      setError('Failed to assign training plan');
    }
  };

  const handleCreatePlan = async (plan: NewTrainingPlan) => {
    try {
      const response = await api.post('/api/training/plans', plan);
      const newPlan = {
        id: response.data._id,
        name: response.data.name,
        startDate: response.data.createdAt || new Date().toISOString(),
        severity: response.data.severity || 1
      } as SimplifiedTrainingPlan;
      setTrainingPlans([...trainingPlans, newPlan]);
    } catch (err) {
      console.error('Error creating training plan:', err);
      setError('Failed to create training plan');
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
      // Only fetch employee progress data since that's what changed
      const { data: employeesData } = await api.get('/api/training/employees/training-progress');
      
      // Update only the employees that have changed
      const updatedEmployees: EmployeeWithProgress[] = employeesData.map((emp: any) => {
        const mappedTrainingProgress = Array.isArray(emp.trainingProgress) 
          ? emp.trainingProgress.map((progress: any) => ({
              ...progress,
              trainingPlan: progress.trainingPlan ? {
                id: progress.trainingPlan._id,
                _id: progress.trainingPlan._id,
                name: progress.trainingPlan.name,
                startDate: progress.trainingPlan.createdAt || new Date().toISOString(),
                severity: progress.trainingPlan.severity || 1,
                type: progress.trainingPlan.type || 'REGULAR',
                department: progress.trainingPlan.department || 'FOH',
                numberOfDays: progress.trainingPlan.numberOfDays || 1,
                modules: progress.trainingPlan.modules || [],
                includesCoreValues: Boolean(progress.trainingPlan.includesCoreValues),
                includesBrandStandards: Boolean(progress.trainingPlan.includesBrandStandards),
                isTemplate: Boolean(progress.trainingPlan.isTemplate),
                createdBy: {
                  _id: progress.trainingPlan.createdBy?._id || 'system',
                  firstName: progress.trainingPlan.createdBy?.firstName || 'System',
                  lastName: progress.trainingPlan.createdBy?.lastName || 'User'
                },
                store: progress.trainingPlan.store || 'default',
                createdAt: new Date(progress.trainingPlan.createdAt || new Date()),
                updatedAt: new Date(progress.trainingPlan.updatedAt || new Date()),
                description: progress.trainingPlan.description
              } : undefined,
              moduleProgress: Array.isArray(progress.moduleProgress) ? progress.moduleProgress : []
            }))
          : [];
        
        return {
          _id: emp._id,
          id: emp._id,
          name: emp.name,
          position: emp.position,
          department: emp.department || (Array.isArray(emp.departments) && emp.departments.length > 0 ? emp.departments[0] : 'FOH'),
          startDate: emp.startDate,
          trainingProgress: mappedTrainingProgress,
          moduleProgress: Array.isArray(emp.moduleProgress) ? emp.moduleProgress : []
        } as EmployeeWithProgress;
      });

      // Batch update the state with proper typing
      setEmployees((prevEmployees: EmployeeWithProgress[]) => {
        const employeeMap = new Map<string, EmployeeWithProgress>();
        updatedEmployees.forEach(emp => employeeMap.set(emp._id, emp));
        return prevEmployees.map(emp => employeeMap.get(emp._id) || emp);
      });
    } catch (err) {
      console.error('Error updating employee progress:', err);
      setError('Failed to update progress');
    }
  };

  const filteredEmployees = useMemo(() => {
    console.log('Filtering Employees:', employees);
    return employees.filter(employee => {
      const matchesSearch = 
        employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = !departmentFilter || employee.department === departmentFilter;
      
      // Filter based on training status
      const hasTrainingProgress = employee.trainingProgress && employee.trainingProgress.length > 0;
      if (!hasTrainingProgress) return false;

      const hasActiveTraining = employee.trainingProgress.some(progress => progress.status === 'IN_PROGRESS');
      const hasCompletedTraining = employee.trainingProgress.some(progress => progress.status === 'COMPLETED');

      if (filter === 'active') {
        return matchesSearch && matchesDepartment && hasActiveTraining;
      } else if (filter === 'completed') {
        return matchesSearch && matchesDepartment && hasCompletedTraining;
      }

      return matchesSearch && matchesDepartment;
    });
  }, [employees, searchQuery, departmentFilter, filter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E51636]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="container mx-auto py-8 space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Training</h1>
                <p className="text-white/80 mt-2 text-lg">Manage and track team training progress</p>
              </div>
              {user?.position !== 'Team Member' && (
                <button
                  onClick={() => setIsCreatePlanOpen(true)}
                  className="w-full md:w-auto bg-white hover:bg-gray-50 text-[#E51636] flex items-center justify-center gap-2 py-2.5 px-4 rounded-[8px] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-base font-medium">New Training Plan</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="bg-white rounded-[20px] shadow-md">
          <CardContent className="p-0">
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b overflow-x-auto">
                <TabsList className="h-12 w-full justify-start gap-2 bg-transparent px-4">
                  <TabsTrigger
                    value="dashboard"
                    className="data-[state=active]:bg-[#E51636] data-[state=active]:text-white rounded-full px-4 whitespace-nowrap text-sm"
                  >
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger
                    value="progress"
                    className="data-[state=active]:bg-[#E51636] data-[state=active]:text-white rounded-full px-4 whitespace-nowrap text-sm"
                  >
                    {user?.position === 'Team Member' ? 'My Progress' : 'Team Training'}
                  </TabsTrigger>
                  {user?.position !== 'Team Member' && (
                    <TabsTrigger
                      value="plans"
                      className="data-[state=active]:bg-[#E51636] data-[state=active]:text-white rounded-full px-4 whitespace-nowrap text-sm"
                    >
                      Training Plans
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value="calendar"
                    className="data-[state=active]:bg-[#E51636] data-[state=active]:text-white rounded-full px-4 whitespace-nowrap text-sm"
                  >
                    Calendar
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="dashboard" className="p-6">
                <TrainingDashboard employees={employees} plans={trainingPlans} />
              </TabsContent>

              <TabsContent value="progress" className="p-6">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: { xs: 'stretch', sm: 'space-between' },
                      width: '100%',
                      alignItems: { xs: 'stretch', sm: 'center' }
                    }}>
                      <ButtonGroup 
                        variant="outlined" 
                        sx={{ 
                          '& .MuiButton-root': {
                            borderColor: 'rgba(39, 37, 31, 0.1)',
                            color: 'rgba(39, 37, 31, 0.6)',
                            textTransform: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            px: 2.5,
                            py: 0.75,
                            minWidth: '100px',
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

                      <Box sx={{ 
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        alignItems: { xs: 'stretch', sm: 'center' },
                        ml: { xs: 0, sm: 2 }
                      }}>
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
                            width: { xs: '100%', sm: '300px' },
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'white',
                              borderRadius: '12px',
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
                              '&::placeholder': {
                                color: 'rgba(39, 37, 31, 0.6)',
                                opacity: 1,
                              },
                            }
                          }}
                        />

                        <FormControl sx={{ 
                          width: { xs: '100%', sm: '200px' }
                        }}>
                          <Select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            displayEmpty
                            renderValue={departmentFilter !== '' ? undefined : () => "Department"}
                            sx={{
                              backgroundColor: 'white',
                              borderRadius: '12px',
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
                              borderRadius: '12px',
                              textTransform: 'none',
                              px: 3,
                              py: 1.5,
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              boxShadow: 'none',
                              width: { xs: '100%', sm: 'auto' },
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
                    </Box>
                  </div>
                  
                  <EmployeeProgress
                    employees={filteredEmployees}
                    onUpdateProgress={handleProgressUpdate}
                  />
                </div>
              </TabsContent>

              <TabsContent value="plans" className="p-6">
                <TrainingPlanList
                  plans={trainingPlans}
                  onPlanUpdated={fetchData}
                />
              </TabsContent>

              <TabsContent value="calendar" className="p-6">
                <TrainingCalendar employees={employees} plans={trainingPlans} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Navigation */}
      {isMobile && (
        <>
          <IconButton
            sx={{ position: 'fixed', bottom: 16, left: 16 }}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <MobileNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onOpen={() => setDrawerOpen(true)}
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