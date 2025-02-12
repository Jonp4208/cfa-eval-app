import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  LinearProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Alert,
  Chip,
  ListItemAvatar,
  Avatar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { DevelopmentPlan as IDevelopmentPlan, LeadershipLevel, Competency } from '../types/leadership';
import CompetencyTracker from './CompetencyTracker';
import api from '@/lib/axios';

interface DevelopmentPlanProps {
  plan: IDevelopmentPlan | null;
  competencies: Competency[];
  onUpdateProgress?: (competencyId: string, milestoneId: string) => void;
  loading?: boolean;
}

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const ProgressSection = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const levelSteps: LeadershipLevel[] = ['Emerging', 'Team', 'Senior'];

const StyledPlanCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  border: '1px solid #e0e0e0',
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  marginBottom: theme.spacing(2),
  backgroundColor: '#ffffff',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    borderColor: '#E51636',
  },
  '&.selected': {
    borderColor: '#E51636',
    borderWidth: '2px',
    boxShadow: '0 4px 12px rgba(229,22,54,0.15)',
  }
}));

const DevelopmentPlan: React.FC<DevelopmentPlanProps> = ({
  plan,
  competencies,
  onUpdateProgress,
  loading = false
}) => {
  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [openMentorDialog, setOpenMentorDialog] = useState(false);
  const [predefinedPlans, setPredefinedPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [availableMentors, setAvailableMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);

  useEffect(() => {
    const fetchPredefinedPlans = async () => {
      try {
        setError(null);
        const response = await api.get('/api/leadership/development-plan/predefined');
        console.log('Fetched predefined plans:', response.data);
        console.log('Sample plan structure:', response.data[0]);
        setPredefinedPlans(response.data);
      } catch (error) {
        console.error('Error fetching predefined plans:', error);
        setError('Failed to load predefined plans. Please try again.');
      }
    };

    if (openPlanDialog) {
      fetchPredefinedPlans();
    }
  }, [openPlanDialog]);

  const getActiveStep = () => {
    if (!plan) return 0;
    return levelSteps.indexOf(plan.currentLevel);
  };

  const calculateOverallProgress = (plan: IDevelopmentPlan) => {
    if (!plan || !plan.progress || !plan.targetCompetencies) return 0;
    
    const completedCompetencies = plan.progress.filter(
      p => p.status === 'completed'
    ).length;
    
    if (!plan.targetCompetencies.length) return 0;
    return (completedCompetencies / plan.targetCompetencies.length) * 100;
  };

  const handlePlanSelection = async (selectedPlan) => {
    try {
      const response = await api.post('/api/leadership/development-plan/assign', {
        planId: selectedPlan._id,
      });

      if (response.status === 201) {
        setOpenPlanDialog(false);
        // Open mentor dialog after successful plan creation
        setOpenMentorDialog(true);
        
        // Fetch available mentors
        try {
          const mentorsResponse = await api.get('/api/users', {
            params: { position: ['Leader', 'Director'] }
          });
          setAvailableMentors(mentorsResponse.data);
        } catch (error) {
          console.error('Error fetching mentors:', error);
        }
      }
    } catch (error) {
      console.error('Error assigning development plan:', error);
      setError('Failed to create development plan. Please try again.');
    }
  };

  const handleMentorAssignment = async () => {
    if (!selectedMentor) return;

    try {
      await api.post('/api/leadership/mentorship/assign', {
        mentorId: selectedMentor._id,
      });
      setOpenMentorDialog(false);
      window.location.reload(); // Refresh to show updated plan with mentor
    } catch (error) {
      console.error('Error assigning mentor:', error);
      setError('Failed to assign mentor. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <StyledCard>
        <Typography variant="h5" gutterBottom color="#000000">
          Leadership Development Plan
        </Typography>

        {plan ? (
          <>
            <Stepper
              activeStep={levelSteps.indexOf(plan.currentLevel)}
              alternativeLabel
              sx={{
                mt: 3,
                '& .MuiStepLabel-root .Mui-completed': {
                  color: '#E51636',
                },
                '& .MuiStepLabel-root .Mui-active': {
                  color: '#E51636',
                },
              }}
            >
              {levelSteps.map((level) => (
                <Step key={level}>
                  <StepLabel>{level}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <ProgressSection>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <Typography variant="body1" color="textSecondary">
                    Overall Progress
                  </Typography>
                </Grid>
                <Grid item xs={12} sm="auto">
                  <Typography variant="h6" color="#E51636">
                    {Math.round(calculateOverallProgress(plan))}%
                  </Typography>
                </Grid>
              </Grid>
              <LinearProgress
                variant="determinate"
                value={calculateOverallProgress(plan)}
                sx={{
                  mt: 1,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#E51636',
                  },
                }}
              />
            </ProgressSection>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              You don't have an active development plan yet. Please speak with your leader to get started with your leadership development journey.
            </Typography>
          </Box>
        )}
      </StyledCard>

      <Dialog
        open={openPlanDialog}
        onClose={() => setOpenPlanDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" component="div" gutterBottom>
            Select Development Plan
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Choose a development track that aligns with your leadership goals
          </Typography>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {!error && (
            <Box sx={{ mt: 2 }}>
              {predefinedPlans.map((plan) => (
                <StyledPlanCard
                  key={plan._id}
                  className={selectedPlan?._id === plan._id ? 'selected' : ''}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="h6" color="#000000" gutterBottom>
                        {plan.name}
                      </Typography>
                      <Typography variant="body1" color="textSecondary" paragraph>
                        {plan.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Chip
                          label={`${plan.duration} months`}
                          size="small"
                          sx={{ backgroundColor: '#f5f5f5' }}
                        />
                        <Chip
                          label={`${plan.currentLevel} → ${plan.targetLevel}`}
                          size="small"
                          sx={{ backgroundColor: '#f5f5f5' }}
                        />
                      </Box>
                      <Typography variant="subtitle2" color="#E51636" gutterBottom>
                        Competencies:
                      </Typography>
                      <Box component="ul" sx={{ 
                        pl: 2,
                        m: 0,
                        '& li': {
                          color: 'text.secondary',
                          mb: 0.5
                        }
                      }}>
                        {plan.competencies?.map((comp) => (
                          <li key={comp.competencyId._id}>
                            {comp.competencyId.name}
                          </li>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </StyledPlanCard>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpenPlanDialog(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedPlan) {
                handlePlanSelection(selectedPlan);
              }
              setOpenPlanDialog(false);
            }}
            variant="contained"
            disabled={!selectedPlan}
            sx={{
              backgroundColor: '#E51636',
              '&:hover': {
                backgroundColor: '#DD0031',
              },
              '&.Mui-disabled': {
                backgroundColor: '#f5f5f5',
              }
            }}
          >
            Start Plan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mentor Assignment Dialog */}
      <Dialog
        open={openMentorDialog}
        onClose={() => setOpenMentorDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" component="div" gutterBottom>
            Assign a Mentor
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Select a mentor to guide you through your leadership development journey
          </Typography>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <List sx={{ mt: 2 }}>
            {availableMentors.map((mentor) => (
              <ListItem
                key={mentor._id}
                button
                selected={selectedMentor?._id === mentor._id}
                onClick={() => setSelectedMentor(mentor)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'red.50',
                    '&:hover': {
                      backgroundColor: 'red.100',
                    },
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    {mentor.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={mentor.name}
                  secondary={mentor.position}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setOpenMentorDialog(false);
              window.location.reload();
            }}
            sx={{ color: 'text.secondary' }}
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleMentorAssignment}
            variant="contained"
            disabled={!selectedMentor}
            sx={{
              backgroundColor: '#E51636',
              '&:hover': {
                backgroundColor: '#DD0031',
              },
              '&.Mui-disabled': {
                backgroundColor: '#f5f5f5',
              }
            }}
          >
            Assign Mentor
          </Button>
        </DialogActions>
      </Dialog>

      {plan && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
            Current Level Competencies
          </Typography>
          
          {competencies
            .filter(comp => comp.level === plan.currentLevel)
            .map((competency) => (
              <CompetencyTracker
                key={competency._id}
                competency={competency}
                onMilestoneComplete={onUpdateProgress}
              />
            ))}

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Next Level Competencies
          </Typography>
          
          {competencies
            .filter(comp => comp.level === plan.targetLevel)
            .map((competency) => (
              <CompetencyTracker
                key={competency._id}
                competency={competency}
                onMilestoneComplete={onUpdateProgress}
              />
            ))}
        </>
      )}
    </Box>
  );
};

export default DevelopmentPlan; 