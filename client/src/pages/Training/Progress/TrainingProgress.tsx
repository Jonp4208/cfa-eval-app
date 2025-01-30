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
import { TrainingPlan, Employee, NewTrainingPlan, TraineeProgress } from '../../../types/training';
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
  const navItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, value: 'dashboard' },
    { label: 'Employee Progress', icon: <PeopleIcon />, value: 'progress' },
    { label: 'Training Plans', icon: <DescriptionIcon />, value: 'plans' },
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

interface EmployeeWithProgress extends Employee {
  moduleProgress: TraineeProgress['moduleProgress'];
  trainingPlan?: {
    name: string;
  };
}

const TrainingProgress: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithProgress[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const { user } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [activePlansResponse, templatesResponse, employeesResponse] = await Promise.all([
        api.get('/api/training/plans/active'),
        api.get('/api/training/templates'),
        api.get('/api/training/employees/training-progress')
      ]);
      
      // Combine active plans and templates
      const allPlans = [...activePlansResponse.data, ...templatesResponse.data];
      setTrainingPlans(allPlans);
      setEmployees(employeesResponse.data);
    } catch (err) {
      setError('Failed to load training progress data');
      console.error('Error fetching training progress:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignPlan = async (employeeId: string, planId: string, startDate: Date) => {
    try {
      await api.post('/api/training/plans/assign', {
        employeeId,
        planId,
        startDate,
      });

      await fetchData(); // Refresh data after assignment
      setIsAssignDialogOpen(false);
    } catch (err) {
      setError('Failed to assign training plan');
      console.error('Error assigning training plan:', err);
    }
  };

  const handleCreatePlan = async (plan: NewTrainingPlan) => {
    try {
      const response = await api.post('/api/training/plans', plan);
      setTrainingPlans([...trainingPlans, response.data]);
      setIsCreatePlanOpen(false);
    } catch (err) {
      console.error('Error creating training plan:', err);
      setError('Failed to create training plan');
      throw err;
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = 
        employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = !departmentFilter || employee.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    });
  }, [employees, searchQuery, departmentFilter]);

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
                    {user?.position === 'Team Member' ? 'My Progress' : 'Team Progress'}
                  </TabsTrigger>
                  <TabsTrigger
                    value="plans"
                    className="data-[state=active]:bg-[#E51636] data-[state=active]:text-white rounded-full px-4 whitespace-nowrap text-sm"
                  >
                    Training Plans
                  </TabsTrigger>
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
                    <TextField
                      placeholder="Search employees..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                      fullWidth
                    />
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>Department</InputLabel>
                      <Select
                        value={departmentFilter}
                        label="Department"
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="FOH">Front of House</MenuItem>
                        <MenuItem value="BOH">Back of House</MenuItem>
                      </Select>
                    </FormControl>
                    {user?.position !== 'Team Member' && (
                      <Button
                        variant="contained"
                        onClick={() => setIsAssignDialogOpen(true)}
                        startIcon={<AddIcon />}
                      >
                        Assign Plan
                      </Button>
                    )}
                  </div>
                  
                  <EmployeeProgress
                    employees={filteredEmployees}
                    onUpdateProgress={() => fetchData()}
                  />
                </div>
              </TabsContent>

              <TabsContent value="plans" className="p-6">
                <TrainingPlanList plans={trainingPlans} />
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