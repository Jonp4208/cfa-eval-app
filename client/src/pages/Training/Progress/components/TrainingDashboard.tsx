import React from 'react';
import {
  Box,
  Grid,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Employee } from '../../../../types';
import { TrainingPlan, TraineeProgress } from '../../../../types/training';
import { SimplifiedTrainingPlan, EmployeeWithProgress, ExtendedTraineeProgress } from '../types';
import useTrainingData from '../../../../hooks/useTrainingData';
import StatCard from './StatCard';
import DepartmentProgress from './DepartmentProgress';
import UpcomingTrainings from './UpcomingTrainings';
import {
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  MenuBook as MenuBookIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

interface TrainingDashboardProps {
  employees: EmployeeWithProgress[];
  plans: SimplifiedTrainingPlan[];
}

const TrainingDashboard: React.FC<TrainingDashboardProps> = ({ employees, plans }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const trainingData = useTrainingData(employees);

  const totalEmployees = employees.length;
  const totalPlans = plans.length;
  const totalModules = plans.reduce((total, plan) => total + (plan.modules?.length || 0), 0);
  
  // Calculate average completion percentage
  const averageCompletion = employees.reduce((total, emp) => {
    const progressPercentages = (emp.trainingProgress || []).map(tp => {
      const totalModules = tp.trainingPlan?.modules?.length || 0;
      if (totalModules === 0) return 0;
      const completedModules = tp.moduleProgress?.filter(mp => mp.completed)?.length || 0;
      return (completedModules / totalModules) * 100;
    });
    
    const avgProgress = progressPercentages.length > 0
      ? progressPercentages.reduce((sum, p) => sum + p, 0) / progressPercentages.length
      : 0;
      
    return total + avgProgress;
  }, 0) / (totalEmployees || 1);

  const handleEmployeeClick = (employeeId: string) => {
    // Navigate to employee details page or open a modal with more information
    // Add your navigation or modal logic here
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: isMobile ? 0 : 2 }}>
        <Grid container spacing={isMobile ? 2 : 3}>
          {/* Key Statistics */}
          <Grid item xs={6} sm={6} md={3}>
            <StatCard
              title="Total Employees"
              value={totalEmployees}
              color="#2196F3"
              icon={<PersonIcon />}
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard
              title="Training Plans"
              value={totalPlans}
              color="#4CAF50"
              icon={<AssignmentIcon />}
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard
              title="Total Modules"
              value={totalModules}
              color="#FF9800"
              icon={<MenuBookIcon />}
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard
              title="Average Completion"
              value={`${Math.round(averageCompletion)}%`}
              color="#E91E63"
              icon={<TrendingUpIcon />}
            />
          </Grid>

          {/* Department Progress */}
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              bgcolor: 'background.paper',
              borderRadius: { xs: 2, sm: 3 },
              p: { xs: 2, sm: 3 },
              height: '100%',
              boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)'
            }}>
              <Typography variant="h6" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Department Progress
              </Typography>
              <DepartmentProgress data={trainingData.departmentProgress} />
            </Box>
          </Grid>

          {/* Upcoming Trainings */}
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              bgcolor: 'background.paper',
              borderRadius: { xs: 2, sm: 3 },
              p: { xs: 2, sm: 3 },
              height: '100%',
              boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)'
            }}>
              <Typography variant="h6" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Upcoming Trainings
              </Typography>
              <UpcomingTrainings 
                data={trainingData.upcomingTrainings} 
                onEmployeeClick={handleEmployeeClick}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default TrainingDashboard;