import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  LinearProgress,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import { DevelopmentPlan } from '../types/leadership';
import api from '@/lib/axios';
import { useNotification } from '@/contexts/NotificationContext';
import { toast } from '@/components/ui/use-toast';

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const ProgressSection = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
}));

interface AssignedPlan extends DevelopmentPlan {
  userId: {
    _id: string;
    name: string;
    position: string;
    email: string;
  };
  assignedBy: {
    _id: string;
    name: string;
    position: string;
  };
}

const DevelopmentDashboard: React.FC = () => {
  const [assignedPlans, setAssignedPlans] = useState<AssignedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<AssignedPlan | null>(null);

  const fetchAssignedPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/leadership/assigned-plans');
      console.log('Fetched assigned plans:', response.data);
      setAssignedPlans(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Error fetching assigned plans:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || 'Failed to load assigned plans',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedPlans();
  }, []);

  const calculateProgress = (plan: AssignedPlan) => {
    if (!plan.progress || !plan.competencies) return 0;
    const completedCompetencies = plan.progress.filter(p => p.status === 'completed').length;
    return (completedCompetencies / plan.competencies.length) * 100;
  };

  const handleDeleteClick = (plan: AssignedPlan) => {
    setSelectedPlan(plan);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPlan) return;

    try {
      await api.delete(`/api/leadership/plans/${selectedPlan._id}`);
      toast({
        title: "Success",
        description: `Development plan for ${selectedPlan.userId.name} was deleted successfully`,
      });
      setDeleteDialogOpen(false);
      fetchAssignedPlans();
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || 'Failed to delete plan',
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Assigned Development Plans
      </Typography>

      {assignedPlans.length === 0 ? (
        <Alert severity="info">
          No development plans have been assigned yet.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {assignedPlans.map((plan) => (
            <Grid item xs={12} key={plan._id}>
              <StyledCard>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {plan.userId.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {plan.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip 
                      label={plan.status}
                      color={plan.status === 'completed' ? 'success' : 'primary'}
                      size="small"
                    />
                    <IconButton 
                      onClick={() => handleDeleteClick(plan)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Current Level: {plan.currentLevel}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Target Level: {plan.targetLevel}
                    </Typography>
                  </Grid>
                </Grid>

                <ProgressSection>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(calculateProgress(plan))}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={calculateProgress(plan)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#E51636',
                      },
                    }}
                  />
                </ProgressSection>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Assigned by: {plan.assignedBy.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(plan.assignedDate).toLocaleDateString()}
                  </Typography>
                </Box>
              </StyledCard>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Development Plan</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the development plan assigned to {selectedPlan?.userId.name}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DevelopmentDashboard; 