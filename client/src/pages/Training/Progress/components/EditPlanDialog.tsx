import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Close as CloseIcon, Add as AddIcon, Delete as DeleteIcon, DragIndicator as DragIndicatorIcon } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
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

interface TrainingModule extends Omit<TrainingPlan['modules'][0], 'id'> {
  id: string;
  competencyChecklist?: string[];
}

const StrictModeDroppable = ({ children, ...props }: any) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) {
    return null;
  }
  return <Droppable {...props}>{children}</Droppable>;
};

const EditPlanDialog: React.FC<EditPlanDialogProps> = ({ open, onClose, plan, onPlanUpdated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [type, setType] = useState<'NEW_HIRE' | 'REGULAR'>('REGULAR');
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setDescription(plan.description || '');
      setDepartment(plan.department || '');
      setType(plan.type || 'REGULAR');
      setNumberOfDays(plan.numberOfDays || 1);
      setModules((plan.modules || []).map(module => ({
        ...module,
        id: Math.random().toString(36).substr(2, 9)
      })));
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

    // Filter out modules with empty names
    const validModules = modules.filter(module => module.name.trim() !== '');
    
    if (validModules.length === 0) {
      newErrors.modules = ['At least one module with a name is required'];
      isValid = false;
    }

    if (numberOfDays < 1) {
      newErrors.numberOfDays = 'Number of days must be at least 1';
      isValid = false;
    }

    // Update modules state to remove empty ones
    setModules(validModules.map(module => ({
      ...module,
      id: Math.random().toString(36).substr(2, 9)
    })));

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = useCallback(async () => {
    if (!plan) return;

    // Clean up empty modules before validation
    const cleanedModules = modules.map(module => ({
      ...module,
      name: module.name.trim(),
      description: module.description.trim()
    })).filter(module => module.name.trim() !== '');
    
    setModules(cleanedModules.map(module => ({
      ...module,
      id: Math.random().toString(36).substr(2, 9)
    })));

    // If no valid modules remain, show error
    if (cleanedModules.length === 0) {
      setErrors({
        modules: ['At least one training module with a name is required']
      });
      return;
    }

    if (validateForm()) {
      setSubmitting(true);
      setError(null);

      try {
        await api.put(`/api/training/plans/${plan.id}`, {
          name: name.trim(),
          description: description.trim(),
          department,
          type,
          numberOfDays,
          modules: cleanedModules,
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
    }
  }, [plan, modules, name, description, department, type, numberOfDays, validateForm, onPlanUpdated]);

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
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        description: '',
        department,
        estimatedDuration: '30',
        dayNumber,
        requiredForNewHire: type === 'NEW_HIRE',
        materials: [],
        competencyChecklist: []
      },
    ]);
  };

  const updateModule = (moduleToUpdate: TrainingPlan['modules'][0], field: keyof TrainingPlan['modules'][0], value: string | any) => {
    const updatedModules = modules.map(module => {
      if (module === moduleToUpdate) {
        if (field === 'pathwayUrl') {
          // Update or create the Pathway material
          const pathwayMaterial = module.materials?.find(m => m.type === 'PATHWAY_LINK') || {
            type: 'PATHWAY_LINK',
            title: module.name,
            category: 'Pathway'
          };
          pathwayMaterial.url = value;

          // Update materials array
          const materials = module.materials || [];
          const materialIndex = materials.findIndex(m => m.type === 'PATHWAY_LINK');
          if (materialIndex >= 0) {
            materials[materialIndex] = pathwayMaterial;
          } else {
            materials.push(pathwayMaterial);
          }

          return {
            ...module,
            materials
          };
        } else if (field === 'description') {
          // Don't trim the description value immediately
          return {
            ...module,
            description: value
          };
        } else {
          return {
            ...module,
            [field]: value,
          };
        }
      }
      return module;
    });
    setModules(updatedModules);
  };

  // Helper function to get Pathway URL from module
  const getPathwayUrl = (module: TrainingPlan['modules'][0]): string => {
    return module.materials?.find(m => m.type === 'PATHWAY_LINK')?.url || '';
  };

  const removeModule = useCallback((moduleToRemove: TrainingPlan['modules'][0]) => {
    setModules(prevModules => prevModules.filter(module => module !== moduleToRemove));
  }, []);

  // Group modules by day using useMemo
  const modulesByDay = useMemo(() => {
    return modules.reduce((acc, module) => {
      const day = module.dayNumber || 1;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(module);
      return acc;
    }, {} as Record<number, TrainingPlan['modules']>);
  }, [modules]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const sourceDay = parseInt(result.source.droppableId);
    const destinationDay = parseInt(result.destination.droppableId);
    
    setModules(prevModules => {
      const newModules = [...prevModules];
      const moduleIndex = newModules.findIndex(m => m.id === result.draggableId);
      if (moduleIndex === -1) return prevModules;

      const [moduleToMove] = newModules.splice(moduleIndex, 1);
      moduleToMove.dayNumber = destinationDay;

      // Find all modules in the destination day
      const destinationModules = newModules.filter(m => m.dayNumber === destinationDay);
      
      // Find where to insert the module
      let insertIndex = moduleIndex;
      if (destinationModules.length > 0) {
        if (result.destination.index === 0) {
          insertIndex = newModules.indexOf(destinationModules[0]);
        } else if (result.destination.index >= destinationModules.length) {
          insertIndex = newModules.indexOf(destinationModules[destinationModules.length - 1]) + 1;
        } else {
          insertIndex = newModules.indexOf(destinationModules[result.destination.index]);
        }
      }

      newModules.splice(insertIndex, 0, moduleToMove);
      return newModules;
    });
  }, []);

  // Add competency checklist handlers
  const handleAddCompetency = (moduleToUpdate: TrainingModule) => {
    const updatedModules = modules.map(module => {
      if (module === moduleToUpdate) {
        return {
          ...module,
          competencyChecklist: [...(module.competencyChecklist || []), '']
        };
      }
      return module;
    });
    setModules(updatedModules);
  };

  const handleUpdateCompetency = (moduleToUpdate: TrainingModule, index: number, value: string) => {
    const updatedModules = modules.map(module => {
      if (module === moduleToUpdate) {
        const checklist = [...(module.competencyChecklist || [])];
        checklist[index] = value;
        return {
          ...module,
          competencyChecklist: checklist
        };
      }
      return module;
    });
    setModules(updatedModules);
  };

  const handleDeleteCompetency = (moduleToUpdate: TrainingModule, index: number) => {
    const updatedModules = modules.map(module => {
      if (module === moduleToUpdate) {
        const checklist = [...(module.competencyChecklist || [])];
        checklist.splice(index, 1);
        return {
          ...module,
          competencyChecklist: checklist
        };
      }
      return module;
    });
    setModules(updatedModules);
  };

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
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
          
          <DragDropContext onDragEnd={handleDragEnd}>
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
                </Box>

                <StrictModeDroppable droppableId={`${day}`}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        minHeight: '50px',
                        backgroundColor: snapshot.isDraggingOver ? 'rgba(229, 22, 54, 0.04)' : 'transparent',
                        transition: 'background-color 0.2s ease',
                        borderRadius: 1,
                        p: 1
                      }}
                    >
                      {(modulesByDay[day] || []).map((module, moduleIndex) => (
                        <Draggable
                          key={module.id}
                          draggableId={module.id}
                          index={moduleIndex}
                        >
                          {(provided, snapshot) => (
                            <Box 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{ 
                                mb: moduleIndex < (modulesByDay[day] || []).length - 1 ? 2 : 0,
                                p: { xs: 1.5, sm: 2.5 },
                                bgcolor: snapshot.isDragging ? 'rgba(229, 22, 54, 0.04)' : 'white', 
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: snapshot.isDragging ? '#E51636' : 'rgba(39, 37, 31, 0.1)',
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
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  color: 'rgba(39, 37, 31, 0.4)',
                                  cursor: 'grab',
                                  mr: 1
                                }}>
                                  <DragIndicatorIcon />
                                </Box>
                                <TextField
                                  label="Module Name"
                                  value={module.name}
                                  onChange={(e) => updateModule(module, 'name', e.target.value)}
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
                                  error={!!errors.modules?.[moduleIndex]}
                                  helperText={errors.modules?.[moduleIndex]}
                                  required
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
                                    onChange={(e) => updateModule(module, 'estimatedDuration', e.target.value)}
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
                                    onClick={() => removeModule(module)}
                                    disabled={submitting}
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
                                  onChange={(e) => updateModule(module, 'description', e.target.value)}
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
                              </Box>
                              <TextField
                                label="Pathway URL"
                                value={getPathwayUrl(module)}
                                onChange={(e) => updateModule(module, 'pathwayUrl', e.target.value)}
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

                              {/* Competency Checklist Section */}
                              <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" gutterBottom sx={{ color: 'rgba(39, 37, 31, 0.8)' }}>
                                  Competency Checklist
                                </Typography>
                                <Box sx={{ 
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 2,
                                  mt: 1
                                }}>
                                  {(module.competencyChecklist || []).map((item, index) => (
                                    <Box key={index} sx={{ 
                                      display: 'flex', 
                                      gap: 1,
                                      alignItems: 'center'
                                    }}>
                                      <TextField
                                        sx={{ flex: 1 }}
                                        label={`Competency ${index + 1}`}
                                        value={item}
                                        onChange={(e) => handleUpdateCompetency(module, index, e.target.value)}
                                        placeholder="Enter competency requirement..."
                                      />
                                      <IconButton 
                                        onClick={() => handleDeleteCompetency(module, index)}
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
                                    onClick={() => handleAddCompetency(module)}
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
                              </Box>
                            </Box>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </StrictModeDroppable>

                <Button
                  startIcon={<AddIcon />}
                  onClick={() => addModule(day)}
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
                  Add Module
                </Button>
              </Box>
            ))}
          </DragDropContext>
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