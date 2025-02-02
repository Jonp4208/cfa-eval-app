import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  useTheme,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { TrainingCategory } from '../../../types/training';
import CategoriesTable from './components/CategoriesTable';
import AddCategoryDialog from './components/AddCategoryDialog';

const TrainingSettings = () => {
  const theme = useTheme();
  const [categories, setCategories] = useState<TrainingCategory[]>([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  useEffect(() => {
    // Fetch categories
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesRes = await fetch('/api/training/categories');
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching training settings:', error);
      // TODO: Add error notification
    }
  };

  const handleAddCategory = async (category: Omit<TrainingCategory, 'id' | 'positions'>) => {
    try {
      const response = await fetch('/api/training/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });
      
      if (response.ok) {
        await fetchCategories();
        setIsAddCategoryOpen(false);
      }
    } catch (error) {
      console.error('Error adding category:', error);
      // TODO: Add error notification
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Training Settings
      </Typography>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsAddCategoryOpen(true)}
            >
              Add Category
            </Button>
          </Box>
          <CategoriesTable 
            categories={categories}
            onUpdate={fetchCategories}
          />
        </CardContent>
      </Card>

      <AddCategoryDialog
        open={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onAdd={handleAddCategory}
      />
    </Box>
  );
};

export default TrainingSettings; 