import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Collapse,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Employee, TrainingModule, TraineeProgress } from '../../../../types/training';

interface EmployeeWithProgress extends Employee {
  moduleProgress: TraineeProgress['moduleProgress'];
  trainingPlan?: {
    name: string;
  };
}

interface EmployeeProgressProps {
  employees: EmployeeWithProgress[];
  onUpdateProgress: () => void;
}

interface ProgressUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (notes: string) => void;
  currentNotes?: string;
}

const ProgressUpdateDialog: React.FC<ProgressUpdateDialogProps> = ({
  open,
  onClose,
  onSave,
  currentNotes = '',
}) => {
  const [notes, setNotes] = useState(currentNotes);

  const handleSave = () => {
    onSave(notes);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Update Progress Notes</DialogTitle>
      <DialogContent>
        <TextField
          multiline
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          label="Progress Notes"
          placeholder="Enter any notes about the trainee's progress..."
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Notes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EmployeeProgress: React.FC<EmployeeProgressProps> = ({ employees, onUpdateProgress }) => {
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<{
    employeeId: string;
    moduleId: string;
    currentNotes?: string;
  } | null>(null);

  const handleExpandClick = (employeeId: string) => {
    setExpandedEmployee(expandedEmployee === employeeId ? null : employeeId);
  };

  const handleProgressUpdate = async (
    employeeId: string,
    moduleId: string,
    completed: boolean,
    notes?: string
  ) => {
    try {
      const response = await fetch('/api/training/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          moduleId,
          completed,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      onUpdateProgress();
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  const calculateProgress = (modules: TraineeProgress['moduleProgress']): number => {
    if (!modules.length) return 0;
    const completedModules = modules.filter(m => m.completed).length;
    return (completedModules / modules.length) * 100;
  };

  const getStatusColor = (progress: number): 'success' | 'warning' | 'error' => {
    if (progress >= 80) return 'success';
    if (progress >= 40) return 'warning';
    return 'error';
  };

  return (
    <Box>
      {employees.map((employee) => {
        const progress = calculateProgress(employee.moduleProgress);
        const statusColor = getStatusColor(progress);

        return (
          <Card key={employee._id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" component="div">
                    {employee.name}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    {employee.position} - {employee.department}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        color={statusColor}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(progress)}% Complete
                    </Typography>
                    <Chip
                      label={employee.trainingPlan?.name || 'No Plan Assigned'}
                      color={employee.trainingPlan ? 'primary' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
                <IconButton onClick={() => handleExpandClick(employee._id)}>
                  {expandedEmployee === employee._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={expandedEmployee === employee._id}>
                <List sx={{ mt: 2 }}>
                  {employee.moduleProgress.map((module) => (
                    <ListItem
                      key={module.moduleId}
                      sx={{
                        bgcolor: 'background.paper',
                        mb: 1,
                        borderRadius: 1,
                      }}
                    >
                      <ListItemText
                        primary={module.moduleId}
                        secondary={
                          <React.Fragment>
                            <Typography variant="body2" color="text.secondary">
                              {module.notes || 'No progress notes'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                              {module.completed ? (
                                <Tooltip title="Completed">
                                  <CheckCircleIcon color="success" fontSize="small" />
                                </Tooltip>
                              ) : (
                                <Tooltip title="In Progress">
                                  <WarningIcon color="warning" fontSize="small" />
                                </Tooltip>
                              )}
                              <Typography variant="body2" color="text.secondary">
                                {module.completed ? 'Completed' : 'In Progress'}
                              </Typography>
                            </Box>
                          </React.Fragment>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Checkbox
                            checked={module.completed}
                            onChange={(e) =>
                              handleProgressUpdate(
                                employee._id,
                                module.moduleId,
                                e.target.checked,
                                module.notes
                              )
                            }
                          />
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedModule({
                                employeeId: employee._id,
                                moduleId: module.moduleId,
                                currentNotes: module.notes,
                              });
                              setIsUpdateDialogOpen(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </CardContent>
          </Card>
        );
      })}

      <ProgressUpdateDialog
        open={isUpdateDialogOpen}
        onClose={() => {
          setIsUpdateDialogOpen(false);
          setSelectedModule(null);
        }}
        onSave={(notes) => {
          if (selectedModule) {
            handleProgressUpdate(
              selectedModule.employeeId,
              selectedModule.moduleId,
              true,
              notes
            );
          }
          setIsUpdateDialogOpen(false);
          setSelectedModule(null);
        }}
        currentNotes={selectedModule?.currentNotes}
      />
    </Box>
  );
};

export default EmployeeProgress; 