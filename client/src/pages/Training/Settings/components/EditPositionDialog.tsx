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
} from '@mui/material';
import { TrainingPosition } from '../../../../types';

interface EditPositionDialogProps {
  position: TrainingPosition;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

const EditPositionDialog: React.FC<EditPositionDialogProps> = ({
  position,
  open,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    description: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    department: '',
    description: '',
  });

  useEffect(() => {
    if (position) {
      setFormData({
        name: position.name,
        department: position.department,
        description: position.description,
      });
    }
  }, [position]);

  const validateForm = () => {
    const newErrors = {
      name: '',
      department: '',
      description: '',
    };

    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
      isValid = false;
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        const response = await fetch(`/api/training/positions/${position.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            department: formData.department,
            description: formData.description.trim(),
          }),
        });

        if (response.ok) {
          onSave();
          handleClose();
        }
      } catch (error) {
        console.error('Error updating position:', error);
        // TODO: Add error notification
      }
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      department: '',
      description: '',
    });
    setErrors({
      name: '',
      department: '',
      description: '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Position</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Position Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
          />

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
            {errors.department && (
              <FormHelperText>{errors.department}</FormHelperText>
            )}
          </FormControl>

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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPositionDialog; 