import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { TrainingModule, TrainingPosition, TrainingMaterial } from '../../../../types';
import MaterialList from './MaterialList';

interface ModuleListProps {
  modules: TrainingModule[];
  onChange: (modules: TrainingModule[]) => void;
  department: 'FOH' | 'BOH';
  numberOfDays: number;
  positions: TrainingPosition[];
  error?: string;
}

interface ModuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (module: Omit<TrainingModule, 'id'>) => void;
  module?: TrainingModule;
  department: 'FOH' | 'BOH';
  positions: TrainingPosition[];
  numberOfDays: number;
}

const ModuleDialog: React.FC<ModuleDialogProps> = ({
  open,
  onClose,
  onSave,
  module,
  department,
  positions,
  numberOfDays,
}) => {
  const [formData, setFormData] = useState({
    name: module?.name || '',
    description: module?.description || '',
    position: module?.position || '',
    estimatedDuration: module?.estimatedDuration || '',
    dayNumber: module?.dayNumber || 1,
    requiredForNewHire: module?.requiredForNewHire || false,
  });

  const [materials, setMaterials] = useState<TrainingMaterial[]>(
    module?.materials || []
  );

  const [errors, setErrors] = useState({
    name: '',
    description: '',
    position: '',
    estimatedDuration: '',
    dayNumber: '',
  });

  const validateForm = () => {
    const newErrors = {
      name: '',
      description: '',
      position: '',
      estimatedDuration: '',
      dayNumber: '',
    };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }

    if (!formData.position) {
      newErrors.position = 'Position is required';
      isValid = false;
    }

    if (!formData.estimatedDuration.trim()) {
      newErrors.estimatedDuration = 'Duration is required';
      isValid = false;
    }

    if (!formData.dayNumber) {
      newErrors.dayNumber = 'Day number is required';
      isValid = false;
    } else if (formData.dayNumber < 1 || formData.dayNumber > numberOfDays) {
      newErrors.dayNumber = `Must be between 1 and ${numberOfDays}`;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave({
        ...formData,
        department,
        materials,
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{module ? 'Edit Module' : 'Add Module'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Module Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
          />

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={!!errors.description}
            helperText={errors.description}
            multiline
            rows={3}
            fullWidth
          />

          <FormControl error={!!errors.position} fullWidth>
            <InputLabel>Position</InputLabel>
            <Select
              value={formData.position}
              label="Position"
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            >
              {positions
                .filter((pos) => pos.department === department && pos.isActive)
                .map((position) => (
                  <MenuItem key={position.id} value={position.id}>
                    {position.name}
                  </MenuItem>
                ))}
            </Select>
            {errors.position && <FormHelperText>{errors.position}</FormHelperText>}
          </FormControl>

          <TextField
            label="Estimated Duration"
            value={formData.estimatedDuration}
            onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
            error={!!errors.estimatedDuration}
            helperText={errors.estimatedDuration}
            placeholder="e.g., 2 hours"
            fullWidth
          />

          <TextField
            label="Day Number"
            type="number"
            value={formData.dayNumber}
            onChange={(e) => setFormData({ ...formData, dayNumber: parseInt(e.target.value) })}
            error={!!errors.dayNumber}
            helperText={errors.dayNumber}
            fullWidth
            inputProps={{ min: 1, max: numberOfDays }}
          />

          <Box sx={{ mt: 2 }}>
            <MaterialList
              materials={materials}
              onChange={setMaterials}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {module ? 'Save Changes' : 'Add Module'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ModuleList: React.FC<ModuleListProps> = ({
  modules,
  onChange,
  department,
  numberOfDays,
  positions,
  error,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | undefined>();

  const handleAdd = (module: Omit<TrainingModule, 'id'>) => {
    const newModule = {
      ...module,
      id: Date.now().toString(), // Temporary ID, will be replaced by server
    };
    onChange([...modules, newModule]);
    setIsDialogOpen(false);
  };

  const handleEdit = (module: Omit<TrainingModule, 'id'>) => {
    if (!selectedModule) return;
    
    const updatedModules = modules.map((m) =>
      m.id === selectedModule.id ? { ...module, id: selectedModule.id } : m
    );
    onChange(updatedModules);
    setSelectedModule(undefined);
    setIsDialogOpen(false);
  };

  const handleDelete = (moduleId: string) => {
    onChange(modules.filter((m) => m.id !== moduleId));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(modules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange(items);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Training Modules</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedModule(undefined);
            setIsDialogOpen(true);
          }}
        >
          Add Module
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="modules">
          {(provided) => (
            <Box {...provided.droppableProps} ref={provided.innerRef}>
              {modules.map((module, index) => (
                <Draggable key={module.id} draggableId={module.id} index={index}>
                  {(provided) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      sx={{ mb: 2 }}
                    >
                      <CardContent>
                        <Grid container alignItems="center" spacing={2}>
                          <Grid item {...provided.dragHandleProps}>
                            <DragIndicatorIcon />
                          </Grid>
                          <Grid item xs>
                            <Typography variant="subtitle1">{module.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Day {module.dayNumber} • {module.estimatedDuration}
                            </Typography>
                          </Grid>
                          <Grid item>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedModule(module);
                                setIsDialogOpen(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(module.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>

      <ModuleDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedModule(undefined);
        }}
        onSave={selectedModule ? handleEdit : handleAdd}
        module={selectedModule}
        department={department}
        positions={positions}
        numberOfDays={numberOfDays}
      />
    </Box>
  );
};

export default ModuleList; 