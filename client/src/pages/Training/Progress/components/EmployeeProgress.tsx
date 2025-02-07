import React, { useState, useEffect, useMemo } from 'react';
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
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  ButtonGroup,
} from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon, GetApp as ExportIcon } from '@mui/icons-material';
import { Trash2, Filter } from 'lucide-react';
import { Employee, TrainingModule } from '@/types/training';
import TrainingModuleProgress from './TrainingModuleProgress';
import { useAuth } from '@/contexts/AuthContext';
import { EmployeeWithProgress, ExtendedTraineeProgress, ModuleProgress } from '../types';
import api from '@/lib/axios';
import { CSVLink } from 'react-csv';

interface ModuleWithId extends TrainingModule {
  _id: string;
}

interface ExtendedTrainingModule extends TrainingModule {
  _id: string;
}

interface CompletedByUser {
  name: string;
  position: string;
  firstName?: string;
  lastName?: string;
}

interface EmployeeProgressProps {
  employees: EmployeeWithProgress[];
  onUpdateProgress: (progress: ExtendedTraineeProgress) => Promise<void>;
  filter: 'active' | 'completed';
}

const isCompletedByInfo = (value: any): value is CompletedByUser => {
  return value && typeof value === 'object' && 'name' in value && 'position' in value;
};

const EmployeeProgress: React.FC<EmployeeProgressProps> = ({
  employees,
  onUpdateProgress,
  filter,
}): JSX.Element => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTeamMember = user?.position === 'Team Member';
  const canDelete = ['Director', 'Leader'].includes(user?.position || '');
  
  // State management
  const [selectedProgress, setSelectedProgress] = useState<ExtendedTraineeProgress | null>(null);
  const [deleteProgress, setDeleteProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [localEmployees, setLocalEmployees] = useState<EmployeeWithProgress[]>(employees);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithProgress | null>(null);

  // Update local state when props change
  useEffect(() => {
    setLocalEmployees(employees);
  }, [employees]);

  // Memoized filtered employees
  const filteredEmployees = useMemo(() => {
    console.log('Filtering employees with filter:', filter);
    console.log('Initial employees:', localEmployees);

    let result = isTeamMember
      ? localEmployees.filter((emp) => emp._id === user?._id)
      : localEmployees;

    // Filter out employees with invalid training progress
    result = result.map(emp => {
      console.log(`Processing ${emp.name}'s training progress:`, emp.trainingProgress);
      
      // Filter training progress based on status
      const validProgress = (emp.trainingProgress || []).filter(p => {
        const matchesFilter = filter === 'active' ? p.status === 'IN_PROGRESS' : p.status === 'COMPLETED';
        console.log(`Training progress ${p._id} for ${emp.name}: status=${p.status}, matchesFilter=${matchesFilter}`);
        return matchesFilter;
      });

      console.log(`${emp.name}'s filtered progress:`, validProgress);

      return {
        ...emp,
        trainingProgress: validProgress
      };
    });

    // Only include employees who have training progress after filtering
    result = result.filter(emp => emp.trainingProgress.length > 0);

    console.log('Final filtered employees:', result);
    return result;
  }, [localEmployees, isTeamMember, user?._id, filter]);

  const calculateProgress = (progress: ExtendedTraineeProgress): number => {
    if (!progress.moduleProgress || !progress.trainingPlan?.modules) return 0;
    const completedModules = progress.moduleProgress.filter((m) => m.completed).length;
    const totalModules = progress.trainingPlan.modules.length;
    return totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
  };

  const handleProgressUpdate = async (updatedProgress: ExtendedTraineeProgress | string): Promise<void> => {
    setLoading(true);
    try {
      const progressId = typeof updatedProgress === 'string' ? updatedProgress : updatedProgress._id;
      
      if (!progressId) {
        throw new Error('No progress ID available');
      }

      // Get the progress data using trainee-progress endpoint
      const response = await api.get(`/api/training/progress/${progressId}`);
      const fullProgress = response.data;

      if (!fullProgress) {
        throw new Error('Progress not found');
      }

      // Transform the completedBy data for each module
      if (fullProgress.moduleProgress) {
        fullProgress.moduleProgress = await Promise.all(
          fullProgress.moduleProgress.map(async (mp: ModuleProgress) => {
            const transformedModule: ModuleProgress = {
              moduleId: mp.moduleId,
              completed: mp.completed,
              completionPercentage: mp.completed ? 100 : 0,
              completedBy: undefined
            };

            if (mp.completedBy && typeof mp.completedBy === 'string') {
              try {
                const userResponse = await api.get(`/api/users/${mp.completedBy}`);
                if (userResponse.data && typeof userResponse.data.name === 'string') {
                  transformedModule.completedBy = userResponse.data.name;
                } else {
                  transformedModule.completedBy = 'Unknown User';
                }
              } catch (error) {
                console.error('Error fetching user:', error);
                transformedModule.completedBy = 'Unknown User';
              }
            }

            return transformedModule;
          })
        );
      }

      // Update local state with transformed data
      setLocalEmployees(prevEmployees => 
        prevEmployees.map(employee => ({
          ...employee,
          trainingProgress: employee.trainingProgress.map(p => 
            p._id === fullProgress._id ? fullProgress : p
          )
        }))
      );

      if (selectedProgress?._id === fullProgress._id) {
        setSelectedProgress(fullProgress);
      }

      onUpdateProgress(fullProgress);
      setRetryCount(0);
      setError(null);
    } catch (err: any) {
      console.error('Error updating progress:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update progress';
      setError(`${errorMessage}. ${retryCount < 3 ? 'Retrying...' : 'Please try again later.'}`);
      
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => handleProgressUpdate(updatedProgress), 1000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProgress) return;

    setLoading(true);
    try {
      const progressId = typeof deleteProgress === 'string' ? deleteProgress : deleteProgress;
      if (!progressId) throw new Error('No progress ID available');

      await api.delete(`/api/training/trainee-progress/${progressId}`);

      setLocalEmployees(prevEmployees => 
        prevEmployees.map(employee => ({
          ...employee,
          trainingProgress: employee.trainingProgress.filter(p => p._id !== progressId)
        }))
      );

      setDeleteProgress(null);
      onUpdateProgress(null as any);
    } catch (err) {
      console.error('Error deleting training progress:', err);
      setError('Failed to delete training progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (employee: EmployeeWithProgress, progress: ExtendedTraineeProgress) => {
    try {
      // Fetch the full training progress data
      const response = await api.get(`/api/training/progress/${progress._id}`);
      console.log('Fetched progress details:', response.data);

      // Transform the completedBy data
      if (response.data.moduleProgress) {
        const transformedModules = await Promise.all(
          response.data.moduleProgress.map(async (mp: ModuleProgress) => {
            // Log the raw module progress data
            console.log('Raw module progress:', mp);

            const transformedModule = {
              ...mp,
              moduleId: mp.moduleId,
              completed: mp.completed,
              completionPercentage: mp.completed ? 100 : 0,
              notes: mp.notes,
              completedAt: mp.completedAt,
              completedBy: mp.completedBy
            };

            // Log the transformed module
            console.log('Transformed module:', transformedModule);
            
            return transformedModule;
          })
        );

        console.log('All transformed modules:', transformedModules);

        const transformedProgress: ExtendedTraineeProgress = {
          ...response.data,
          moduleProgress: transformedModules,
          trainee: employee
        };

        console.log('Setting selected progress:', transformedProgress);
        setSelectedProgress(transformedProgress);
      } else {
        setSelectedProgress({
          ...response.data,
          trainee: employee
        });
      }
      setSelectedEmployee(employee);
    } catch (error) {
      console.error('Error fetching training progress:', error);
      setError('Failed to load training details. Please try again.');
    }
  };

  const handleCloseDialog = () => {
    // If we have a selected progress, update the parent before closing
    if (selectedProgress) {
      onUpdateProgress(selectedProgress);
    }
    setSelectedEmployee(null);
    setSelectedProgress(null);
  };

  const handleModuleComplete = async (moduleId: string, completed: boolean) => {
    if (!selectedProgress) return;
    
    // Only allow trainers and above to complete tasks
    if (!['Director', 'Leader', 'Trainer'].includes(user?.position || '')) {
      setError('Only trainers and above can mark tasks as complete.');
      return;
    }

    setLoading(true);
    try {
      // Calculate if this will complete all modules
      const currentModules = selectedProgress.moduleProgress || [];
      const updatedModules = currentModules.map(m => 
        m.moduleId === moduleId ? { ...m, completed } : m
      );
      const allModulesCompleted = updatedModules.every(m => m.completed);
      
      // Use trainee-progress endpoint for module updates
      const response = await api.patch(`/api/training/progress/${selectedProgress._id}/modules/${moduleId}`, {
        completed,
        notes: '',
        completedBy: completed ? user?._id : null,  // Send user ID instead of name
        status: allModulesCompleted ? 'COMPLETED' : 'IN_PROGRESS'  // Update status if all modules completed
      });
      
      // Transform the completedBy data for each module
      const updatedProgress = {
        ...response.data,
        moduleProgress: response.data.moduleProgress.map((mp: ModuleProgress) => ({
          ...mp,
          completedBy: typeof mp.completedBy === 'object' && mp.completedBy !== null 
            ? (mp.completedBy as CompletedByUser).name 
            : (mp.completedBy as string | undefined)
        }))
      };
      
      // Update the selected progress
      setSelectedProgress(updatedProgress);
      
      // Update the local employees state
      setLocalEmployees(prevEmployees => 
        prevEmployees.map(employee => ({
          ...employee,
          trainingProgress: employee.trainingProgress.map(p => 
            p._id === updatedProgress._id ? updatedProgress : p
          )
        }))
      );
      
      setError(null);
    } catch (error: any) {
      console.error('Error updating module progress:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update module progress';
      setError(`${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Only render if we have employees with training progress
  if (filteredEmployees.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          No training progress found. Assign training plans to employees to see their progress here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {filteredEmployees.map((employee) => (
        <Card 
          key={employee._id} 
          sx={{ 
            mb: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: (theme) => theme.shadows[4],
              borderColor: '#E51636'
            }
          }}
          onClick={() => employee.trainingProgress[0] && handleCardClick(employee, employee.trainingProgress[0])}
        >
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 600, color: '#E51636' }}>
                    {employee.name}
                  </Typography>
                  <Chip 
                    label={employee.position} 
                    size="small" 
                    sx={{ 
                      ml: 1, 
                      backgroundColor: '#E51636',
                      color: 'white',
                      fontWeight: 500
                    }} 
                  />
                </Box>
                <Typography color="textSecondary" variant="body2" gutterBottom>
                  {employee.department}
                </Typography>
              </Grid>
              {employee.trainingProgress?.map((progress) => (
                <Grid item xs={12} key={progress._id}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'background.paper', 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      position: 'relative'
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1, color: '#E51636' }}>
                        {progress.trainingPlan?.name || 'Unnamed Plan'}
                      </Typography>
                      {['Director', 'Leader', 'Trainer'].includes(user?.position || '') && (
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteProgress(progress._id);
                          }}
                          sx={{ 
                            color: '#E51636',
                            opacity: 0.7,
                            '&:hover': {
                              opacity: 1,
                              backgroundColor: 'rgba(229, 22, 54, 0.04)'
                            }
                          }}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      )}
                    </Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="body2" color="textSecondary" sx={{ mr: 2 }}>
                        Started: {new Date(progress.startDate).toLocaleDateString()}
                      </Typography>
                      <Chip 
                        label={`${Math.round(calculateProgress(progress))}% Complete`}
                        size="small"
                        sx={{
                          backgroundColor: calculateProgress(progress) === 100 ? '#4CAF50' : '#E51636',
                          color: 'white',
                          fontWeight: 500
                        }}
                      />
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={calculateProgress(progress)} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        mb: 1,
                        backgroundColor: (theme) => theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: calculateProgress(progress) === 100 ? '#4CAF50' : '#E51636'
                        }
                      }} 
                    />
                    <Typography variant="body2" color="textSecondary">
                      {progress.moduleProgress?.filter((m) => m.completed).length || 0} of {progress.trainingPlan?.modules?.length || 0} tasks completed
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      ))}

      {/* Task List Dialog */}
      <Dialog 
        open={Boolean(selectedEmployee && selectedProgress)} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderTop: '4px solid #E51636'
          }
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {selectedEmployee && selectedProgress && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#E51636' }}>
                    {selectedProgress.trainingPlan?.name}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary">
                    {selectedEmployee.name} - {selectedEmployee.position}
                  </Typography>
                </Box>
                <IconButton onClick={handleCloseDialog} size="large">
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pb: 4 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              {user?.position === 'Team Member' && (
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 3,
                    borderRadius: '8px',
                    '& .MuiAlert-icon': {
                      color: '#1D4ED8'
                    },
                    '& .MuiAlert-message': {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1
                    }
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1D4ED8' }}>
                    Training Completion Instructions
                  </Typography>
                  <Typography variant="body2">
                    Please work with your Trainer, Leader, or Director to mark your training tasks as complete. Only trainers and above can check off training items to ensure proper verification of your progress.
                  </Typography>
                </Alert>
              )}

              <Box sx={{ mb: 3 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={calculateProgress(selectedProgress)}
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: (theme) => theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      backgroundColor: calculateProgress(selectedProgress) === 100 ? '#4CAF50' : '#E51636'
                    }
                  }}
                />
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="body2" color="textSecondary">
                    Overall Progress
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#E51636', fontWeight: 600 }}>
                    {Math.round(calculateProgress(selectedProgress))}% Complete
                  </Typography>
                </Box>
              </Box>

              <List sx={{ 
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                {((selectedProgress.trainingPlan?.modules || []) as ExtendedTrainingModule[]).map((module, index) => {
                  const moduleProgress = selectedProgress.moduleProgress?.find(
                    (mp) => mp.moduleId === module._id
                  );
                  return (
                    <ListItem
                      key={module._id || index}
                      sx={{
                        borderBottom: index < (selectedProgress.trainingPlan?.modules?.length || 0) - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(229, 22, 54, 0.04)'
                        }
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={moduleProgress?.completed || false}
                          onChange={(e) => handleModuleComplete(module._id, e.target.checked)}
                          disabled={loading || !['Director', 'Leader', 'Trainer'].includes(user?.position || '')}
                          sx={{
                            color: '#E51636',
                            '&.Mui-checked': {
                              color: '#4CAF50'
                            }
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 500,
                              textDecoration: moduleProgress?.completed ? 'line-through' : 'none',
                              color: moduleProgress?.completed ? 'text.secondary' : '#E51636'
                            }}
                          >
                            {module.name}
                          </Typography>
                        }
                        secondary={
                          <>
                            {module.description && (
                              <Typography 
                                variant="body2" 
                                component="span"
                                color="textSecondary"
                                sx={{
                                  display: 'block',
                                  mt: 0.5,
                                  textDecoration: moduleProgress?.completed ? 'line-through' : 'none',
                                  opacity: moduleProgress?.completed ? 0.7 : 1
                                }}
                              >
                                {module.description}
                              </Typography>
                            )}
                            {moduleProgress?.completed && (
                              <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {moduleProgress.completedBy && (
                                  <Typography 
                                    variant="caption"
                                    component="div"
                                    sx={{ 
                                      color: 'text.secondary',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.5
                                    }}
                                  >
                                    <span style={{ fontWeight: 500 }}>Completed by:</span>
                                    {typeof moduleProgress.completedBy === 'object' && moduleProgress.completedBy !== null ? (
                                      <>
                                        {(moduleProgress.completedBy as CompletedByUser).name}
                                        <Chip 
                                          label={(moduleProgress.completedBy as CompletedByUser).position} 
                                          size="small"
                                          sx={{ 
                                            height: '16px',
                                            fontSize: '0.65rem',
                                            backgroundColor: '#E51636',
                                            color: 'white'
                                          }}
                                        />
                                      </>
                                    ) : (
                                      moduleProgress.completedBy
                                    )}
                                  </Typography>
                                )}
                                {moduleProgress.completedAt && (
                                  <Typography 
                                    variant="caption"
                                    component="div"
                                    sx={{ 
                                      color: 'text.secondary',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.5
                                    }}
                                  >
                                    <span style={{ fontWeight: 500 }}>Completed on:</span>
                                    {new Date(moduleProgress.completedAt).toLocaleDateString()} at {new Date(moduleProgress.completedAt).toLocaleTimeString()}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </>
                        }
                      />
                      {moduleProgress?.completed && (
                        <Chip 
                          label="Completed"
                          size="small"
                          sx={{ 
                            ml: 2,
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            fontWeight: 500
                          }}
                        />
                      )}
                    </ListItem>
                  );
                })}
              </List>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button 
                onClick={handleCloseDialog} 
                variant="contained"
                sx={{ 
                  backgroundColor: '#E51636',
                  '&:hover': {
                    backgroundColor: '#C41230'
                  }
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteProgress)}
        onClose={() => setDeleteProgress(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderTop: '4px solid #E51636'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#E51636' }}>
            Confirm Deletion
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this training progress? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button
            onClick={() => setDeleteProgress(null)}
            variant="outlined"
            sx={{ 
              borderColor: '#E51636',
              color: '#E51636',
              '&:hover': {
                borderColor: '#C41230',
                backgroundColor: 'rgba(229, 22, 54, 0.04)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            disabled={loading}
            sx={{ 
              ml: 2,
              backgroundColor: '#E51636',
              '&:hover': {
                backgroundColor: '#C41230'
              }
            }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeProgress;