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

  // Format today's date as YYYY-MM-DD for the date input
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const today = formatDate(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleSubmit = () => {
    if (!selectedEmployee || !selectedPlan || !startDate) {
      setError('Please fill out all fields');
      return;
    }

    // Create dates and strip time components
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const selectedDateString = startDate;

    // Simple string comparison of YYYY-MM-DD format
    if (selectedDateString < todayString) {
      setError('Start date cannot be in the past');
      return;
    }

    // If we get here, the date is valid (today or future)
    const selectedDate = new Date(startDate + 'T00:00:00');
    onAssign(selectedEmployee, selectedPlan, selectedDate);
    handleClose();
  };

  const handleClose = () => {
    setSelectedEmployee('');
    setSelectedPlan('');
    setStartDate(today);
    setError(null);
    setShowDetails(false);
    onClose();
  };

  const availableEmployees = employees;
  const selectedPlanDetails = plans.find((plan) => plan._id === selectedPlan);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth 
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: '20px',
          maxHeight: '90vh',
          margin: isMobile ? 0 : 2,
          '& .MuiDialogContent-root': {
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(39, 37, 31, 0.2)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(39, 37, 31, 0.05)',
            },
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'rgba(39, 37, 31, 0.1)'
      }}>
        <Box component="div">
          <Typography 
            component="div" 
            variant={isMobile ? "h6" : "h5"}
            sx={{ 
              color: '#27251F',
              fontWeight: 500
            }}
          >
            Assign Training Plan
          </Typography>
        </Box>
        {isMobile && (
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ color: 'rgba(39, 37, 31, 0.6)' }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 3,
          alignItems: 'center',
          width: '100%',
          maxWidth: '500px',
          mx: 'auto',
          mt: 3
        }}>
          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError(null)}
              sx={{ 
                borderRadius: '12px',
                backgroundColor: '#FEF2F2',
                border: '1px solid',
                borderColor: '#FEE2E2',
                width: '100%',
                '& .MuiAlert-icon': {
                  color: '#DC2626'
                }
              }}
            >
              {error}
            </Alert>
          )}

          {availableEmployees.length === 0 ? (
            <Typography 
              color="text.secondary"
              sx={{ color: 'rgba(39, 37, 31, 0.6)' }}
            >
              All employees currently have training plans assigned.
            </Typography>
          ) : (
            <>
              <FormControl 
                fullWidth 
                size={isMobile ? "small" : "medium"}
              >
                <InputLabel sx={{ 
                  color: 'rgba(39, 37, 31, 0.6)'
                }}>Employee</InputLabel>
                <Select
                  value={selectedEmployee}
                  label="Employee"
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  sx={{
                    borderRadius: '12px',
                    height: 56,
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
                  {availableEmployees.map((employee) => (
                    <MenuItem 
                      key={employee._id} 
                      value={employee._id}
                      sx={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        py: 1.5,
                        '& .MuiTypography-root': {
                          fontSize: '0.875rem',
                        }
                      }}
                    >
                      <Typography noWrap={false}>
                        {employee.name} - {employee.position}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel sx={{ color: 'rgba(39, 37, 31, 0.6)' }}>Training Plan</InputLabel>
                <Select
                  value={selectedPlan}
                  label="Training Plan"
                  onChange={(e) => {
                    setSelectedPlan(e.target.value);
                    if (e.target.value) {
                      setShowDetails(true);
                    }
                  }}
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
                  {plans.map((plan) => (
                    <MenuItem key={plan._id} value={plan._id}>
                      {plan.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    min: today
                  }}
                  sx={{
                    borderRadius: '12px',
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
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#E51636',
                    }
                  }}
                />
              </FormControl>

              {selectedPlan && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: 'rgba(39, 37, 31, 0.8)',
                    '&:hover': {
                      color: '#E51636'
                    }
                  }} onClick={() => setShowDetails(!showDetails)}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                      Plan Details
                    </Typography>
                    <IconButton size="small">
                      {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>

                  <Collapse in={showDetails}>
                    <Box sx={{ 
                      mt: 2,
                      ml: 2,
                      p: 2,
                      borderRadius: '12px',
                      backgroundColor: 'rgba(229, 22, 54, 0.05)',
                    }}>
                      {selectedPlanDetails?.modules.map((module, index) => (
                        <Typography
                          key={`${module.name}-${index}`}
                          variant="body2"
                          sx={{ 
                            mb: 1,
                            color: 'rgba(39, 37, 31, 0.8)',
                            '&:last-child': { mb: 0 }
                          }}
                        >
                          {index + 1}. {module.name}
                          {module.estimatedDuration && (
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{ 
                                ml: 1,
                                color: 'rgba(39, 37, 31, 0.6)'
                              }}
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

      <DialogActions sx={{ 
        p: isMobile ? 2 : 3,
        borderTop: '1px solid',
        borderColor: 'rgba(39, 37, 31, 0.1)'
      }}>
        {!isMobile && (
          <Button 
            onClick={handleClose}
            sx={{
              color: 'rgba(39, 37, 31, 0.6)',
              '&:hover': {
                backgroundColor: 'rgba(39, 37, 31, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={availableEmployees.length === 0}
          fullWidth={isMobile}
          size={isMobile ? "large" : "medium"}
          sx={{
            backgroundColor: '#E51636',
            color: 'white',
            borderRadius: '16px',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'rgba(229, 22, 54, 0.9)'
            },
            '&.Mui-disabled': {
              backgroundColor: 'rgba(39, 37, 31, 0.12)',
              color: 'rgba(39, 37, 31, 0.26)'
            }
          }}
        >
          Assign Plan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignPlanDialog; 