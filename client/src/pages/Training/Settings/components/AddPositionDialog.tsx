import React, { useState } from 'react';
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
import { TrainingPosition, TrainingCategory } from '../../../../types';

interface AddPositionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (position: Omit<TrainingPosition, 'id'>) => void;
  categories: TrainingCategory[];
}

const AddPositionDialog: React.FC<AddPositionDialogProps> = ({
  open,
  onClose,
  onAdd,
  categories,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    description: '',
    category: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    department: '',
    description: '',
    category: '',
  });

  const validateForm = () => {
    const newErrors = {
      name: '',
      department: '',
      description: '',
      category: '',
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

    if (!formData.category) {
      newErrors.category = 'Category is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onAdd({
        name: formData.name.trim(),
        department: formData.department as 'FOH' | 'BOH',
        description: formData.description.trim(),
        category: formData.category,
        isActive: true,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      department: '',
      description: '',
      category: '',
    });
    setErrors({
      name: '',
      department: '',
      description: '',
      category: '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Position</DialogTitle>
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

          <FormControl error={!!errors.category} fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category}
              label="Category"
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories
                .filter((cat) => cat.department === formData.department)
                .map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
            </Select>
            {errors.category && (
              <FormHelperText>{errors.category}</FormHelperText>
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
          Add Position
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPositionDialog; 