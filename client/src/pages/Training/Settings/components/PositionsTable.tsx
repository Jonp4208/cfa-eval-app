import React, { useState, useCallback } from 'react';
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
  CircularProgress,
  Snackbar,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { TrainingPosition } from '../../../../types/training';  // Adjust this path as needed
import EditPositionDialog from './EditPositionDialog';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'; // Adjust this path as needed

interface PositionsTableProps {
  positions: TrainingPosition[];
  onUpdate: () => void;
}

const PositionsTable: React.FC<PositionsTableProps> = ({ positions, onUpdate }) => {
  const [editPosition, setEditPosition] = useState<TrainingPosition | null>(null);
  const [deletePosition, setDeletePosition] = useState<TrainingPosition | null>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null); // State for error messages

  const handleStatusChange = useCallback(async (position: TrainingPosition) => {
    setLoading(prev => ({ ...prev, [position._id]: true }));
    try {
      const response = await fetch(`/api/training/positions/${position._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !position.isActive }),
      });
      if (!response.ok) {
        throw new Error(`Update failed with status ${response.status}`);
      }
      onUpdate();
    } catch (error) {
      console.error('Error updating position:', error);
      setError('Failed to update position status.'); // Set error message
    } finally {
      setLoading(prev => ({ ...prev, [position._id]: false }));
    }
  }, [onUpdate]);

  const handleDelete = async () => {
    if (!deletePosition) return;

    setLoading(prev => ({ ...prev, [deletePosition._id]: true }));
    try {
      const response = await fetch(`/api/training/positions/${deletePosition._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onUpdate();
        setDeletePosition(null);
      } else {
        throw new Error(`Delete failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting position:', error);
      setError('Failed to delete position.'); // Set error message
    } finally {
      setLoading(prev => ({ ...prev, [deletePosition._id]: false }));
    }
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table aria-label="positions table">
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
            {positions.map((position) => (
              <TableRow key={position._id}>
                <TableCell>{position.name}</TableCell>
                <TableCell>
                  <Chip 
                    label={position.department} 
                    color={position.department === 'FOH' ? 'primary' : 'secondary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{position.description}</TableCell>
                <TableCell>
                  <Tooltip title={position.isActive ? 'Active' : 'Inactive'}>
                    {loading[position._id] ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Switch
                        checked={position.isActive}
                        onChange={() => handleStatusChange(position)}
                        color="primary"
                        aria-label={`Toggle ${position.name} status`}
                      />
                    )}
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => setEditPosition(position)}
                    aria-label={`Edit ${position.name}`}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setDeletePosition(position)}
                    aria-label={`Delete ${position.name}`}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {editPosition && (
        <EditPositionDialog
          position={editPosition}
          open={!!editPosition}
          onClose={() => setEditPosition(null)}
          onSave={onUpdate}
        />
      )}

      <DeleteConfirmDialog
        open={!!deletePosition}
        onClose={() => setDeletePosition(null)}
        onConfirm={handleDelete}
        title="Delete Position"
        content={`Are you sure you want to delete the position "${deletePosition?.name}"? This action cannot be undone.`}
      />

      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          message={error}
        />
      )}
    </>
  );
};

export default React.memo(PositionsTable);