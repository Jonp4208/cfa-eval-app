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
  description: string;
  duration: number;
  pathwayUrl?: string;
}

interface FormErrors {
  name?: string;
  department?: string;
  days?: {
    dayIndex: number;
    moduleErrors?: {
      moduleIndex: number;
      error: string;
    }[];
  }[];
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

    const dayErrors: FormErrors['days'] = [];
    days.forEach((day, dayIndex) => {
      const moduleErrors: { moduleIndex: number; error: string; }[] = [];
      
      // Filter out empty modules
      const validModules = day.modules.filter((module, moduleIndex) => {
        if (!module.name.trim()) {
          moduleErrors.push({
            moduleIndex,
            error: 'Module name is required'
          });
          return false;
        }
        return true;
      });

      if (validModules.length === 0) {
        dayErrors.push({
          dayIndex,
          moduleErrors: [{
            moduleIndex: 0,
            error: 'At least one module with a name is required'
          }]
        });
        isValid = false;
      } else if (moduleErrors.length > 0) {
        dayErrors.push({
          dayIndex,
          moduleErrors
        });
        isValid = false;
      }

      // Update the day's modules to only include valid ones
      const updatedDays = [...days];
      updatedDays[dayIndex].modules = validModules;
      setDays(updatedDays);
    });

    if (dayErrors.length > 0) {
      newErrors.days = dayErrors;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    // Clean up empty modules before validation
    const cleanedDays = days.map(day => ({
      ...day,
      modules: day.modules.filter(module => module.name.trim() !== '')
    })).filter(day => day.modules.length > 0);

    // Update the days state with cleaned data
    setDays(cleanedDays);

    // If no days with modules remain, show error
    if (cleanedDays.length === 0) {
      setErrors({
        days: [{
          dayIndex: 0,
          moduleErrors: [{
            moduleIndex: 0,
            error: 'At least one training module is required'
          }]
        }]
      });
      return;
    }

    if (validateForm()) {
      setSubmitting(true);
      setSubmitError(null);
      try {
        await onSubmit({ 
          name, 
          description, 
          department, 
          type, 
          days: cleanedDays 
        });
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
    const updatedModules = [...updatedDays[dayIndex].modules];
    
    // Create a new module with explicit field assignments
    const newModule = {
      name: '',
      description: '',
      duration: 30,
      pathwayUrl: '',
      _id: undefined as string | undefined
    };
    
    // Update the modules array and then the days array
    updatedModules.push(newModule);
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      modules: updatedModules
    };
    
    setDays(updatedDays);
  };

  const updateModule = (dayIndex: number, moduleIndex: number, field: keyof TrainingModule, value: string | number) => {
    const updatedDays = [...days];
    const moduleToUpdate = updatedDays[dayIndex].modules[moduleIndex];
    
    updatedDays[dayIndex].modules = updatedDays[dayIndex].modules.map(module => {
      if (module === moduleToUpdate) {
        return {
          ...module,
          [field]: value
        };
      }
      return module;
    });
    
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
          overflow: 'hidden',
          '& .MuiDialogTitle-root': {
            bgcolor: '#E51636',
            color: 'white',
            minHeight: '64px',
            py: 2,
            px: 3
          },
          '& .MuiDialogContent-root': {
            p: 0,
            mt: 0,
            '&:first-of-type': {
              pt: 0
            }
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: 2
      }}>
        <Typography variant="h6" component="div" sx={{ 
          fontWeight: 600,
          fontSize: '1.125rem',
          lineHeight: 1.5
        }}>
          Create Training Plan Template
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            color: 'white',
            p: 1,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.08)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {submitError && (
            <Alert 
              severity="error" 
              sx={{ 
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
            >
              {submitError}
            </Alert>
          )}
          <TextField
            autoFocus
            label="Plan Name"
            type="text"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            InputProps={{
              sx: {
                borderRadius: '12px',
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(39, 37, 31, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(39, 37, 31, 0.3)',
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
              },
              '& .MuiFormHelperText-root': {
                mx: 0,
                mt: 1
              }
            }}
          />

          <TextField
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            InputProps={{
              sx: {
                borderRadius: '12px',
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(39, 37, 31, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(39, 37, 31, 0.3)',
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

          <FormControl fullWidth error={!!errors.department}>
            <InputLabel sx={{ 
              color: 'rgba(39, 37, 31, 0.6)',
              '&.Mui-focused': { 
                color: '#E51636' 
              } 
            }}>
              Department
            </InputLabel>
            <Select
              value={department}
              label="Department"
              onChange={(e) => setDepartment(e.target.value)}
              sx={{
                borderRadius: '12px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(39, 37, 31, 0.2)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(39, 37, 31, 0.3)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E51636',
                }
              }}
            >
              <MenuItem value="FOH">Front of House</MenuItem>
              <MenuItem value="BOH">Back of House</MenuItem>
            </Select>
            {errors.department && (
              <FormHelperText sx={{ mx: 0, mt: 1 }}>{errors.department}</FormHelperText>
            )}
          </FormControl>

          <Box sx={{ mt: -1 }}>
            <Typography variant="body2" sx={{ 
              mb: 1, 
              color: 'rgba(39, 37, 31, 0.6)',
              fontWeight: 400
            }}>
              Plan Type
            </Typography>
            <FormControl fullWidth>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as 'New Hire' | 'Regular')}
                sx={{
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(39, 37, 31, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(39, 37, 31, 0.3)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E51636',
                  }
                }}
              >
                <MenuItem value="New Hire">New Hire</MenuItem>
                <MenuItem value="Regular">Regular</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ 
              color: '#27251F',
              fontWeight: 600,
              mb: 2
            }}>
              Training Schedule
            </Typography>
            {days.map((day, dayIndex) => (
              <Box key={dayIndex} sx={{ 
                mb: 3, 
                p: 3, 
                bgcolor: 'rgba(39, 37, 31, 0.02)', 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'rgba(39, 37, 31, 0.1)'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 2 
                }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#27251F',
                      fontWeight: 500
                    }}
                  >
                    Training Day {day.dayNumber}
                  </Typography>
                  {dayIndex > 0 && (
                    <IconButton
                      onClick={() => removeTrainingDay(dayIndex)}
                      sx={{
                        color: 'rgba(39, 37, 31, 0.4)',
                        '&:hover': {
                          color: '#E51636',
                          bgcolor: 'rgba(229, 22, 54, 0.04)'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>

                {day.modules.map((module, moduleIndex) => (
                  <Box 
                    key={moduleIndex} 
                    sx={{ 
                      mb: 3,
                      bgcolor: 'white', 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'rgba(39, 37, 31, 0.1)',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
                        borderColor: 'rgba(39, 37, 31, 0.2)'
                      }
                    }}
                  >
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      px: 3,
                      py: 2
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        color: 'rgba(39, 37, 31, 0.6)',
                        fontWeight: 400
                      }}>
                        Module {moduleIndex + 1}
                      </Typography>
                      <IconButton 
                        onClick={() => removeModule(dayIndex, moduleIndex)}
                        sx={{
                          color: 'rgba(39, 37, 31, 0.4)',
                          padding: 0.5,
                          '&:hover': {
                            color: '#E51636',
                            bgcolor: 'rgba(229, 22, 54, 0.04)'
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Box sx={{ 
                      px: 3,
                      pb: 3,
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 3 
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 2,
                        alignItems: 'flex-start'
                      }}>
                        <TextField
                          label="Training Module Name"
                          value={module.name}
                          onChange={(e) => updateModule(dayIndex, moduleIndex, 'name', e.target.value)}
                          fullWidth
                          error={!!errors.days?.find(d => d.dayIndex === dayIndex)?.moduleErrors?.find(m => m.moduleIndex === moduleIndex)}
                          helperText={errors.days?.find(d => d.dayIndex === dayIndex)?.moduleErrors?.find(m => m.moduleIndex === moduleIndex)?.error}
                          sx={{
                            flexGrow: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '& fieldset': {
                                borderColor: (theme) => 
                                  errors.days?.find(d => d.dayIndex === dayIndex)?.moduleErrors?.find(m => m.moduleIndex === moduleIndex)
                                    ? theme.palette.error.main
                                    : 'rgba(39, 37, 31, 0.2)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(39, 37, 31, 0.3)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#E51636',
                              }
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: '#E51636',
                            },
                            '& .MuiFormHelperText-root': {
                              mx: 0,
                              mt: 1
                            }
                          }}
                        />
                        <TextField
                          label="Duration (min)"
                          type="number"
                          value={module.duration}
                          onChange={(e) => updateModule(dayIndex, moduleIndex, 'duration', parseInt(e.target.value) || 0)}
                          sx={{
                            width: '140px',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '& fieldset': {
                                borderColor: 'rgba(39, 37, 31, 0.2)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(39, 37, 31, 0.3)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#E51636',
                              }
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: '#E51636',
                            }
                          }}
                        />
                      </Box>

                      <TextField
                        label="Description"
                        value={module.description}
                        onChange={(e) => updateModule(dayIndex, moduleIndex, 'description', e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            '& fieldset': {
                              borderColor: 'rgba(39, 37, 31, 0.2)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(39, 37, 31, 0.3)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#E51636',
                            }
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#E51636',
                          }
                        }}
                      />

                      <TextField
                        label="Pathway URL"
                        value={module.pathwayUrl || ''}
                        onChange={(e) => updateModule(dayIndex, moduleIndex, 'pathwayUrl', e.target.value)}
                        fullWidth
                        placeholder="https://pathway.chick-fil-a.com/..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            '& fieldset': {
                              borderColor: 'rgba(39, 37, 31, 0.2)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(39, 37, 31, 0.3)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#E51636',
                            }
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#E51636',
                          }
                        }}
                      />
                    </Box>
                  </Box>
                ))}
                
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => addModule(dayIndex)}
                  variant="outlined"
                  fullWidth
                  sx={{
                    mt: 2,
                    borderRadius: '12px',
                    borderColor: 'rgba(39, 37, 31, 0.2)',
                    color: '#27251F',
                    height: '48px',
                    '&:hover': {
                      borderColor: '#E51636',
                      color: '#E51636',
                      bgcolor: 'rgba(229, 22, 54, 0.04)'
                    }
                  }}
                >
                  Add Training Module
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
