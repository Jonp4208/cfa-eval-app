import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineContent,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector
} from '@mui/lab';
import {
  CheckCircle as PassIcon,
  Warning as WarningIcon,
  Error as FailIcon,
  Visibility as ViewIcon,
  CalendarMonth,
  TrendingUp,
  Download
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { kitchenService } from '@/services/kitchenService';
import { FoodSafetyChecklist, FoodSafetyChecklistCompletion } from '@/types/kitchen';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateChecklistPDF } from '@/utils/ChecklistPdfExport';

const History: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<FoodSafetyChecklist | null>(null);
  const [completions, setCompletions] = useState<FoodSafetyChecklistCompletion[]>([]);
  const [selectedCompletion, setSelectedCompletion] = useState<FoodSafetyChecklistCompletion | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      if (!id) return;
      const [checklistData, completionsData] = await Promise.all([
        kitchenService.getChecklist(id),
        kitchenService.getChecklistCompletions(id)
      ]);
      setChecklist(checklistData);
      setCompletions(completionsData);
      setLoading(false);
    } catch (error) {
      enqueueSnackbar('Failed to load data', { variant: 'error' });
      navigate('/kitchen/food-safety');
    }
  };

  const handleReviewSubmit = async () => {
    try {
      if (!selectedCompletion?._id) return;
      await kitchenService.reviewCompletion(selectedCompletion._id, { notes: reviewNotes });
      enqueueSnackbar('Review submitted successfully', { variant: 'success' });
      setReviewDialogOpen(false);
      loadData();
    } catch (error) {
      enqueueSnackbar('Failed to submit review', { variant: 'error' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'success';
      case 'warning':
        return 'warning';
      case 'fail':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <PassIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'fail':
        return <FailIcon color="error" />;
      default:
        return null;
    }
  };

  const getChartData = () => {
    return completions.map(completion => ({
      date: format(new Date(completion.completedAt), 'MM/dd'),
      score: completion.score
    })).reverse();
  };

  const handleExportPDF = async (completion: FoodSafetyChecklistCompletion) => {
    try {
      const pdfBlob = await generateChecklistPDF(completion);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Checklist_${checklist?.name}_${format(new Date(completion.completedAt), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      enqueueSnackbar('Failed to generate PDF', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!checklist) return null;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#333' }}>
          {checklist.name}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
          History & Analytics
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Analytics Cards */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 3, 
            height: '100%',
            background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#333' }}>
              Recent Performance
            </Typography>
            <Box sx={{ height: 200, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis domain={[0, 100]} stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#E4002B"
                    strokeWidth={2}
                    dot={{ fill: '#E4002B' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 3,
            height: '100%',
            background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#333' }}>
              Statistics
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Average Score
                </Typography>
                <Typography variant="h4" sx={{ color: '#E4002B', fontWeight: 600 }}>
                  {Math.round(
                    completions.reduce((acc, curr) => acc + curr.score, 0) / completions.length
                  )}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Pass Rate
                </Typography>
                <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                  {Math.round(
                    (completions.filter(c => c.overallStatus === 'pass').length / completions.length) * 100
                  )}%
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 3,
            height: '100%',
            background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#333' }}>
              Critical Items
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Critical Failures (Last 30 Days)
              </Typography>
              <Typography variant="h4" sx={{ color: '#F44336', fontWeight: 600 }}>
                {completions.filter(c => 
                  c.overallStatus === 'fail' && 
                  new Date(c.completedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                ).length}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Completion History */}
        <Grid item xs={12}>
          <Paper sx={{ 
            background: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Completed By</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Score</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Review Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {completions.map((completion) => (
                    <TableRow 
                      key={completion._id}
                      sx={{ '&:hover': { backgroundColor: '#f8f9fa' } }}
                    >
                      <TableCell>
                        {format(new Date(completion.completedAt), 'MM/dd/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{completion.completedBy}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{completion.score}%</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(completion.overallStatus)}
                          label={completion.overallStatus.toUpperCase()}
                          color={getStatusColor(completion.overallStatus) as any}
                          size="small"
                          sx={{ 
                            fontWeight: 500,
                            '& .MuiChip-icon': { fontSize: 16 }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {completion.reviewedBy ? (
                          <Chip
                            label="Reviewed"
                            color="success"
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        ) : checklist.requiresReview ? (
                          <Chip
                            label="Review Required"
                            color="warning"
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        ) : (
                          <Chip
                            label="No Review Required"
                            color="default"
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedCompletion(completion);
                              setViewDialogOpen(true);
                            }}
                            sx={{ 
                              color: 'primary.main',
                              '&:hover': { backgroundColor: 'primary.lighter' }
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleExportPDF(completion)}
                            sx={{ 
                              color: 'secondary.main',
                              '&:hover': { backgroundColor: 'secondary.lighter' }
                            }}
                          >
                            <Download />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* View Completion Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Completion Details
          <Typography variant="subtitle2" color="textSecondary">
            {selectedCompletion && format(new Date(selectedCompletion.completedAt), 'MM/dd/yyyy HH:mm')}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedCompletion && (
            <>
              <Box sx={{ mb: 3 }}>
                <Chip
                  icon={getStatusIcon(selectedCompletion.overallStatus)}
                  label={`${selectedCompletion.score}% - ${selectedCompletion.overallStatus.toUpperCase()}`}
                  color={getStatusColor(selectedCompletion.overallStatus) as any}
                />
              </Box>

              {selectedCompletion.items.map((item) => (
                <Paper key={item.item} sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1">
                      {checklist.items.find(i => i._id === item.item)?.name}
                    </Typography>
                    <Chip
                      label={item.status.toUpperCase()}
                      color={getStatusColor(item.status) as any}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Value: {item.value.toString()}
                  </Typography>
                  {item.notes && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Notes: {item.notes}
                    </Typography>
                  )}
                </Paper>
              ))}

              {selectedCompletion.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Overall Notes:</Typography>
                  <Typography variant="body2">{selectedCompletion.notes}</Typography>
                </Box>
              )}

              {selectedCompletion.reviewedBy && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2">Review Notes:</Typography>
                  <Typography variant="body2">{selectedCompletion.reviewNotes}</Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {checklist.requiresReview && !selectedCompletion?.reviewedBy && (
            <Button
              color="primary"
              onClick={() => {
                setViewDialogOpen(false);
                setReviewDialogOpen(true);
              }}
            >
              Review
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Review Completion</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Review Notes"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button
            color="primary"
            onClick={handleReviewSubmit}
            disabled={!reviewNotes.trim()}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default History; 