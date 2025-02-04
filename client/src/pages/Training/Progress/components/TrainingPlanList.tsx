import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as AccessTimeIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { Edit2, Trash2 } from 'lucide-react';
import { TrainingPlan } from '../../../../types/training';
import { SimplifiedTrainingPlan } from '../types';
import api from '@/lib/axios';
import EditPlanDialog from './EditPlanDialog';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface TrainingPlanListProps {
  plans: SimplifiedTrainingPlan[];
  onPlanUpdated?: () => void;
}

const TrainingPlanList: React.FC<TrainingPlanListProps> = ({ plans, onPlanUpdated }) => {
  const { user } = useAuth();
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<SimplifiedTrainingPlan | null>(null);
  const [planToEdit, setPlanToEdit] = useState<SimplifiedTrainingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPlans, setLocalPlans] = useState<SimplifiedTrainingPlan[]>(plans);

  // Update local plans when props change
  React.useEffect(() => {
    setLocalPlans(plans);
  }, [plans]);

  const handleExpandClick = (planId: string) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  const handleEditClick = (plan: SimplifiedTrainingPlan) => {
    setPlanToEdit(plan);
  };

  const handleDeleteClick = (plan: SimplifiedTrainingPlan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete || !planToDelete._id) {
      setError('Invalid training plan ID');
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      return;
    }

    try {
      await api.delete(`/api/training/plans/${planToDelete._id}`);
      
      // Update local state immediately
      setLocalPlans(prevPlans => prevPlans.filter(plan => plan._id !== planToDelete._id));
      
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      
      // Show success notification
      toast({
        title: "Success",
        description: `Training plan "${planToDelete.name}" has been deleted.`,
      });

      // Clear cache and refresh in background
      sessionStorage.removeItem(`training_data_${user?._id}`);
      if (onPlanUpdated) {
        onPlanUpdated();
      }
    } catch (err) {
      setError('Failed to delete training plan');
      toast({
        title: "Error",
        description: "Failed to delete training plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredPlans = localPlans.filter(plan => {
    const matchesSearch = 
      plan.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = !departmentFilter || plan.name.toLowerCase().includes(departmentFilter.toLowerCase());
    return matchesSearch && matchesDepartment;
  });

  const calculateTotalDuration = (plan: SimplifiedTrainingPlan): number => {
    if (!plan.modules) return 0;
    return plan.modules.reduce((total, module) => total + (parseInt(module.estimatedDuration) || 0), 0);
  };

  return (
    <Box>
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1.5, sm: 2 },
        mb: { xs: 2, sm: 3 },
        mt: { xs: 2, sm: 0 },
        px: { xs: 2, sm: 0 },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        width: '100%'
      }}>
        <TextField
          placeholder="Search plans..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(39, 37, 31, 0.6)' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: '100%',
            maxWidth: { sm: '300px' },
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
              borderRadius: '8px',
              height: '40px',
              '& fieldset': {
                borderColor: 'rgba(39, 37, 31, 0.1)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(39, 37, 31, 0.2)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#E51636',
              }
            },
            '& .MuiOutlinedInput-input': {
              padding: '8px 14px',
              '&::placeholder': {
                color: 'rgba(39, 37, 31, 0.6)',
                opacity: 1,
              },
            }
          }}
        />

        <FormControl sx={{ 
          width: '100%',
          maxWidth: { sm: '200px' }
        }}>
          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            displayEmpty
            renderValue={departmentFilter !== '' ? undefined : () => "Department"}
            sx={{
              backgroundColor: 'white',
              borderRadius: '8px',
              height: '40px',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(39, 37, 31, 0.1)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(39, 37, 31, 0.2)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#E51636',
              },
              '& .MuiSelect-select': {
                color: departmentFilter ? '#27251F' : 'rgba(39, 37, 31, 0.6)',
                padding: '8px 14px',
              }
            }}
          >
            <MenuItem value="">All Departments</MenuItem>
            <MenuItem value="FOH">Front of House</MenuItem>
            <MenuItem value="BOH">Back of House</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            borderRadius: '12px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FEE2E2',
            '& .MuiAlert-icon': {
              color: '#DC2626'
            }
          }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {filteredPlans.map((plan) => (
        <Card 
          key={plan._id} 
          sx={{ 
            mb: 2,
            mx: { xs: 2, sm: 0 },
            backgroundColor: 'white',
            borderRadius: { xs: '12px', sm: '20px' },
            boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
            border: '1px solid',
            borderColor: 'rgba(39, 37, 31, 0.1)'
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' }, 
              justifyContent: 'space-between',
              gap: { xs: 2, sm: 0 }
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h6" 
                  component="div"
                  sx={{ 
                    color: '#27251F',
                    fontWeight: 500,
                    mb: { xs: 1, sm: 2 },
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  {plan.name}
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  flexWrap: 'wrap',
                  mb: { xs: 1, sm: 0 }
                }}>
                  <Chip
                    icon={<CategoryIcon />}
                    label={plan.name}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(229, 22, 54, 0.1)',
                      color: '#E51636',
                      borderRadius: '16px',
                      height: '28px',
                      '& .MuiChip-icon': {
                        color: '#E51636',
                        fontSize: '16px'
                      }
                    }}
                  />
                  <Chip
                    icon={<AccessTimeIcon />}
                    label={`${calculateTotalDuration(plan)} minutes total`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(39, 37, 31, 0.1)',
                      color: 'rgba(39, 37, 31, 0.8)',
                      borderRadius: '16px',
                      height: '28px',
                      '& .MuiChip-icon': {
                        color: 'rgba(39, 37, 31, 0.8)',
                        fontSize: '16px'
                      }
                    }}
                  />
                </Box>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                gap: 1,
                ml: { xs: 0, sm: 2 },
                alignSelf: { xs: 'flex-end', sm: 'center' }
              }}>
                <IconButton 
                  onClick={() => handleEditClick(plan)} 
                  size="small"
                  sx={{
                    color: 'rgba(39, 37, 31, 0.6)',
                    '&:hover': {
                      color: '#E51636',
                      backgroundColor: 'rgba(229, 22, 54, 0.1)',
                    },
                  }}
                >
                  <Edit2 size={18} />
                </IconButton>
                <IconButton 
                  onClick={() => handleDeleteClick(plan)} 
                  size="small"
                  sx={{
                    color: 'rgba(39, 37, 31, 0.6)',
                    '&:hover': {
                      color: '#DC2626',
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    },
                  }}
                >
                  <Trash2 size={18} />
                </IconButton>
                <IconButton
                  onClick={() => handleExpandClick(plan._id)}
                  size="small"
                  sx={{
                    color: 'rgba(39, 37, 31, 0.6)',
                    '&:hover': {
                      color: 'rgba(39, 37, 31, 0.8)',
                      backgroundColor: 'rgba(39, 37, 31, 0.1)',
                    },
                  }}
                >
                  {expandedPlan === plan._id ? (
                    <ExpandLessIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <ExpandMoreIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </Box>
            </Box>

            <Collapse in={expandedPlan === plan._id}>
              <List sx={{ mt: 2 }}>
                {plan.modules?.map((module, index) => (
                  <ListItem 
                    key={`${plan._id}-module-${index}`}
                    disablePadding
                    sx={{ mb: 1 }}
                  >
                    <ListItemText
                      primary={module.name}
                      secondary={`${module.estimatedDuration} minutes`}
                      primaryTypographyProps={{
                        sx: { color: '#27251F', fontWeight: 500 }
                      }}
                      secondaryTypographyProps={{
                        sx: { color: 'rgba(39, 37, 31, 0.6)' }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </CardContent>
        </Card>
      ))}

      {filteredPlans.length === 0 && (
        <Card sx={{ 
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
          border: '1px solid',
          borderColor: 'rgba(39, 37, 31, 0.1)'
        }}>
          <CardContent sx={{ p: 6 }}>
            <Typography 
              align="center" 
              sx={{ 
                color: 'rgba(39, 37, 31, 0.6)',
                fontSize: '0.875rem'
              }}
            >
              No training plans found matching your criteria.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        keepMounted={false}
        disablePortal={false}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)'
          }
        }}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle 
          id="delete-dialog-title"
          sx={{ 
            p: 3,
            color: '#27251F',
            borderBottom: '1px solid',
            borderColor: 'rgba(39, 37, 31, 0.1)'
          }}
        >
          Delete Training Plan
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Typography sx={{ color: 'rgba(39, 37, 31, 0.8)' }}>
            Are you sure you want to delete "{planToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3,
          borderTop: '1px solid',
          borderColor: 'rgba(39, 37, 31, 0.1)'
        }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: 'rgba(39, 37, 31, 0.6)',
              '&:hover': {
                backgroundColor: 'rgba(39, 37, 31, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained"
            sx={{
              backgroundColor: '#DC2626',
              color: 'white',
              '&:hover': {
                backgroundColor: '#B91C1C'
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Plan Dialog */}
      {planToEdit && (
        <EditPlanDialog
          open={true}
          onClose={() => setPlanToEdit(null)}
          plan={planToEdit}
          onPlanUpdated={onPlanUpdated}
        />
      )}
    </Box>
  );
};

export default TrainingPlanList; 