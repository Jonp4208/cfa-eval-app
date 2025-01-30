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
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as AccessTimeIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { TrainingPlan } from '../../../../types/training';

interface TrainingPlanListProps {
  plans: TrainingPlan[];
}

const TrainingPlanList: React.FC<TrainingPlanListProps> = ({ plans }) => {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const handleExpandClick = (planId: string) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = 
      plan.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = !departmentFilter || plan.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const calculateTotalDuration = (plan: TrainingPlan): number => {
    return plan.modules.reduce((total, module) => {
      const duration = parseInt(module.estimatedDuration) || 0;
      return total + duration;
    }, 0);
  };

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <TextField
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Department</InputLabel>
            <Select
              value={departmentFilter}
              label="Department"
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="FOH">Front of House</MenuItem>
              <MenuItem value="BOH">Back of House</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {filteredPlans.map((plan) => (
        <Card key={plan._id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" component="div">
                  {plan.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Chip
                    icon={<CategoryIcon />}
                    label={plan.department}
                    size="small"
                    color="primary"
                  />
                  <Chip
                    icon={<AccessTimeIcon />}
                    label={`${calculateTotalDuration(plan)} minutes total`}
                    size="small"
                  />
                  <Chip
                    label={`${plan.modules.length} modules`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={plan.type === 'NEW_HIRE' ? 'New Hire' : 'Regular'}
                    size="small"
                    color={plan.type === 'NEW_HIRE' ? 'secondary' : 'default'}
                  />
                </Box>
              </Box>
              <IconButton onClick={() => handleExpandClick(plan._id)}>
                {expandedPlan === plan._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={expandedPlan === plan._id}>
              <List sx={{ mt: 2 }}>
                {plan.modules.map((module, index) => (
                  <ListItem
                    key={`${plan._id}-module-${index}`}
                    sx={{
                      bgcolor: 'background.paper',
                      mb: 1,
                      borderRadius: 1,
                    }}
                  >
                    <ListItemIcon>
                      <Typography
                        variant="body2"
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {index + 1}
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={module.name}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Tooltip title="Estimated Duration">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTimeIcon fontSize="small" />
                              <Typography variant="body2">
                                {module.estimatedDuration}
                              </Typography>
                            </Box>
                          </Tooltip>
                          {module.requiredForNewHire && (
                            <Chip
                              label="Required for New Hire"
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </CardContent>
        </Card>
      ))}

      {filteredPlans.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
          No training plans found matching your criteria.
        </Typography>
      )}
    </Box>
  );
};

export default TrainingPlanList; 