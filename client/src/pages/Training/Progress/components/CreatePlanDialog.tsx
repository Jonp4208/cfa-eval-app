import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  Box,
  FormHelperText,
  Alert,
  Link,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface CreatePlanDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (plan: NewTrainingPlan) => Promise<void>;
}

interface NewTrainingPlan {
  name: string;
  description: string;
  department: string;
  type: 'New Hire' | 'Regular';
  days: TrainingDay[];
}

interface TrainingDay {
  dayNumber: number;
  modules: TrainingModule[];
}

interface TrainingModule {
  name: string;
  duration: number;
}

interface FormErrors {
  name?: string;
  department?: string;
  days?: string[];
}

const initialTrainingDay: TrainingDay = {
  dayNumber: 1,
  modules: [],
};

const CreatePlanDialog: React.FC<CreatePlanDialogProps> = ({ open, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [type, setType] = useState<'New Hire' | 'Regular'>('New Hire');
  const [days, setDays] = useState<TrainingDay[]>([{ ...initialTrainingDay }]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Plan name is required';
      isValid = false;
    }

    if (!department) {
      newErrors.department = 'Department is required';
      isValid = false;
    }

    const dayErrors: string[] = [];
    days.forEach((day, index) => {
      if (day.modules.length === 0) {
        dayErrors[index] = 'At least one module is required';
        isValid = false;
      }
      // Validate module names
      day.modules.forEach(module => {
        if (!module.name.trim()) {
          dayErrors[index] = 'All modules must have names';
          isValid = false;
        }
      });
    });

    if (dayErrors.length > 0) {
      newErrors.days = dayErrors;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setSubmitting(true);
      setSubmitError(null);
      try {
        await onSubmit({ name, description, department, type, days });
        // Only close if submission was successful
        handleClose();
      } catch (error: any) {
        console.error('Error submitting plan:', error);
        if (error?.response?.data?.message?.includes('No training position found')) {
          setSubmitError(
            <span>
              No training position found for this department. Please{' '}
              <Link 
                href="/training/positions" 
                target="_blank"
                sx={{ 
                  color: '#E51636',
                  textDecoration: 'underline',
                  '&:hover': {
                    color: '#DD0031'
                  }
                }}
              >
                create a training position
              </Link>
              {' '}first.
            </span>
          );
        } else {
          setSubmitError('Failed to create training plan. Please try again.');
        }
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    // Reset form state
    setName('');
    setDescription('');
    setDepartment('');
    setType('New Hire');
    setDays([{ ...initialTrainingDay }]);
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  const addTrainingDay = () => {
    setDays([...days, { dayNumber: days.length + 1, modules: [] }]);
  };

  const removeTrainingDay = (index: number) => {
    const updatedDays = days.filter((_, i) => i !== index)
      .map((day, i) => ({ ...day, dayNumber: i + 1 }));
    setDays(updatedDays);
  };

  const addModule = (dayIndex: number) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].modules.push({ name: '', duration: 30 });
    setDays(updatedDays);
  };

  const updateModule = (dayIndex: number, moduleIndex: number, field: keyof TrainingModule, value: string | number) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].modules[moduleIndex] = {
      ...updatedDays[dayIndex].modules[moduleIndex],
      [field]: value,
    };
    setDays(updatedDays);
  };

  const removeModule = (dayIndex: number, moduleIndex: number) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].modules.splice(moduleIndex, 1);
    setDays(updatedDays);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          '& .MuiDialogTitle-root': {
            bgcolor: '#E51636',
            color: 'white',
          }
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Create Training Plan Template
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.08)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {submitError && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            {submitError}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 2 }}>
          Before creating a training plan, make sure you have created a training position for the department first.
        </Alert>

        <TextField
          autoFocus
          margin="dense"
          label="Plan Name"
          type="text"
          fullWidth
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': {
                borderColor: '#E51636',
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#E51636',
            },
          }}
        />
        <TextField
          margin="dense"
          label="Description"
          type="text"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': {
                borderColor: '#E51636',
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#E51636',
            },
          }}
        />
        <FormControl fullWidth margin="dense" error={!!errors.department}>
          <InputLabel sx={{ '&.Mui-focused': { color: '#E51636' } }}>Department</InputLabel>
          <Select
            value={department}
            label="Department"
            onChange={(e) => setDepartment(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                '&.Mui-focused': {
                  borderColor: '#E51636',
                },
              },
            }}
          >
            <MenuItem value="FOH">Front of House</MenuItem>
            <MenuItem value="BOH">Back of House</MenuItem>
          </Select>
          {errors.department && <FormHelperText>{errors.department}</FormHelperText>}
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel sx={{ '&.Mui-focused': { color: '#E51636' } }}>Plan Type</InputLabel>
          <Select
            value={type}
            label="Plan Type"
            onChange={(e) => setType(e.target.value as 'New Hire' | 'Regular')}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                '&.Mui-focused': {
                  borderColor: '#E51636',
                },
              },
            }}
          >
            <MenuItem value="New Hire">New Hire</MenuItem>
            <MenuItem value="Regular">Regular</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ color: '#000000', fontWeight: 600 }}>
            Training Schedule
          </Typography>
          {days.map((trainingDay, dayIndex) => (
            <Box 
              key={dayIndex} 
              sx={{ 
                mb: 3, 
                p: 2, 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: '#FAFAFA',
                '&:hover': {
                  boxShadow: 1,
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#000000' }}>
                  Day {trainingDay.dayNumber}
                </Typography>
                {days.length > 1 && (
                  <IconButton 
                    size="small" 
                    onClick={() => removeTrainingDay(dayIndex)}
                    sx={{ 
                      color: '#E51636',
                      '&:hover': {
                        bgcolor: 'rgba(229, 22, 54, 0.08)',
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>

              <Typography variant="subtitle2" gutterBottom sx={{ color: '#000000', fontWeight: 500 }}>
                Modules
              </Typography>
              {trainingDay.modules.map((module, moduleIndex) => (
                <Box 
                  key={moduleIndex} 
                  sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    mb: 1,
                    alignItems: 'center',
                  }}
                >
                  <TextField
                    size="small"
                    label="Module Name"
                    value={module.name}
                    onChange={(e) => updateModule(dayIndex, moduleIndex, 'name', e.target.value)}
                    sx={{ 
                      flex: 2,
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: '#E51636',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#E51636',
                      },
                    }}
                  />
                  <TextField
                    size="small"
                    label="Duration (min)"
                    type="number"
                    value={module.duration}
                    onChange={(e) => updateModule(dayIndex, moduleIndex, 'duration', parseInt(e.target.value) || 0)}
                    sx={{ 
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: '#E51636',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#E51636',
                      },
                    }}
                  />
                  <IconButton 
                    size="small" 
                    onClick={() => removeModule(dayIndex, moduleIndex)}
                    sx={{ 
                      color: '#E51636',
                      '&:hover': {
                        bgcolor: 'rgba(229, 22, 54, 0.08)',
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              
              <Button
                startIcon={<AddIcon />}
                onClick={() => addModule(dayIndex)}
                size="small"
                sx={{ 
                  mt: 1,
                  color: '#E51636',
                  borderColor: '#E51636',
                  '&:hover': {
                    borderColor: '#DD0031',
                    bgcolor: 'rgba(229, 22, 54, 0.08)',
                  }
                }}
              >
                Add Module
              </Button>
            </Box>
          ))}
          <Button 
            variant="outlined" 
            onClick={addTrainingDay} 
            startIcon={<AddIcon />}
            sx={{ 
              mt: 1,
              color: '#E51636',
              borderColor: '#E51636',
              '&:hover': {
                borderColor: '#DD0031',
                bgcolor: 'rgba(229, 22, 54, 0.08)',
              }
            }}
          >
            Add Training Day
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#FAFAFA' }}>
        <Button 
          onClick={handleClose}
          disabled={submitting}
          sx={{ 
            color: '#000000',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.08)',
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={submitting}
          sx={{ 
            bgcolor: '#E51636',
            '&:hover': {
              bgcolor: '#DD0031',
            }
          }}
        >
          {submitting ? 'Creating...' : 'Create Plan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePlanDialog; 
