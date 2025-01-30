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
import { TrainingPosition } from '../../../../types';
import EditPositionDialog from './EditPositionDialog';
import DeleteConfirmDialog from '../../../../components/DeleteConfirmDialog';

interface PositionsTableProps {
  positions: TrainingPosition[];
  onUpdate: () => void;
}

const PositionsTable: React.FC<PositionsTableProps> = ({ positions, onUpdate }) => {
  const [editPosition, setEditPosition] = useState<TrainingPosition | null>(null);
  const [deletePosition, setDeletePosition] = useState<TrainingPosition | null>(null);

  const handleStatusChange = async (position: TrainingPosition) => {
    try {
      const response = await fetch(`/api/training/positions/${position.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !position.isActive,
        }),
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating position status:', error);
      // TODO: Add error notification
    }
  };

  const handleDelete = async () => {
    if (!deletePosition) return;

    try {
      const response = await fetch(`/api/training/positions/${deletePosition.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onUpdate();
        setDeletePosition(null);
      }
    } catch (error) {
      console.error('Error deleting position:', error);
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
            {positions.map((position) => (
              <TableRow key={position.id}>
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
                    <Switch
                      checked={position.isActive}
                      onChange={() => handleStatusChange(position)}
                      color="primary"
                    />
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => setEditPosition(position)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setDeletePosition(position)}
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
    </>
  );
};

export default PositionsTable; 