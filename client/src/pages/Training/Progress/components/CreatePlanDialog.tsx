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
  FormControlLabel,
  Checkbox,
  Grid,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useTheme, useMediaQuery } from '@mui/material';

interface CreatePlanDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (plan: NewTrainingPlan) => Promise<void>;
}

interface NewTrainingPlan {
  name: string;
  description: string;
  department: string;
  position: string;
  type: 'New Hire' | 'Regular';
  days: TrainingDay[];
  includesCoreValues: boolean;
  includesBrandStandards: boolean;
  includesSecondMileService: boolean;
  requiredCertifications: {
    foodSafety: boolean;
    servSafe: boolean;
    allergenAwareness: boolean;
  };
}

interface TrainingDay {
  dayNumber: number;
  tasks: TrainingTask[];
}

interface TrainingTask {
  name: string;
  description: string;
  duration: number;
  pathwayUrl?: string;
  competencyChecklist?: string[];
}

interface FormErrors {
  name?: string;
  department?: string;
  position?: string;
  days?: {
    dayIndex: number;
    taskErrors?: {
      taskIndex: number;
      error: string;
    }[];
  }[];
}

const initialTrainingDay: TrainingDay = {
  dayNumber: 1,
  tasks: [],
};

const CreatePlanDialog: React.FC<CreatePlanDialogProps> = ({ open, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [type, setType] = useState<'New Hire' | 'Regular'>('New Hire');
  const [days, setDays] = useState<TrainingDay[]>([{ ...initialTrainingDay }]);
  const [includesCoreValues, setIncludesCoreValues] = useState(false);
  const [includesBrandStandards, setIncludesBrandStandards] = useState(false);
  const [includesSecondMileService, setIncludesSecondMileService] = useState(false);
  const [requiredCertifications, setRequiredCertifications] = useState({
    foodSafety: false,
    servSafe: false,
    allergenAwareness: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

    if (!position) {
      newErrors.position = 'Position is required';
      isValid = false;
    }

    const dayErrors: FormErrors['days'] = [];
    days.forEach((day, dayIndex) => {
      const taskErrors: { taskIndex: number; error: string; }[] = [];
      
      const validTasks = day.tasks.filter((task, taskIndex) => {
        if (!task.name.trim()) {
          taskErrors.push({
            taskIndex,
            error: 'Task name is required'
          });
          return false;
        }
        return true;
      });

      if (validTasks.length === 0) {
        dayErrors.push({
          dayIndex,
          taskErrors: [{
            taskIndex: 0,
            error: 'At least one training task is required'
          }]
        });
        isValid = false;
      } else if (taskErrors.length > 0) {
        dayErrors.push({
          dayIndex,
          taskErrors
        });
        isValid = false;
      }

      const updatedDays = [...days];
      updatedDays[dayIndex].tasks = validTasks;
      setDays(updatedDays);
    });

    if (dayErrors.length > 0) {
      newErrors.days = dayErrors;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      await onSubmit({
        name,
        description,
        department,
        position,
        type,
        days,
        includesCoreValues,
        includesBrandStandards,
        includesSecondMileService,
        requiredCertifications,
      });

      handleClose();
    } catch (err) {
      console.error('Error submitting training plan:', err);
      setSubmitError('Failed to create training plan. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form state
    setName('');
    setDescription('');
    setDepartment('');
    setPosition('');
    setType('New Hire');
    setDays([{ ...initialTrainingDay }]);
    setIncludesCoreValues(false);
    setIncludesBrandStandards(false);
    setIncludesSecondMileService(false);
    setRequiredCertifications({
      foodSafety: false,
      servSafe: false,
      allergenAwareness: false,
    });
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  const addTrainingDay = () => {
    setDays([...days, { dayNumber: days.length + 1, tasks: [] }]);
  };

  const removeTrainingDay = (index: number) => {
    const updatedDays = days.filter((_, i) => i !== index)
      .map((day, i) => ({ ...day, dayNumber: i + 1 }));
    setDays(updatedDays);
  };

  const addTask = (dayIndex: number) => {
    const updatedDays = [...days];
    const updatedTasks = [...updatedDays[dayIndex].tasks];
    
    // Create a new task with explicit field assignments
    const newTask = {
      name: '',
      description: '',
      duration: 30,
      pathwayUrl: '',
      _id: undefined as string | undefined
    };
    
    // Update the tasks array and then the days array
    updatedTasks.push(newTask);
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      tasks: updatedTasks
    };
    
    setDays(updatedDays);
  };

  const updateTask = (dayIndex: number, taskIndex: number, updatedTask: TrainingTask) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].tasks[taskIndex] = updatedTask;
    setDays(updatedDays);
  };

  const removeTask = (dayIndex: number, taskIndex: number) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].tasks.splice(taskIndex, 1);
    setDays(updatedDays);
  };

  const TaskForm: React.FC<{
    task: TrainingTask;
    onUpdate: (updatedTask: TrainingTask) => void;
    onDelete: () => void;
    error?: string;
    isMobile?: boolean;
  }> = ({ task, onUpdate, onDelete, error, isMobile }) => {
    const handleAddCompetency = () => {
      const checklist = task.competencyChecklist || [];
      onUpdate({
        ...task,
        competencyChecklist: [...checklist, '']
      });
    };

    const handleUpdateCompetency = (index: number, value: string) => {
      const checklist = [...(task.competencyChecklist || [])];
      checklist[index] = value;
      onUpdate({ ...task, competencyChecklist: checklist });
    };

    const handleDeleteCompetency = (index: number) => {
      const checklist = [...(task.competencyChecklist || [])];
      checklist.splice(index, 1);
      onUpdate({ ...task, competencyChecklist: checklist });
    };

    return (
      <Box sx={{ 
        mb: isMobile ? 3 : 2, 
        p: isMobile ? 2 : 3,
        border: '1px solid #e0e0e0', 
        borderRadius: 1 
      }}>
        <Grid container spacing={isMobile ? 1.5 : 2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Task Name"
              value={task.name}
              onChange={(e) => onUpdate({ ...task, name: e.target.value })}
              error={!!error}
              helperText={error}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={task.description}
              onChange={(e) => onUpdate({ ...task, description: e.target.value })}
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              value={task.duration}
              onChange={(e) => onUpdate({ ...task, duration: parseInt(e.target.value) || 0 })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Pathway URL"
              value={task.pathwayUrl || ''}
              onChange={(e) => onUpdate({ ...task, pathwayUrl: e.target.value })}
              placeholder="https://pathway.chick-fil-a.com/..."
            />
          </Grid>

          {/* Competency Checklist Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Competency Checklist
            </Typography>
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mt: 1
            }}>
              {task.competencyChecklist?.map((item, index) => (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  gap: 1,
                  alignItems: 'center'
                }}>
                  <TextField
                    sx={{ flex: 1 }}
                    label={`Competency ${index + 1}`}
                    value={item}
                    onChange={(e) => handleUpdateCompetency(index, e.target.value)}
                  />
                  <IconButton 
                    onClick={() => handleDeleteCompetency(index)}
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
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddCompetency}
                variant="outlined"
                size="small"
                sx={{
                  alignSelf: 'flex-start',
                  borderColor: 'rgba(39, 37, 31, 0.2)',
                  color: '#27251F',
                  '&:hover': {
                    borderColor: '#E51636',
                    color: '#E51636',
                    bgcolor: 'rgba(229, 22, 54, 0.04)'
                  }
                }}
              >
                Add Competency Item
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ 
          mt: 2, 
          display: 'flex', 
          justifyContent: 'flex-end',
          position: isMobile ? 'sticky' : 'relative',
          bottom: 0,
          bgcolor: 'white',
          pt: 1,
          borderTop: '1px solid',
          borderColor: 'rgba(39, 37, 31, 0.1)'
        }}>
          <Button
            startIcon={<DeleteIcon />}
            onClick={onDelete}
            color="error"
            sx={{
              minHeight: isMobile ? '44px' : '36px'
            }}
          >
            Delete Task
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          height: isMobile ? '100%' : 'auto',
          margin: isMobile ? 0 : 2,
          overflow: 'hidden',
          '& .MuiDialogTitle-root': {
            bgcolor: '#E51636',
            color: 'white',
            minHeight: isMobile ? '56px' : '64px',
            py: isMobile ? 1.5 : 2,
            px: isMobile ? 2 : 3,
            position: 'sticky',
            top: 0,
            zIndex: 1
          },
          '& .MuiDialogContent-root': {
            p: 0,
            mt: 0,
            height: isMobile ? 'calc(100% - 56px)' : 'auto',
            overflowY: 'auto',
            '&:first-of-type': {
              pt: 0
            }
          },
          '& .MuiDialogActions-root': {
            position: isMobile ? 'sticky' : 'relative',
            bottom: 0,
            bgcolor: '#FAFAFA',
            borderTop: '1px solid',
            borderColor: 'rgba(39, 37, 31, 0.1)',
            px: isMobile ? 2 : 3,
            py: isMobile ? 1.5 : 2
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
          fontSize: isMobile ? '1rem' : '1.125rem',
          lineHeight: 1.5
        }}>
          Create Training Plan Template
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            color: 'white',
            p: isMobile ? 0.5 : 1,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.08)',
            },
          }}
        >
          <CloseIcon fontSize={isMobile ? "small" : "medium"} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ 
          p: { xs: 2, sm: 3 }, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: { xs: 2, sm: 3 },
          pb: isMobile ? 8 : 3 // Extra padding at bottom for mobile to account for fixed buttons
        }}>
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

                {day.tasks.map((task, taskIndex) => (
                  <TaskForm
                    key={taskIndex}
                    task={task}
                    onUpdate={(updatedTask) => updateTask(dayIndex, taskIndex, updatedTask)}
                    onDelete={() => removeTask(dayIndex, taskIndex)}
                    error={errors.days?.find(d => d.dayIndex === dayIndex)?.taskErrors?.find(t => t.taskIndex === taskIndex)?.error}
                    isMobile={isMobile}
                  />
                ))}
                
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => addTask(dayIndex)}
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
                  Add Training Task
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
      <DialogActions>
        <Button 
          onClick={handleClose}
          disabled={submitting}
          sx={{ 
            color: '#000000',
            minHeight: isMobile ? '44px' : '36px',
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
            minHeight: isMobile ? '44px' : '36px',
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

