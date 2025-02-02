import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useTheme,
  useMediaQuery,
  Button,
  Alert,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Trash2 } from 'lucide-react';
import { Employee } from '@/types/training';
import TrainingModuleProgress from './TrainingModuleProgress';
import { useAuth } from '@/contexts/AuthContext';
import { EmployeeWithProgress, ExtendedTraineeProgress } from '../types';
import api from '@/lib/axios';

interface EmployeeProgressProps {
  employees: EmployeeWithProgress[];
  onUpdateProgress: () => void;
}

const EmployeeProgress: React.FC<EmployeeProgressProps> = ({
  employees,
  onUpdateProgress,
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTeamMember = user?.position === 'Team Member';
  const canDelete = ['Director', 'Leader'].includes(user?.position || '');
  const [selectedProgress, setSelectedProgress] = useState<ExtendedTraineeProgress | null>(null);
  const [deleteProgress, setDeleteProgress] = useState<ExtendedTraineeProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localEmployees, setLocalEmployees] = useState(employees);

  useEffect(() => {
    setLocalEmployees(employees);
  }, [employees]);

  const getProgressPercentage = (progress: ExtendedTraineeProgress) => {
    if (!progress.trainingPlan?.modules?.length) return 0;

    const totalModules = progress.trainingPlan.modules.length;
    const completedModules = progress.moduleProgress?.filter(mp => mp.completed).length || 0;

    return totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  };

  const handleDelete = async () => {
    if (!deleteProgress?._id) return;

    try {
      await api.delete(`/api/training/trainee-progress/${deleteProgress._id}`);
      setDeleteProgress(null);
      onUpdateProgress();
    } catch (err) {
      console.error('Error deleting training progress:', err);
      setError('Failed to delete training progress. Please try again.');
    }
  };

  const handleProgressUpdate = (updatedProgress: ExtendedTraineeProgress) => {
    // Update the local state first
    setLocalEmployees(prevEmployees => {
      return prevEmployees.map(employee => {
        if (employee.trainingProgress.some(p => p._id === updatedProgress._id)) {
          return {
            ...employee,
            trainingProgress: employee.trainingProgress.map(p => 
              p._id === updatedProgress._id ? updatedProgress : p
            )
          };
        }
        return employee;
      });
    });

    // Then trigger the parent update
    onUpdateProgress();
  };

  // Use localEmployees instead of employees for rendering
  const displayEmployees = isTeamMember
    ? localEmployees.filter((emp) => emp._id === user?._id)
    : localEmployees;

  // Filter employees to only show those with training plans
  const filteredEmployees = displayEmployees.filter(employee => 
    employee.trainingProgress && employee.trainingProgress.length > 0
  );

  return (
    <>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {filteredEmployees.map((employee) => (
          <Grid item xs={12} key={employee._id}>
            <Grid container spacing={2}>
              {employee.trainingProgress.map((progress) => (
                <Grid item xs={12} sm={6} md={4} key={progress._id}>
                  <Card 
                    sx={{ 
                      backgroundColor: 'white',
                      borderRadius: '20px',
                      boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
                      border: '1px solid',
                      borderColor: 'rgba(39, 37, 31, 0.1)',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0px 4px 6px rgba(16, 24, 40, 0.1), 0px 2px 4px rgba(16, 24, 40, 0.06)',
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2
                      }}>
                        <Box 
                          onClick={() => setSelectedProgress(progress)}
                          sx={{ 
                            flex: 1,
                            cursor: 'pointer'
                          }}
                        >
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              color: '#27251F',
                              fontWeight: 500,
                              mb: 1
                            }}
                          >
                            {employee.name}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'rgba(39, 37, 31, 0.6)',
                              mb: 1
                            }}
                          >
                            {progress.trainingPlan?.name}
                          </Typography>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            mb: 2
                          }}>
                            <Chip
                              label={progress.status.replace('_', ' ')}
                              size="small"
                              sx={{
                                borderRadius: '16px',
                                backgroundColor: progress.status === 'COMPLETED' 
                                  ? 'rgba(22, 163, 74, 0.1)'
                                  : progress.status === 'IN_PROGRESS'
                                  ? 'rgba(245, 158, 11, 0.1)'
                                  : 'rgba(39, 37, 31, 0.1)',
                                color: progress.status === 'COMPLETED'
                                  ? 'rgb(22, 163, 74)'
                                  : progress.status === 'IN_PROGRESS'
                                  ? 'rgb(245, 158, 11)'
                                  : 'rgba(39, 37, 31, 0.6)',
                                fontWeight: 500,
                                textTransform: 'capitalize'
                              }}
                            />
                          </Box>
                        </Box>
                        {canDelete && (
                          <IconButton
                            size="small"
                            onClick={() => setDeleteProgress(progress)}
                            sx={{
                              color: 'rgba(39, 37, 31, 0.6)',
                              '&:hover': {
                                color: '#DC2626',
                                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                              },
                            }}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        )}
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={getProgressPercentage(progress)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'rgba(39, 37, 31, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#E51636',
                            borderRadius: 3
                          }
                        }}
                      />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(39, 37, 31, 0.6)',
                          fontWeight: 500,
                          mt: 1,
                          textAlign: 'right'
                        }}
                      >
                        {getProgressPercentage(progress)}% Complete
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        ))}

        {filteredEmployees.length === 0 && (
          <Grid item xs={12}>
            <Card sx={{ 
              backgroundColor: 'white',
              borderRadius: '20px',
              boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
              border: '1px solid',
              borderColor: 'rgba(39, 37, 31, 0.1)'
            }}>
              <CardContent sx={{ p: 6 }}>
                <Typography 
                  align="center" 
                  sx={{ 
                    color: 'rgba(39, 37, 31, 0.6)',
                    fontSize: '0.875rem'
                  }}
                >
                  No employees with assigned training plans found.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Training Progress Dialog */}
      <Dialog
        open={!!selectedProgress}
        onClose={() => setSelectedProgress(null)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : '20px',
            m: isMobile ? 0 : 2
          }
        }}
      >
        <DialogTitle sx={{ 
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'rgba(39, 37, 31, 0.1)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {selectedProgress?.trainingPlan?.name}
          </Typography>
          <IconButton
            edge="end"
            onClick={() => setSelectedProgress(null)}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedProgress && (
            <Box sx={{ mt: 2 }}>
              <TrainingModuleProgress
                trainingProgress={selectedProgress}
                onProgressUpdate={() => {
                  if (selectedProgress) {
                    handleProgressUpdate(selectedProgress);
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteProgress}
        onClose={() => setDeleteProgress(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            m: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          p: 3,
          borderBottom: '1px solid',
          borderColor: 'rgba(39, 37, 31, 0.1)'
        }}>
          Delete Training Progress
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Typography>
            Are you sure you want to delete this training progress? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3,
          borderTop: '1px solid',
          borderColor: 'rgba(39, 37, 31, 0.1)'
        }}>
          <Button 
            onClick={() => setDeleteProgress(null)}
            sx={{
              color: 'rgba(39, 37, 31, 0.6)',
              '&:hover': {
                backgroundColor: 'rgba(39, 37, 31, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete}
            variant="contained"
            sx={{
              backgroundColor: '#DC2626',
              color: 'white',
              '&:hover': {
                backgroundColor: '#B91C1C'
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EmployeeProgress; 