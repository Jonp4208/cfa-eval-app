import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Switch,
  Tooltip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { TrainingCategory } from '../../../../types';
import EditCategoryDialog from './EditCategoryDialog';
import DeleteConfirmDialog from '../../../../components/DeleteConfirmDialog';

interface CategoriesTableProps {
  categories: TrainingCategory[];
  onUpdate: () => void;
}

const CategoriesTable: React.FC<CategoriesTableProps> = ({ categories, onUpdate }) => {
  const [editCategory, setEditCategory] = useState<TrainingCategory | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<TrainingCategory | null>(null);

  const handleStatusChange = async (category: TrainingCategory) => {
    try {
      const response = await fetch(`/api/training/categories/${category.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !category.isActive,
        }),
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating category status:', error);
      // TODO: Add error notification
    }
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;

    try {
      const response = await fetch(`/api/training/categories/${deleteCategory.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onUpdate();
        setDeleteCategory(null);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      // TODO: Add error notification
    }
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>
                  <Chip 
                    label={category.department} 
                    color={category.department === 'FOH' ? 'primary' : 'secondary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>
                  <Tooltip title={category.isActive ? 'Active' : 'Inactive'}>
                    <Switch
                      checked={category.isActive}
                      onChange={() => handleStatusChange(category)}
                      color="primary"
                    />
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => setEditCategory(category)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setDeleteCategory(category)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {editCategory && (
        <EditCategoryDialog
          category={editCategory}
          open={!!editCategory}
          onClose={() => setEditCategory(null)}
          onSave={onUpdate}
        />
      )}

      <DeleteConfirmDialog
        open={!!deleteCategory}
        onClose={() => setDeleteCategory(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        content={`Are you sure you want to delete the category "${deleteCategory?.name}"? This action cannot be undone.`}
      />
    </>
  );
};

export default CategoriesTable; 