import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Typography, Tab, Tabs, Paper, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, ListItemAvatar, Avatar, CircularProgress, Chip, Card, CardContent, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { styled } from '@mui/material/styles';
import DevelopmentPlan from './components/DevelopmentPlan';
import ResourceLibrary from './components/ResourceLibrary';
import DevelopmentDashboard from './components/DevelopmentDashboard';
import { DevelopmentPlan as IDevelopmentPlan, Resource, Competency } from './types/leadership';
import api from '@/lib/axios';
import { useNotification } from '@/contexts/NotificationContext';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { toast } from '@/components/ui/use-toast';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
}));

const PageTitle = styled(Typography)({
  color: '#000000',
  marginBottom: '24px',
  fontWeight: 600,
});

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  boxShadow: 'none',
  '&:before': {
    display: 'none',
  },
  '&.Mui-expanded': {
    margin: theme.spacing(2, 0),
  },
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  backgroundColor: '#f8f9fa',
  borderRadius: theme.shape.borderRadius,
  '&.Mui-expanded': {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`leadership-tabpanel-${index}`}
      aria-labelledby={`leadership-tab-${index}`}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

// Add these interfaces at the top with the other imports
interface AssignableUser {
  _id: string;
  name: string;
  email: string;
  position: string;
}

interface TemplatePlan {
  _id: string;
  name: string;
  description: string;
  currentLevel: string;
  targetLevel: string;
  duration: number;
  roleType: string;
  competencies?: { competencyId: Competency }[];
  customizations?: { notes: string };
}

const LeadershipDevelopment: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [developmentPlans, setDevelopmentPlans] = useState<IDevelopmentPlan[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsCreation, setNeedsCreation] = useState(false);
  const [isDirector, setIsDirector] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<AssignableUser[]>([]);
  const [templatePlans, setTemplatePlans] = useState<TemplatePlan[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplatePlan | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { showNotification } = useNotification();
  const mounted = React.useRef(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | false>(false);

  useEffect(() => {
    mounted.current = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [compRes, resourceRes, userRes, templatesRes] = await Promise.all([
          api.get('/api/leadership/competencies'),
          api.get('/api/leadership/resources'),
          api.get('/api/users/current'),
          api.get('/api/leadership/templates')
        ]);

        if (!mounted.current) return;

        setCompetencies(compRes.data);
        setResources(resourceRes.data);
        setCurrentUser(userRes.data);
        setIsDirector(userRes.data.position === 'Director');

        // Fetch the user's development plans
        try {
          const planRes = await api.get('/api/leadership/development-plan');
          if (planRes.data && planRes.data.length > 0) {
            setDevelopmentPlans(planRes.data);
            setNeedsCreation(false);
          } else {
            setNeedsCreation(true);
          }
        } catch (error: any) {
          if (error.response?.status === 404) {
            setNeedsCreation(true);
          } else {
            console.error('Error fetching development plans:', error);
            toast({
              title: "Error",
              description: error.response?.data?.message || 'Failed to fetch development plans',
              variant: "destructive",
            });
          }
        }

        // Only set template plans if user is Director/Leader
        if (['Director', 'Leader'].includes(userRes.data.position)) {
          setTemplatePlans(templatesRes.data);
        }
      } catch (error: any) {
        console.error('Error fetching leadership data:', error);
        toast({
          title: "Error",
          description: error.response?.data?.message || 'Failed to fetch leadership data',
          variant: "destructive",
        });
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted.current = false;
    };
  }, [showNotification]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleMilestoneComplete = async (competencyId: string, milestoneId: string) => {
    try {
      const response = await api.put('/api/leadership/progress', {
        competencyId,
        milestoneId,
        status: 'completed'
      });

      if (response.status === 200) {
        setDevelopmentPlans(prev => prev.map(plan =>
          plan._id === response.data._id ? response.data : plan
        ));
        showNotification({
          type: 'success',
          message: 'Progress updated successfully'
        });
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
      showNotification({
        type: 'error',
        message: 'Failed to update progress. Please try again.'
      });
    }
  };

  const handleResourceSelect = (resource: Resource) => {
    console.log('Selected resource:', resource);
    // Implement resource selection logic
  };

  const handleOpenUserDialog = async () => {
    try {
      console.log('Fetching assignable users...');
      const usersRes = await api.get('/api/leadership/assignable-users');
      console.log('Fetched users:', usersRes.data);
      setAssignableUsers(usersRes.data);
      setUserDialogOpen(true);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      showNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to load users. Please try again.'
      });
    }
  };

  const handleUserSelect = (user: AssignableUser) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleNext = async () => {
    if (selectedUsers.length === 0) {
      showNotification({
        type: 'error',
        message: 'Please select at least one team member'
      });
      return;
    }

    try {
      console.log('Fetching templates...');
      const templatesRes = await api.get('/api/leadership/templates');
      console.log('Fetched templates:', templatesRes.data);
      setTemplatePlans(templatesRes.data);
      setUserDialogOpen(false);
      setTemplateDialogOpen(true);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      showNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to load templates. Please try again.'
      });
    }
  };

  const handleTemplateSelect = async (template: TemplatePlan) => {
    console.log('Selected template:', template);
    setSelectedTemplate(template);
    try {
      setAssignLoading(true);
      
      // Assign plan to each selected user
      for (const user of selectedUsers) {
        try {
          await api.post('/api/leadership/assign', {
            planId: template._id,
            targetUserId: user._id,
            customizations: {
              notes: `Assigned by ${currentUser?.name || 'Director'} on ${new Date().toLocaleDateString()}`
            }
          });
        } catch (error: any) {
          // Extract the error message from the response
          const errorMessage = error.response?.data?.message || 'Failed to assign development plan';
          toast({
            title: "Error",
            description: `Failed to assign plan to ${user.name}: ${errorMessage}`,
            variant: "destructive",
          });
          continue; // Continue with next user even if one fails
        }
      }

      // Only show success message and reset if at least one assignment succeeded
      toast({
        title: "Success",
        description: `Development plan "${template.name}" successfully assigned to ${selectedUsers.length} team member${selectedUsers.length > 1 ? 's' : ''}`
      });

      // Reset state
      setSelectedUsers([]);
      setSelectedTemplate(null);
      setTemplateDialogOpen(false);

    } catch (error: any) {
      console.error('Error assigning plan:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || 'Failed to assign development plan',
        variant: "destructive",
      });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAccordionChange = (planId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPlan(isExpanded ? planId : false);
  };

  const renderPlanOverview = () => {
    // If user is not a Leader/Director, show appropriate message
    if (!['Leader', 'Director'].includes(currentUser?.position)) {
      return (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Development Plan Templates
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Development plan templates are only visible to Leaders and Directors. Please speak with your leader to learn more about available development plans.
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Available Development Plans
        </Typography>
        
        {templatePlans.map((plan) => (
          <StyledAccordion
            key={plan._id}
            expanded={expandedPlan === plan._id}
            onChange={handleAccordionChange(plan._id)}
          >
            <StyledAccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${plan._id}-content`}
              id={`${plan._id}-header`}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Avatar sx={{ bgcolor: '#E51636' }}>
                  <SchoolIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">{plan.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {plan.currentLevel} → {plan.targetLevel} • {plan.duration} months
                  </Typography>
                </Box>
                <Chip
                  label={plan.roleType}
                  size="small"
                  sx={{ backgroundColor: '#f5f5f5' }}
                />
              </Box>
            </StyledAccordionSummary>
            <AccordionDetails>
              <Box sx={{ pl: 7 }}>
                <Typography variant="body1" paragraph>
                  {plan.description}
                </Typography>
                
                {plan.customizations?.notes && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      component="pre"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                        fontSize: '0.875rem',
                        color: 'text.secondary',
                        backgroundColor: '#f8f9fa',
                        p: 2,
                        borderRadius: 1,
                      }}
                    >
                      {plan.customizations.notes}
                    </Typography>
                  </Box>
                )}

                {plan.competencies && plan.competencies.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Required Competencies:
                    </Typography>
                    <List dense>
                      {plan.competencies.map((comp, index) => (
                        <ListItem key={comp.competencyId._id}>
                          <ListItemText
                            primary={comp.competencyId.name}
                            secondary={comp.competencyId.description}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </StyledAccordion>
        ))}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageTitle variant="h4">Leadership Development</PageTitle>
        {isDirector && (
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleOpenUserDialog}
            sx={{
              backgroundColor: '#E51636',
              '&:hover': {
                backgroundColor: '#DD0031',
              },
            }}
          >
            Assign Development Plan
          </Button>
        )}
      </Box>

      {needsCreation && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You don't have an active development plan yet. Please speak with your leader to get started with your leadership development journey.
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 3,
          '& .MuiTab-root': {
            color: '#000000',
          },
          '& .Mui-selected': {
            color: '#E51636 !important',
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#E51636',
          },
        }}
      >
        <Tab label="Development Plan" />
        <Tab label="Plan Overview" />
        <Tab label="Resources" />
        {isDirector && <Tab label="Dashboard" />}
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        {developmentPlans.length > 0 ? (
          developmentPlans.map((plan) => (
            <DevelopmentPlan
              key={plan._id}
              plan={plan}
              competencies={competencies}
              onUpdateProgress={handleMilestoneComplete}
              loading={loading}
            />
          ))
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            You don't have any active development plans yet. Please speak with your leader to get started with your leadership development journey.
          </Alert>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {renderPlanOverview()}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <ResourceLibrary
          resources={resources}
          onResourceSelect={handleResourceSelect}
        />
      </TabPanel>

      {isDirector && (
        <TabPanel value={activeTab} index={3}>
          <DevelopmentDashboard />
        </TabPanel>
      )}

      <Dialog 
        open={userDialogOpen} 
        onClose={() => {
          setUserDialogOpen(false);
          setSelectedUsers([]);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ mb: 1 }}>
            <Typography variant="h6">Select Team Members</Typography>
            {selectedUsers.length > 0 && (
              <Typography variant="subtitle2" color="textSecondary">
                {selectedUsers.length} member{selectedUsers.length > 1 ? 's' : ''} selected
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {assignableUsers.map((user: AssignableUser) => (
              <ListItem
                key={user._id}
                component="button"
                onClick={() => handleUserSelect(user)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  background: 'none',
                  padding: 2,
                  backgroundColor: selectedUsers.some(u => u._id === user._id) ? '#ffebee' : 'transparent',
                  '&:hover': {
                    backgroundColor: selectedUsers.some(u => u._id === user._id) ? '#ffcdd2' : '#fff5f5',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: selectedUsers.some(u => u._id === user._id) ? '#E51636' : '#9e9e9e' 
                  }}>
                    {user.name[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={user.name}
                  secondary={
                    <Typography variant="body2" color="textSecondary">
                      {user.position} • {user.email}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => {
              setUserDialogOpen(false);
              setSelectedUsers([]);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={selectedUsers.length === 0}
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
            Next
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={templateDialogOpen} 
        onClose={() => setTemplateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ mb: 1 }}>
            <Typography variant="h6">Select Development Plan</Typography>
            <Typography variant="subtitle2" color="textSecondary">
              Assigning to {selectedUsers.length} team member{selectedUsers.length > 1 ? 's' : ''}: {selectedUsers.map(u => u.name).join(', ')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {templatePlans.map((plan: TemplatePlan) => (
              <ListItem
                key={plan._id}
                component="button"
                onClick={() => handleTemplateSelect(plan)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  background: 'none',
                  padding: 2,
                  '&:hover': {
                    backgroundColor: '#fff5f5',
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" color="textPrimary">
                      {plan.name}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                        {plan.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip 
                          size="small" 
                          label={`${plan.currentLevel} → ${plan.targetLevel}`}
                          sx={{ backgroundColor: '#f5f5f5' }}
                        />
                        <Chip 
                          size="small" 
                          label={`${plan.duration} months`}
                          sx={{ backgroundColor: '#f5f5f5' }}
                        />
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => {
              setTemplateDialogOpen(false);
              setUserDialogOpen(true);
            }}
          >
            Back
          </Button>
          <Button 
            onClick={() => {
              setTemplateDialogOpen(false);
              setSelectedUsers([]);
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LeadershipDevelopment; 