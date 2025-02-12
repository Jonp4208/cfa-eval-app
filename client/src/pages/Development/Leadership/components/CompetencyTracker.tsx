import React from 'react';
import {
  Box,
  Card,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  IconButton,
  Collapse,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Competency, CompetencyStatus, Milestone } from '../types/leadership';

interface CompetencyTrackerProps {
  competency: Competency;
  onMilestoneComplete?: (competencyId: string, milestoneId: string) => void;
}

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  border: '1px solid #e0e0e0',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const StatusChip = styled(Chip)<{ status: CompetencyStatus }>(({ status, theme }) => ({
  backgroundColor: status === 'completed' 
    ? '#4caf50' 
    : status === 'in_progress' 
    ? '#ff9800' 
    : '#e0e0e0',
  color: '#ffffff',
  fontWeight: 500,
}));

const MilestoneCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(1),
  backgroundColor: '#f5f5f5',
  borderRadius: theme.shape.borderRadius,
}));

const CompetencyTracker: React.FC<CompetencyTrackerProps> = ({
  competency,
  onMilestoneComplete,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const completedMilestones = competency.milestones.filter(
    (m) => m.status === 'completed'
  ).length;
  const progress = (completedMilestones / competency.milestones.length) * 100;

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const getStatusColor = (status: CompetencyStatus) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'in_progress':
        return '#ff9800';
      default:
        return '#e0e0e0';
    }
  };

  return (
    <StyledCard>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs key="title">
          <Typography variant="h6" color="#E51636">
            {competency.name}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {competency.description}
          </Typography>
        </Grid>
        <Grid item key="status">
          <StatusChip
            label={competency.status}
            status={competency.status}
            size="small"
          />
        </Grid>
        <Grid item key="expand">
          <IconButton
            onClick={handleExpandClick}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: '#e0e0e0',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#E51636',
            },
          }}
        />
        <Typography variant="body2" color="textSecondary" align="right" sx={{ mt: 1 }}>
          {completedMilestones} of {competency.milestones.length} milestones completed
        </Typography>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 2 }}>
          {competency.milestones.map((milestone: Milestone) => (
            <MilestoneCard key={milestone.id}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <Typography variant="subtitle1">{milestone.title}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {milestone.description}
                  </Typography>
                </Grid>
                <Grid item>
                  <CheckCircleIcon
                    sx={{
                      color: getStatusColor(milestone.status),
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      onMilestoneComplete?.(competency.id, milestone.id)
                    }
                  />
                </Grid>
              </Grid>
            </MilestoneCard>
          ))}
        </Box>
      </Collapse>
    </StyledCard>
  );
};

export default CompetencyTracker; 