import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { TrainingPlan, TrainingModule, TrainingPosition } from '../../../../types';
import ModuleList from './ModuleList';

interface AddTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

const steps = ['Basic Information', 'Configure Modules', 'Review'];

const AddTemplateDialog: React.FC<AddTemplateDialogProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [positions, setPositions] = useState<TrainingPosition[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    department: '',
    numberOfDays: '',
    includesCoreValues: false,
    includesBrandStandards: false,
  });
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [errors, setErrors] = useState({
    name: '',
    type: '',
    department: '',
    numberOfDays: '',
    modules: '',
  });

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/training/positions');
      const data = await response.json();
      setPositions(data);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const validateBasicInfo = () => {
    const newErrors = {
      name: '',
      type: '',
      department: '',
      numberOfDays: '',
      modules: '',
    };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.type) {
      newErrors.type = 'Type is required';
      isValid = false;
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
      isValid = false;
    }

    if (!formData.numberOfDays) {
      newErrors.numberOfDays = 'Number of days is required';
      isValid = false;
    } else if (parseInt(formData.numberOfDays) < 1) {
      newErrors.numberOfDays = 'Must be at least 1 day';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateModules = () => {
    const newErrors = { ...errors };
    let isValid = true;

    if (modules.length === 0) {
      newErrors.modules = 'At least one module is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    let canProceed = false;

    switch (activeStep) {
      case 0:
        canProceed = validateBasicInfo();
        break;
      case 1:
        canProceed = validateModules();
        break;
      default:
        canProceed = true;
    }

    if (canProceed) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/training/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          numberOfDays: parseInt(formData.numberOfDays),
          modules,
          isTemplate: true,
        }),
      });

      if (response.ok) {
        onSave();
        handleClose();
      }
    } catch (error) {
      console.error('Error creating template:', error);
      // TODO: Add error notification
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setFormData({
      name: '',
      type: '',
      department: '',
      numberOfDays: '',
      includesCoreValues: false,
      includesBrandStandards: false,
    });
    setModules([]);
    setErrors({
      name: '',
      type: '',
      department: '',
      numberOfDays: '',
      modules: '',
    });
    onClose();
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Template Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
            />

            <FormControl error={!!errors.type} fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="NEW_HIRE">New Hire</MenuItem>
                <MenuItem value="REGULAR">Regular Training</MenuItem>
              </Select>
              {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
            </FormControl>

            <FormControl error={!!errors.department} fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.department}
                label="Department"
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <MenuItem value="FOH">Front of House</MenuItem>
                <MenuItem value="BOH">Back of House</MenuItem>
              </Select>
              {errors.department && <FormHelperText>{errors.department}</FormHelperText>}
            </FormControl>

            <TextField
              label="Number of Days"
              type="number"
              value={formData.numberOfDays}
              onChange={(e) => setFormData({ ...formData, numberOfDays: e.target.value })}
              error={!!errors.numberOfDays}
              helperText={errors.numberOfDays}
              fullWidth
              inputProps={{ min: 1 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.includesCoreValues}
                  onChange={(e) => setFormData({ ...formData, includesCoreValues: e.target.checked })}
                />
              }
              label="Include Core Values Training"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.includesBrandStandards}
                  onChange={(e) => setFormData({ ...formData, includesBrandStandards: e.target.checked })}
                />
              }
              label="Include Brand Standards Training"
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <ModuleList
              modules={modules}
              onChange={setModules}
              department={formData.department as 'FOH' | 'BOH'}
              numberOfDays={parseInt(formData.numberOfDays)}
              positions={positions}
              error={errors.modules}
            />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Review Template</Typography>
            <Typography><strong>Name:</strong> {formData.name}</Typography>
            <Typography><strong>Type:</strong> {formData.type}</Typography>
            <Typography><strong>Department:</strong> {formData.department}</Typography>
            <Typography><strong>Duration:</strong> {formData.numberOfDays} days</Typography>
            <Typography><strong>Includes Core Values:</strong> {formData.includesCoreValues ? 'Yes' : 'No'}</Typography>
            <Typography><strong>Includes Brand Standards:</strong> {formData.includesBrandStandards ? 'Yes' : 'No'}</Typography>
            <Typography><strong>Number of Modules:</strong> {modules.length}</Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Training Template</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {renderStepContent(activeStep)}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {activeStep > 0 && (
          <Button onClick={handleBack}>Back</Button>
        )}
        {activeStep === steps.length - 1 ? (
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Create Template
          </Button>
        ) : (
          <Button onClick={handleNext} variant="contained" color="primary">
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddTemplateDialog; 