import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Alert,
  useTheme,
  useMediaQuery,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Employee, TrainingPlan } from '../../../../types/training';

interface AssignPlanDialogProps {
  open: boolean;
  onClose: () => void;
  onAssign: (employeeId: string, planId: string, startDate: Date) => void;
  employees: Employee[];
  plans: TrainingPlan[];
}

const AssignPlanDialog: React.FC<AssignPlanDialogProps> = ({
  open,
  onClose,
  onAssign,
  employees,
  plans,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [startDate, setStartDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleSubmit = () => {
    if (!selectedEmployee || !selectedPlan || !startDate) {
      setError('Please fill out all fields');
      return;
    }

    const date = new Date(startDate);
    if (isNaN(date.getTime())) {
      setError('Please enter a valid start date');
      return;
    }

    onAssign(selectedEmployee, selectedPlan, date);
    handleClose();
  };

  const handleClose = () => {
    setSelectedEmployee('');
    setSelectedPlan('');
    setStartDate('');
    setError(null);
    setShowDetails(false);
    onClose();
  };

  const availableEmployees = employees.filter(employee => !employee.trainingProgress);
  const selectedPlanDetails = plans.find((plan) => plan._id === selectedPlan);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth 
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Typography variant={isMobile ? "h6" : "h5"}>
          Assign Training Plan
        </Typography>
        {isMobile && (
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError(null)}
              sx={{ mt: 1 }}
            >
              {error}
            </Alert>
          )}

          {availableEmployees.length === 0 ? (
            <Typography color="text.secondary">
              All employees currently have training plans assigned.
            </Typography>
          ) : (
            <>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={selectedEmployee}
                  label="Employee"
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  {availableEmployees.map((employee) => (
                    <MenuItem key={employee._id} value={employee._id}>
                      {employee.name} - {employee.position}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel>Training Plan</InputLabel>
                <Select
                  value={selectedPlan}
                  label="Training Plan"
                  onChange={(e) => {
                    setSelectedPlan(e.target.value);
                    if (e.target.value) {
                      setShowDetails(true);
                    }
                  }}
                >
                  {plans.map((plan) => (
                    <MenuItem key={plan._id} value={plan._id}>
                      {plan.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                size={isMobile ? "small" : "medium"}
                InputLabelProps={{
                  shrink: true,
                }}
              />

              {selectedPlan && (
                <Box sx={{ mt: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    <Typography variant="subtitle2" color="primary">
                      Plan Details
                    </Typography>
                    <IconButton size="small">
                      {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>

                  <Collapse in={showDetails}>
                    <Box sx={{ mt: 1, ml: 2 }}>
                      {selectedPlanDetails?.modules.map((module, index) => (
                        <Typography
                          key={`${module.name}-${index}`}
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          {index + 1}. {module.name}
                          {module.estimatedDuration && (
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                              sx={{ ml: 1 }}
                            >
                              ({module.estimatedDuration} minutes)
                            </Typography>
                          )}
                        </Typography>
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              )}
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: isMobile ? 2 : 3 }}>
        {!isMobile && <Button onClick={handleClose}>Cancel</Button>}
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={availableEmployees.length === 0}
          fullWidth={isMobile}
          size={isMobile ? "large" : "medium"}
        >
          Assign Plan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignPlanDialog; 