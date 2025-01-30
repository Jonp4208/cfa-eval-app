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
import { Employee, TrainingPlan } from '../../../../types';
import useTrainingData from '../../../../hooks/useTrainingData';
import StatCard from './StatCard';
import DepartmentProgress from './DepartmentProgress';
import UpcomingTrainings from './UpcomingTrainings';

interface TrainingDashboardProps {
  employees: Employee[];
  plans: TrainingPlan[];
}

const TrainingDashboard: React.FC<TrainingDashboardProps> = ({ employees, plans }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { totalEmployees, employeesInTraining, completedTrainings, departmentProgress, upcomingTrainings, overallProgress } = useTrainingData(employees);

  const handleEmployeeClick = (employeeId: string) => {
    // Navigate to employee details page or open a modal with more information
    console.log(`Clicked on employee with ID: ${employeeId}`);
    // Add your navigation or modal logic here
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: isMobile ? 1 : 2 }}>
        <Grid container spacing={isMobile ? 1.5 : 3}>
          {/* Key Statistics */}
          <Grid item xs={6} sm={6} md={3}>
            <StatCard
              title="Total"
              value={totalEmployees}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard
              title="In Training"
              value={employeesInTraining}
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard
              title="Completed"
              value={completedTrainings}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard
              title="Progress"
              value={`${Math.round(overallProgress)}%`}
              color="#ed6c02"
              progress={overallProgress}
            />
          </Grid>

          {/* Department Progress */}
          <Grid item xs={12} md={6}>
            <DepartmentProgress data={departmentProgress} />
          </Grid>

          {/* Upcoming Trainings */}
          <Grid item xs={12} md={6}>
            <UpcomingTrainings data={upcomingTrainings} onEmployeeClick={handleEmployeeClick} />
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default TrainingDashboard;