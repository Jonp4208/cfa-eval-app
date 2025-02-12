import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  Chip,
  IconButton,
  Link,
  Tabs,
  Tab,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  TextField,
  Stack,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import BookIcon from '@mui/icons-material/Book';
import ArticleIcon from '@mui/icons-material/Article';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import AssignmentIcon from '@mui/icons-material/Assignment';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import CategoryIcon from '@mui/icons-material/Category';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { Resource } from '../types/leadership';
import api from '@/lib/axios';
import { toast } from '@/components/ui/use-toast';

interface ResourceLibraryProps {
  resources: Resource[];
  onResourceSelect?: (resource: Resource) => void;
}

interface BookProgress {
  currentChapter: number;
  totalChapters: number;
  status: 'not_started' | 'in_progress' | 'completed';
  dailyLogs: Array<{
    date: Date;
    pagesRead: number;
    observations: string;
    reflection: string;
  }>;
  weeklyAssessments: Array<{
    weekNumber: number;
    keyLearnings: string;
    applicationExamples: string[];
    improvementAreas: string;
    nextWeekGoals: string;
  }>;
}

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)',
    transition: 'all 0.3s ease-in-out',
  },
}));

const ResourceIcon = styled(Box)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#E51636',
  color: '#ffffff',
  marginBottom: theme.spacing(2),
}));

const ResourceLibrary: React.FC<ResourceLibraryProps> = ({
  resources = [],
  onResourceSelect,
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [bookProgress, setBookProgress] = useState<BookProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [dailyLog, setDailyLog] = useState({
    pagesRead: '',
    observations: '',
    reflection: ''
  });
  const theme = useTheme();

  const fetchBookProgress = async (resourceId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/leadership/resources/${resourceId}/progress`);
      setBookProgress(response.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast({
          title: "Error",
          description: "Failed to load book progress",
          variant: "destructive",
        });
      }
      setBookProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'Book':
        return <BookIcon />;
      case 'Article':
        return <ArticleIcon />;
      case 'Video':
        return <VideoLibraryIcon />;
      case 'Exercise':
        return <AssignmentIcon />;
      default:
        return <ArticleIcon />;
    }
  };

  const filterResources = (source: 'Miller' | 'CFA') => {
    return resources.filter(resource => resource.source === source);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleLearnMoreClick = async (resource: Resource) => {
    setSelectedResource(resource);
    if (resource.type === 'Book') {
      await fetchBookProgress(resource._id);
    }
  };

  const handleCloseDialog = () => {
    setSelectedResource(null);
    setBookProgress(null);
    setDailyLog({
      pagesRead: '',
      observations: '',
      reflection: ''
    });
  };

  const handleUpdateProgress = async () => {
    if (!selectedResource) return;

    try {
      const payload = {
        ...dailyLog,
        pagesRead: parseInt(dailyLog.pagesRead)
      };

      await api.post(`/api/leadership/resources/${selectedResource._id}/progress`, payload);
      
      toast({
        title: "Success",
        description: "Progress updated successfully",
      });
      
      await fetchBookProgress(selectedResource._id);
      
      setDailyLog({
        pagesRead: '',
        observations: '',
        reflection: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    }
  };

  const calculateProgress = (progress: BookProgress | null) => {
    if (!progress) return 0;
    return (progress.currentChapter / progress.totalChapters) * 100;
  };

  const renderResourceCard = (resource: Resource) => (
    <Grid item xs={12} sm={6} md={4} key={resource._id}>
      <StyledCard>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <ResourceIcon>
            {getResourceIcon(resource.type)}
          </ResourceIcon>
          <Box sx={{ ml: 2, flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              {resource.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={resource.type}
                size="small"
                sx={{ backgroundColor: '#f5f5f5' }}
              />
              {resource.requiredFor && resource.requiredFor.length > 0 && (
                <Chip
                  label={`Required for ${resource.requiredFor.join(', ')}`}
                  size="small"
                  sx={{ backgroundColor: '#f5f5f5' }}
                />
              )}
            </Box>
          </Box>
          {resource.url && (
            <IconButton
              size="small"
              onClick={() => window.open(resource.url, '_blank')}
            >
              <OpenInNewIcon />
            </IconButton>
          )}
        </Box>
        
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ mb: 2, flex: 1 }}
        >
          {resource.description}
        </Typography>

        {resource.estimatedTimeMinutes && (
          <Typography variant="caption" color="textSecondary" sx={{ mb: 1 }}>
            Estimated time: {Math.round(resource.estimatedTimeMinutes / 60)} hours
          </Typography>
        )}

        <Box sx={{ mt: 'auto' }}>
          <Link
            component="button"
            variant="body2"
            onClick={() => handleLearnMoreClick(resource)}
            sx={{ color: '#E51636' }}
          >
            Learn More
          </Link>
        </Box>
      </StyledCard>
    </Grid>
  );

  return (
    <Box>
      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        sx={{
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
        <Tab label="Mark Miller Resources" />
        <Tab label="Chick-fil-A Resources" />
      </Tabs>

      <Grid container spacing={3}>
        {(selectedTab === 0
          ? filterResources('Miller')
          : filterResources('CFA')
        ).map(renderResourceCard)}
      </Grid>

      <Dialog
        open={!!selectedResource}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedResource && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ResourceIcon>
                  {getResourceIcon(selectedResource.type)}
                </ResourceIcon>
                <Box>
                  <Typography variant="h6">
                    {selectedResource.title}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    {selectedResource.type}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CategoryIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Source"
                        secondary={selectedResource.source}
                      />
                    </ListItem>
                    
                    {selectedResource.estimatedTimeMinutes && (
                      <ListItem>
                        <ListItemIcon>
                          <AccessTimeIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Estimated Time"
                          secondary={`${Math.round(selectedResource.estimatedTimeMinutes / 60)} hours`}
                        />
                      </ListItem>
                    )}

                    {selectedResource.requiredFor && selectedResource.requiredFor.length > 0 && (
                      <ListItem>
                        <ListItemIcon>
                          <GroupIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Required For"
                          secondary={selectedResource.requiredFor.join(', ')}
                        />
                      </ListItem>
                    )}
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedResource.description}
                  </Typography>

                  {selectedResource.content && (
                    <>
                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                        Content Overview
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {selectedResource.content}
                      </Typography>
                    </>
                  )}

                  {selectedResource.type === 'Book' && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle1" gutterBottom>
                        Reading Progress
                      </Typography>
                      
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {bookProgress ? `Chapter ${bookProgress.currentChapter} of ${bookProgress.totalChapters}` : 'Not started'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {Math.round(calculateProgress(bookProgress))}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={calculateProgress(bookProgress)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#E51636',
                            },
                          }}
                        />
                      </Box>

                      <Typography variant="subtitle1" gutterBottom>
                        Daily Reading Log
                      </Typography>
                      
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        <TextField
                          label="Pages Read"
                          type="number"
                          value={dailyLog.pagesRead}
                          onChange={(e) => setDailyLog(prev => ({ ...prev, pagesRead: e.target.value }))}
                          fullWidth
                        />
                        <TextField
                          label="Observations"
                          multiline
                          rows={2}
                          value={dailyLog.observations}
                          onChange={(e) => setDailyLog(prev => ({ ...prev, observations: e.target.value }))}
                          fullWidth
                        />
                        <TextField
                          label="Reflection"
                          multiline
                          rows={2}
                          value={dailyLog.reflection}
                          onChange={(e) => setDailyLog(prev => ({ ...prev, reflection: e.target.value }))}
                          fullWidth
                        />
                        <Button
                          variant="contained"
                          onClick={handleUpdateProgress}
                          disabled={!dailyLog.pagesRead}
                          sx={{
                            backgroundColor: '#E51636',
                            '&:hover': {
                              backgroundColor: '#DD0031',
                            },
                          }}
                        >
                          Update Progress
                        </Button>
                      </Stack>
                    </>
                  )}

                  {selectedResource.url && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => window.open(selectedResource.url, '_blank')}
                        sx={{
                          backgroundColor: '#E51636',
                          '&:hover': {
                            backgroundColor: '#DD0031',
                          },
                        }}
                      >
                        Access Resource
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ResourceLibrary; 