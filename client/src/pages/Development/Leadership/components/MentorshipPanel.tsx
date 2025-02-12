import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Avatar,
  Grid,
  Button,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import { MentorshipRelation } from '../types/leadership';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  _id: string;
  name: string;
  position: string;
  email: string;
}

interface MentorshipPanelProps {
  mentorshipRelation?: MentorshipRelation;
  onAssignMentor?: () => void;
}

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: '#f8f8f8',
  marginTop: theme.spacing(2),
}));

const MentorAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: '#E51636',
  width: theme.spacing(7),
  height: theme.spacing(7),
}));

const MentorshipPanel: React.FC<MentorshipPanelProps> = ({
  mentorshipRelation,
  onAssignMentor,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mentees, setMentees] = useState<User[]>([]);
  const [availableMentors, setAvailableMentors] = useState<User[]>([]);
  const [availableMentees, setAvailableMentees] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogMode, setDialogMode] = useState<'assign_mentor' | 'assign_mentee'>('assign_mentor');
  const [mentorDetails, setMentorDetails] = useState<User | null>(null);

  const isLeaderOrHigher = user?.position === 'Leader' || user?.position === 'Director';

  useEffect(() => {
    const fetchMentorshipData = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        if (isLeaderOrHigher) {
          const menteesResponse = await api.get('/api/leadership/mentorship/mentees');
          setMentees(menteesResponse.data);
        }
      } catch (error) {
        console.error('Error fetching mentorship data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentorshipData();
  }, [isLeaderOrHigher, user?._id]);

  useEffect(() => {
    const fetchMentorDetails = async () => {
      if (mentorshipRelation?.mentorId) {
        try {
          const response = await api.get(`/api/users/${mentorshipRelation.mentorId}`);
          setMentorDetails(response.data);
        } catch (error) {
          console.error('Error fetching mentor details:', error);
        }
      }
    };

    fetchMentorDetails();
  }, [mentorshipRelation?.mentorId]);

  const handleOpenDialog = async (mode: 'assign_mentor' | 'assign_mentee') => {
    if (!user?._id) return;

    setDialogMode(mode);
    setOpenDialog(true);
    setError(null);
    setSelectedUser(null);

    try {
      setLoading(true);
      if (mode === 'assign_mentor') {
        const response = await api.get('/api/leadership/users', {
          params: { position: ['Leader', 'Director'] }
        });
        setAvailableMentors(response.data.users || []);
        setAvailableMentees([]);
      } else {
        const response = await api.get('/api/leadership/users', {
          params: { position: ['Team Member', 'Leader'] }
        });
        setAvailableMentees(response.data.users || []);
        setAvailableMentors([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load available users');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignment = async () => {
    if (!selectedUser || !user?._id) return;

    try {
      setLoading(true);
      if (dialogMode === 'assign_mentor') {
        await api.post('/api/leadership/mentorship/assign', {
          mentorId: selectedUser._id,
          menteeId: user._id
        });
      } else {
        await api.post('/api/leadership/mentorship/assign', {
          mentorId: user._id,
          menteeId: selectedUser._id
        });
      }
      setOpenDialog(false);
      window.location.reload();
    } catch (error) {
      console.error('Error assigning mentorship:', error);
      setError('Failed to assign mentorship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledCard>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': { color: '#000000' },
            '& .Mui-selected': { color: '#E51636 !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#E51636' },
          }}
        >
          <Tab label="My Mentor" />
          {isLeaderOrHigher && <Tab label="My Mentees" />}
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box>
          {mentorshipRelation && mentorDetails ? (
            <Box>
              <Grid container spacing={3} alignItems="center">
                <Grid item>
                  <MentorAvatar>
                    <PersonIcon sx={{ fontSize: 32 }} />
                  </MentorAvatar>
                </Grid>
                <Grid item xs>
                  <Typography variant="h6" color="#E51636">
                    Your Mentor
                  </Typography>
                  <Typography variant="body1">
                    {mentorDetails.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {mentorDetails.position}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Recent Notes
              </Typography>
              <List>
                {mentorshipRelation.notes.map((note, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>
                      <Avatar sx={{ backgroundColor: '#E51636' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={note}
                      secondary={new Date().toLocaleDateString()}
                    />
                  </ListItem>
                ))}
              </List>

              <StyledPaper>
                <Typography variant="subtitle1" gutterBottom>
                  Next Meeting
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Schedule your next mentorship session
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  sx={{ mt: 1 }}
                  onClick={() => {/* Handle scheduling */}}
                >
                  Schedule Meeting
                </Button>
              </StyledPaper>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="textSecondary" gutterBottom>
                You haven't been assigned a mentor yet
              </Typography>
              <Button
                variant="contained"
                sx={{
                  mt: 2,
                  backgroundColor: '#E51636',
                  '&:hover': {
                    backgroundColor: '#DD0031',
                  },
                }}
                onClick={() => handleOpenDialog('assign_mentor')}
              >
                Find a Mentor
              </Button>
            </Box>
          )}
        </Box>
      )}

      {activeTab === 1 && isLeaderOrHigher && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              My Mentees
            </Typography>
            <Tooltip title="Add Mentee">
              <IconButton 
                onClick={() => handleOpenDialog('assign_mentee')}
                sx={{ 
                  backgroundColor: '#E51636',
                  color: 'white',
                  '&:hover': { backgroundColor: '#DD0031' }
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {mentees.length > 0 ? (
            <List>
              {mentees.map((mentee) => (
                <ListItem
                  key={mentee._id}
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 2,
                    '&:last-child': { mb: 0 }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ backgroundColor: '#E51636' }}>
                      {mentee.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={mentee.name}
                    secondary={mentee.position}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {/* Handle viewing details */}}
                  >
                    View Progress
                  </Button>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="textSecondary">
                You don't have any mentees yet
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Assignment Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" component="div" gutterBottom>
            {dialogMode === 'assign_mentor' ? 'Select a Mentor' : 'Select a Mentee'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {dialogMode === 'assign_mentor' 
              ? 'Choose a mentor to guide your leadership development'
              : 'Select a team member to mentor'
            }
          </Typography>
        </DialogTitle>
        <DialogContent>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <List sx={{ mt: 2 }}>
            {(dialogMode === 'assign_mentor' ? availableMentors : availableMentees).map((user) => (
              <ListItem
                key={user._id}
                onClick={() => setSelectedUser(user)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  cursor: 'pointer',
                  backgroundColor: selectedUser?._id === user._id ? '#E51636' : 'transparent',
                  color: selectedUser?._id === user._id ? 'white' : 'inherit',
                  '& .MuiListItemText-primary': {
                    color: selectedUser?._id === user._id ? 'white' : 'inherit',
                    fontWeight: selectedUser?._id === user._id ? 700 : 400,
                  },
                  '& .MuiListItemText-secondary': {
                    color: selectedUser?._id === user._id ? 'rgba(255,255,255,0.8)' : 'inherit',
                  },
                  '&:hover': {
                    backgroundColor: selectedUser?._id === user._id ? '#DD0031' : 'rgba(229, 22, 54, 0.08)',
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ 
                    backgroundColor: selectedUser?._id === user._id ? 'white' : '#E51636',
                    color: selectedUser?._id === user._id ? '#E51636' : 'white',
                  }}>
                    {user.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.name}
                  secondary={user.position}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignment}
            variant="contained"
            disabled={!selectedUser || loading}
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
            {dialogMode === 'assign_mentor' ? 'Select Mentor' : 'Add Mentee'}
          </Button>
        </DialogActions>
      </Dialog>
    </StyledCard>
  );
};

export default MentorshipPanel; 