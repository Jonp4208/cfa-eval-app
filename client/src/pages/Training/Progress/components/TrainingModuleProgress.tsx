import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Checkbox,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ButtonGroup,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Check as CheckIcon } from '@mui/icons-material';
import { TrainingPlan, TrainingProgress } from '@/types/training';
import { useAuth } from '../../../../hooks/useAuth';
import api from '@/lib/axios';

// Helper function to check if user can complete training tasks
const canCompleteTraining = (user: any) => {
  // Directors, Leaders, and Trainers can complete any training
  return ['Director', 'Leader', 'Trainer'].includes(user?.position);
};

// Helper function to check if user can view this training
const canViewTraining = (user: any, traineeId: string) => {
  // Directors, Leaders, and Trainers can view all training
  if (['Director', 'Leader', 'Trainer'].includes(user?.position)) {
    return true;
  }
  
  // Team Members can view their own training
  if (user?.position === 'Team Member') {
    return true; // Allow team members to view training assigned to them
  }

  return false;
};

interface TrainingModuleProgressProps {
  trainingProgress: TrainingProgress;
  onProgressUpdate: () => void;
}

const TrainingModuleProgress: React.FC<TrainingModuleProgressProps> = ({
  trainingProgress,
  onProgressUpdate,
}): JSX.Element => {
  console.log('TrainingModuleProgress received:', {
    trainingProgress,
    type: typeof trainingProgress,
    isString: typeof trainingProgress === 'string',
    hasTrainingPlan: trainingProgress && typeof trainingProgress === 'object' && 'trainingPlan' in trainingProgress,
    trainingPlanType: trainingProgress?.trainingPlan && typeof trainingProgress.trainingPlan
  });
  
  // Validate training progress data
  if (!trainingProgress) {
    console.error('Training progress is null or undefined');
    return (
      <Alert 
        severity="error" 
        sx={{ 
          borderRadius: '12px',
          '& .MuiAlert-icon': {
            color: '#DC2626'
          }
        }}
      >
        No training progress data available. Please try refreshing the page.
      </Alert>
    );
  }

  if (typeof trainingProgress === 'string') {
    console.error('Training progress is a string instead of an object:', trainingProgress);
    return (
      <Alert 
        severity="error" 
        sx={{ 
          borderRadius: '12px',
          '& .MuiAlert-icon': {
            color: '#DC2626'
          }
        }}
      >
        Invalid training progress format. Please try refreshing the page.
      </Alert>
    );
  }

  // Check if we need to fetch the training plan
  if (typeof trainingProgress.trainingPlan === 'string') {
    console.error('Training plan is not populated:', trainingProgress.trainingPlan);
    return (
      <Alert 
        severity="error" 
        sx={{ 
          borderRadius: '12px',
          '& .MuiAlert-icon': {
            color: '#DC2626'
          }
        }}
      >
        Training plan data is not loaded. Please try refreshing the page.
      </Alert>
    );
  }

  // Validate training plan
  if (!trainingProgress.trainingPlan || typeof trainingProgress.trainingPlan !== 'object') {
    console.error('Training plan is invalid:', trainingProgress.trainingPlan);
    return (
      <Alert 
        severity="error" 
        sx={{ 
          borderRadius: '12px',
          '& .MuiAlert-icon': {
            color: '#DC2626'
          }
        }}
      >
        Training plan not found or invalid. Please try refreshing the page.
      </Alert>
    );
  }

  if (!Array.isArray(trainingProgress.trainingPlan.modules)) {
    console.error('Training plan modules is not an array:', trainingProgress.trainingPlan.modules);
    return (
      <Alert 
        severity="error" 
        sx={{ 
          borderRadius: '12px',
          '& .MuiAlert-icon': {
            color: '#DC2626'
          }
        }}
      >
        Training modules data is invalid. Please try refreshing the page.
      </Alert>
    );
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [localProgress, setLocalProgress] = useState(trainingProgress);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const { user } = useAuth();

  // Update local state when props change
  useEffect(() => {
    setLocalProgress(trainingProgress);
  }, [trainingProgress]);

  const handleModuleComplete = async (moduleId: string, completed: boolean) => {
    // Check if user has permission to complete this training
    if (!canCompleteTraining(user)) {
      setError('Only trainers and above can mark tasks as complete');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Send update to server first to get the user information
      const response = await api.patch(`/api/training/progress/${trainingProgress._id}/modules/${moduleId}`, {
        completed,
        notes: notes[moduleId] || '',
      });

      if (response.status === 200) {
        console.log('Server Response:', response.data);
        
        // Get the updated progress with completedBy information from the response
        const updatedModuleProgress = response.data.moduleProgress.find(
          (mp: any) => mp.moduleId.toString() === moduleId.toString()
        );

        console.log('Updated Module Progress:', updatedModuleProgress);

        // Create updated progress object with server response data
        const updatedProgress = { ...localProgress };
        const moduleProgressIndex = localProgress.moduleProgress.findIndex(
          (mp) => mp.moduleId.toString() === moduleId.toString()
        );
        
        if (moduleProgressIndex === -1) {
          // If module progress doesn't exist, create it with server data
          updatedProgress.moduleProgress.push({
            ...updatedModuleProgress,
            completedBy: updatedModuleProgress.completedBy, // Get completedBy from the module progress
            completedAt: updatedModuleProgress.completedAt || new Date().toISOString()
          });
        } else {
          // Update existing module progress with server data
          updatedProgress.moduleProgress[moduleProgressIndex] = {
            ...updatedProgress.moduleProgress[moduleProgressIndex],
            ...updatedModuleProgress,
            completedBy: updatedModuleProgress.completedBy, // Get completedBy from the module progress
            completedAt: updatedModuleProgress.completedAt || new Date().toISOString()
          };
        }

        // Calculate if all modules are completed
        const allModulesCompleted = trainingProgress.trainingPlan?.modules && 
          Array.isArray(trainingProgress.trainingPlan.modules) &&
          trainingProgress.trainingPlan.modules.every(
            (module) => moduleProgress.find((mp) => mp.moduleId === module._id)?.completed
          );

        updatedProgress.status = allModulesCompleted ? 'COMPLETED' : 'IN_PROGRESS';
        console.log('Final Updated Progress:', updatedProgress);

        // Update local state with server data
        setLocalProgress(updatedProgress);
        
        // Notify parent to update its state
        onProgressUpdate();
      } else {
        setError('Failed to update progress on server');
      }
    } catch (err) {
      console.error('Error updating module progress:', err);
      // Display the server's error message if available
      setError(err.response?.data?.message || 'Failed to update module progress');
    } finally {
      setLoading(false);
    }
  };

  const getModuleProgress = (moduleId: string) => {
    return localProgress.moduleProgress.find(
      (mp) => mp.moduleId.toString() === moduleId.toString()
    );
  };

  const filteredModules = localProgress.trainingPlan?.modules?.filter(module => {
    const progress = getModuleProgress(module._id);
    const isCompleted = progress?.completed || false;

    switch (filter) {
      case 'active':
        return !isCompleted;
      case 'completed':
        return isCompleted;
      default:
        return true;
    }
  }) || [];

  if (!localProgress.trainingPlan) {
    return <Alert severity="error">Training plan not found</Alert>;
  }

  // Check if user can view this training plan
  if (!canViewTraining(user, trainingProgress.trainee._id)) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          borderRadius: '12px',
          '& .MuiAlert-icon': {
            color: '#DC2626'
          }
        }}
      >
        You do not have permission to view this training plan
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#27251F',
            fontWeight: 600,
            fontSize: '1.25rem',
          }}
        >
          {localProgress.trainingPlan.name}
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: '12px',
            '& .MuiAlert-icon': {
              color: '#DC2626'
            }
          }}
        >
          {error}
        </Alert>
      )}

      {user?.position === 'Team Member' && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3,
            borderRadius: '12px',
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

      {!canCompleteTraining(user) && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3,
            borderRadius: '12px',
            '& .MuiAlert-icon': {
              color: '#1D4ED8'
            }
          }}
        >
          Only trainers and above can mark tasks as complete
        </Alert>
      )}

      <Box sx={{ mt: 2 }}>
        {(localProgress.trainingPlan.modules || []).map((module) => {
          const progress = getModuleProgress(module._id);
          const isCompleted = progress?.completed || false;
          const isPlanCompleted = localProgress.status === 'COMPLETED';

          return (
            <Accordion 
              key={module._id} 
              sx={{ 
                mb: 2,
                border: '1px solid',
                borderColor: isCompleted ? 'rgba(22, 163, 74, 0.2)' : 'rgba(39, 37, 31, 0.1)',
                borderRadius: '12px !important',
                '&:before': {
                  display: 'none',
                },
                '& .MuiAccordionSummary-root': {
                  borderRadius: '12px',
                  backgroundColor: isCompleted ? 'rgba(22, 163, 74, 0.05)' : 'transparent',
                  '&:hover': {
                    backgroundColor: isCompleted ? 'rgba(22, 163, 74, 0.1)' : 'rgba(39, 37, 31, 0.05)',
                  },
                },
                boxShadow: 'none',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: isCompleted ? 'rgb(22, 163, 74)' : 'rgba(39, 37, 31, 0.6)' }} />}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {!isPlanCompleted && canCompleteTraining(user) && (
                    <Checkbox
                      checked={isCompleted}
                      onChange={(e) => handleModuleComplete(module._id, e.target.checked)}
                      disabled={loading}
                      sx={{
                        mr: 2,
                        color: 'rgba(39, 37, 31, 0.6)',
                        '&.Mui-checked': {
                          color: '#E51636',
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(229, 22, 54, 0.05)',
                        },
                      }}
                    />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ 
                      color: '#27251F',
                      fontWeight: 500,
                      textDecoration: isCompleted ? 'line-through' : 'none',
                    }}>
                      {module.name}
                      {isCompleted && (
                        <CheckIcon
                          sx={{ 
                            ml: 1, 
                            color: 'rgb(22, 163, 74)',
                            fontSize: '1rem',
                            verticalAlign: 'middle'
                          }}
                        />
                      )}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      mt: 0.5
                    }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'rgba(39, 37, 31, 0.6)',
                        }}
                      >
                        Estimated Duration: {module.estimatedDuration} minutes
                      </Typography>
                      {isCompleted && progress?.completedAt && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'rgb(22, 163, 74)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          Completed by {typeof progress.completedBy === 'object' && progress.completedBy ? 
                            (progress.completedBy.firstName || progress.completedBy.name || 'Unknown')
                            : 'Unknown'} • {new Date(progress.completedAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3, borderTop: '1px solid', borderColor: 'rgba(39, 37, 31, 0.1)' }}>
                <Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(39, 37, 31, 0.8)',
                      mb: 3,
                      lineHeight: 1.6
                    }}
                  >
                    {module.description}
                  </Typography>
                  {!isPlanCompleted && canCompleteTraining(user) ? (
                    <>
                      <TextField
                        label="Notes"
                        multiline
                        rows={3}
                        fullWidth
                        value={notes[module._id] || progress?.notes || ''}
                        onChange={(e) =>
                          setNotes({ ...notes, [module._id]: e.target.value })
                        }
                        disabled={loading}
                        sx={{
                          mb: 3,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            backgroundColor: 'white',
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
                          '& .MuiInputLabel-root': {
                            color: 'rgba(39, 37, 31, 0.6)',
                            '&.Mui-focused': {
                              color: '#E51636',
                            }
                          }
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={() => handleModuleComplete(module._id, !isCompleted)}
                        disabled={loading}
                        sx={{
                          backgroundColor: '#E51636',
                          color: 'white',
                          borderRadius: '8px',
                          textTransform: 'none',
                          px: 4,
                          py: 1.5,
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          boxShadow: 'none',
                          '&:hover': {
                            backgroundColor: '#DD0031',
                            boxShadow: 'none',
                          },
                          '&:disabled': {
                            backgroundColor: 'rgba(39, 37, 31, 0.1)',
                          }
                        }}
                      >
                        {loading ? (
                          <CircularProgress 
                            size={20} 
                            sx={{ 
                              color: 'white',
                              mr: 1
                            }} 
                          />
                        ) : (
                          'Mark as Complete'
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      {progress?.notes && (
                        <Box sx={{ 
                          mt: 2,
                          p: 3,
                          backgroundColor: 'rgba(22, 163, 74, 0.05)',
                          borderRadius: '12px',
                          border: '1px solid rgba(22, 163, 74, 0.1)'
                        }}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              color: 'rgb(22, 163, 74)',
                              mb: 1
                            }}
                          >
                            Completion Notes
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'rgba(39, 37, 31, 0.8)',
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {progress.notes}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Box>
  );
};

export default TrainingModuleProgress; 