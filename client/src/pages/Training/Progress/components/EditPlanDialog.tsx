import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { TrainingPlan } from '../../../../types/training';
import { SimplifiedTrainingPlan } from '../types';
import api from '@/lib/axios';

interface FormErrors {
  name?: string;
  department?: string;
  modules?: string[];
  numberOfDays?: string;
}

interface EditPlanDialogProps {
  open: boolean;
  onClose: () => void;
  plan: SimplifiedTrainingPlan | null;
  onPlanUpdated?: () => void;
}

const EditPlanDialog: React.FC<EditPlanDialogProps> = ({ open, onClose, plan, onPlanUpdated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [type, setType] = useState<'NEW_HIRE' | 'REGULAR'>('REGULAR');
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [modules, setModules] = useState<TrainingPlan['modules']>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setDescription(plan.description || '');
      setDepartment(plan.department || '');
      setType(plan.type || 'REGULAR');
      setNumberOfDays(plan.numberOfDays || 1);
      setModules(plan.modules || []);
    }
  }, [plan]);

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

    if (modules.length === 0) {
      newErrors.modules = ['At least one module is required'];
      isValid = false;
    }

    if (numberOfDays < 1) {
      newErrors.numberOfDays = 'Number of days must be at least 1';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!plan || !validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);

      await api.put(`/api/training/plans/${plan.id}`, {
        name,
        description,
        department,
        type,
        numberOfDays,
        modules,
      });

      if (onPlanUpdated) {
        onPlanUpdated();
      }
      handleClose();
    } catch (err) {
      setError('Failed to update training plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setDepartment('');
    setType('REGULAR');
    setNumberOfDays(1);
    setModules([]);
    setErrors({});
    setError(null);
    onClose();
  };

  const addModule = (dayNumber: number) => {
    setModules([
      ...modules,
      {
        name: '',
        description: '',
        department,
        estimatedDuration: '30',
        dayNumber,
        requiredForNewHire: type === 'NEW_HIRE',
        materials: []
      },
    ]);
  };

  const updateModule = (index: number, field: keyof TrainingPlan['modules'][0], value: string | any) => {
    const updatedModules = [...modules];
    if (field === 'pathwayUrl') {
      // Update or create the Pathway material
      const module = updatedModules[index];
      const pathwayMaterial = module.materials?.find(m => m.type === 'PATHWAY_LINK') || {
        type: 'PATHWAY_LINK',
        title: module.name,
        category: 'Pathway'
      };
      pathwayMaterial.url = value;

      // Update materials array
      module.materials = module.materials || [];
      const materialIndex = module.materials.findIndex(m => m.type === 'PATHWAY_LINK');
      if (materialIndex >= 0) {
        module.materials[materialIndex] = pathwayMaterial;
      } else {
        module.materials.push(pathwayMaterial);
      }
    } else {
      updatedModules[index] = {
        ...updatedModules[index],
        [field]: value,
      };
    }
    setModules(updatedModules);
  };

  // Helper function to get Pathway URL from module
  const getPathwayUrl = (module: TrainingPlan['modules'][0]): string => {
    return module.materials?.find(m => m.type === 'PATHWAY_LINK')?.url || '';
  };

  const removeModule = (index: number) => {
    const updatedModules = modules.filter((_, i) => i !== index);
    setModules(updatedModules);
  };

  // Group modules by day
  const modulesByDay = modules.reduce((acc, module) => {
    const day = module.dayNumber || 1;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(module);
    return acc;
  }, {} as Record<number, TrainingPlan['modules']>);

  if (!plan) return null;

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
          Edit Training Plan
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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

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
        />

        <TextField
          margin="dense"
          label="Description"
          type="text"
          fullWidth
          multiline
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <FormControl fullWidth margin="dense" error={!!errors.department}>
          <InputLabel>Department</InputLabel>
          <Select
            value={department}
            label="Department"
            onChange={(e) => setDepartment(e.target.value)}
          >
            <MenuItem value="FOH">Front of House</MenuItem>
            <MenuItem value="BOH">Back of House</MenuItem>
          </Select>
          {errors.department && (
            <FormHelperText>{errors.department}</FormHelperText>
          )}
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel>Type</InputLabel>
          <Select
            value={type}
            label="Type"
            onChange={(e) => setType(e.target.value as 'NEW_HIRE' | 'REGULAR')}
          >
            <MenuItem value="NEW_HIRE">New Hire</MenuItem>
            <MenuItem value="REGULAR">Regular</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense" error={!!errors.numberOfDays}>
          <TextField
            label="Number of Days"
            type="number"
            value={numberOfDays}
            onChange={(e) => setNumberOfDays(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1 }}
            error={!!errors.numberOfDays}
            helperText={errors.numberOfDays}
          />
        </FormControl>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Training Schedule
          </Typography>
          
          {Array.from({ length: numberOfDays }, (_, i) => i + 1).map((day) => (
            <Box key={day} sx={{ 
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
                  Day {day}
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => addModule(day)}
                  variant="outlined"
                  sx={{
                    borderRadius: '12px',
                    borderColor: 'rgba(39, 37, 31, 0.2)',
                    color: '#27251F',
                    '&:hover': {
                      borderColor: '#E51636',
                      color: '#E51636',
                      bgcolor: 'rgba(229, 22, 54, 0.04)'
                    }
                  }}
                >
                  Add Module
                </Button>
              </Box>

              {(modulesByDay[day] || []).map((module, moduleIndex) => (
                <Box 
                  key={moduleIndex} 
                  sx={{ 
                    mb: 2, 
                    p: { xs: 1.5, sm: 2.5 },
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
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2, 
                    mb: 2 
                  }}>
                    <TextField
                      label="Module Name"
                      value={module.name}
                      onChange={(e) => updateModule(modules.indexOf(module), 'name', e.target.value)}
                      fullWidth
                      sx={{
                        flexGrow: 1,
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
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1,
                      width: { xs: '100%', sm: 'auto' }
                    }}>
                      <TextField
                        label="Duration (min)"
                        type="number"
                        value={module.estimatedDuration}
                        onChange={(e) => updateModule(modules.indexOf(module), 'estimatedDuration', e.target.value)}
                        sx={{
                          flexGrow: { xs: 1, sm: 0 },
                          width: { sm: 140 },
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
                      <IconButton 
                        onClick={() => removeModule(modules.indexOf(module))}
                        sx={{
                          alignSelf: 'center',
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
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      label="Description"
                      value={module.description}
                      onChange={(e) => updateModule(modules.indexOf(module), 'description', e.target.value)}
                      fullWidth
                      multiline
                      rows={2}
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
                  <TextField
                    label="Pathway URL"
                    value={getPathwayUrl(module)}
                    onChange={(e) => updateModule(modules.indexOf(module), 'pathwayUrl', e.target.value)}
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
              ))}
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPlanDialog; 