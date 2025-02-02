import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  IconButton,
  Grid,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  alpha,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { Employee } from '../../../../types';
import { TrainingPlan, TraineeProgress } from '../../../../types/training';
import { SimplifiedTrainingPlan, EmployeeWithProgress } from '../types';

interface TrainingCalendarProps {
  employees: EmployeeWithProgress[];
  plans: SimplifiedTrainingPlan[];
}

interface CalendarEvent {
  type: 'start' | 'inProgress' | 'completion';
  employee: EmployeeWithProgress;
  trainingPlan: SimplifiedTrainingPlan;
  date: Date;
}

const TrainingCalendar: React.FC<TrainingCalendarProps> = ({ employees, plans }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);

  // Helper functions for date manipulation
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  // Navigation handlers
  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const events: CalendarEvent[] = [];

    employees.forEach(employee => {
      employee.trainingProgress.forEach(progress => {
        if (!progress.trainingPlan) return;

        const startDate = new Date(progress.trainingPlan.startDate);
        if (isSameDay(startDate, date)) {
          events.push({
            type: 'start',
            employee,
            trainingPlan: progress.trainingPlan,
            date: startDate,
          });
        }

        // Calculate expected completion date based on total duration
        const totalDuration = progress.trainingPlan.modules?.reduce(
          (acc, module) => acc + (parseInt(module.estimatedDuration) || 0),
          0
        ) || 0;
        const completionDate = new Date(startDate);
        completionDate.setDate(completionDate.getDate() + Math.ceil(totalDuration / (24 * 60))); // Convert minutes to days

        if (isSameDay(completionDate, date)) {
          events.push({
            type: 'completion',
            employee,
            trainingPlan: progress.trainingPlan,
            date: completionDate,
          });
        }

        // Check if date is within training period
        if (date > startDate && date < completionDate) {
          events.push({
            type: 'inProgress',
            employee,
            trainingPlan: progress.trainingPlan,
            date,
          });
        }
      });
    });

    return events;
  };

  // Calendar day click handler
  const handleDayClick = (date: Date) => {
    const events = getEventsForDate(date);
    setSelectedDate(date);
    setSelectedEvents(events);
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <Grid item xs={1.714285714} key={`empty-${i}`}>
          <Box
            sx={{
              p: 2,
              minHeight: 140,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.06)',
              opacity: 0.5
            }}
          />
        </Grid>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const events = getEventsForDate(date);
      const isToday = isSameDay(date, new Date());

      days.push(
        <Grid item xs={1.714285714} key={day}>
          <Box
            onClick={() => handleDayClick(date)}
            sx={{
              p: 2,
              minHeight: 140,
              bgcolor: 'background.paper',
              borderRadius: 1,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.06)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.01)',
              },
            }}
          >
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 500,
                  color: 'text.primary',
                  fontSize: '1.5rem'
                }}
              >
                {day}
              </Typography>
            </Box>
            
            {events.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {events.map((event, index) => (
                  <Box
                    key={index}
                    sx={{
                      height: 3,
                      borderRadius: 3,
                      mb: 1,
                      bgcolor: event.type === 'start' 
                        ? '#2196F3' // Work - Blue
                        : event.type === 'completion'
                        ? '#9C27B0' // Family - Purple
                        : '#00BCD4', // Other - Cyan
                      width: '80%'
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Grid>
      );
    }

    // Add empty cells for days after the last day of the month
    const totalDays = firstDay + daysInMonth;
    const remainingDays = 7 - (totalDays % 7);
    if (remainingDays < 7) {
      for (let i = 0; i < remainingDays; i++) {
        days.push(
          <Grid item xs={1.714285714} key={`empty-end-${i}`}>
            <Box
              sx={{
                p: 2,
                minHeight: 140,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'rgba(0, 0, 0, 0.06)',
                opacity: 0.5
              }}
            />
          </Grid>
        );
      }
    }

    return days;
  };

  // Add new function for mobile calendar days
  const generateMobileCalendarDays = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentDate);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const events = getEventsForDate(date);
      const isToday = isSameDay(date, new Date());
      const dayName = date.toLocaleString('default', { weekday: 'short' }).toUpperCase();

      days.push(
        <Grid item xs={12} key={day}>
          <Box
            onClick={() => handleDayClick(date)}
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.06)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.01)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 500,
                  color: 'text.primary',
                  fontSize: '1.5rem',
                  mr: 2
                }}
              >
                {day}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  letterSpacing: 0.5,
                  fontSize: '0.75rem'
                }}
              >
                {dayName}
              </Typography>
            </Box>
            
            {events.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {events.map((event, index) => (
                  <Box
                    key={index}
                    sx={{
                      height: 3,
                      borderRadius: 3,
                      mb: 1,
                      bgcolor: event.type === 'start' 
                        ? '#2196F3' // Work - Blue
                        : event.type === 'completion'
                        ? '#9C27B0' // Family - Purple
                        : '#00BCD4', // Other - Cyan
                      width: '80%'
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Grid>
      );
    }

    return days;
  };

  return (
    <Box>
      {/* Calendar Grid */}
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
        {/* Month and weekday headers */}
        <Box sx={{ px: 2, pt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
                letterSpacing: 0.5,
                fontSize: '1rem',
                textTransform: 'uppercase'
              }}
            >
              {currentDate.toLocaleString('default', { month: 'long' })}
            </Typography>
          </Box>
          
          {/* Hide weekday header on mobile */}
          <Box sx={{ display: { xs: 'none', sm: 'block' }, width: '100%' }}>
            <Grid container>
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                <Grid item xs={1.714285714} key={day}>
                  <Typography 
                    variant="body2" 
                    align="left"
                    sx={{ 
                      color: 'text.secondary',
                      fontWeight: 500,
                      letterSpacing: 0.5,
                      fontSize: '0.75rem'
                    }}
                  >
                    {day}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        {/* Desktop Calendar View */}
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Grid container sx={{ p: 2 }}>
            {generateCalendarDays()}
          </Grid>
        </Box>

        {/* Mobile Calendar View */}
        <Box sx={{ display: { xs: 'block', sm: 'none' }, p: 2 }}>
          <Grid container spacing={2}>
            {generateMobileCalendarDays()}
          </Grid>
        </Box>
      </Box>

      {/* Event Details Dialog */}
      <Dialog
        open={Boolean(selectedDate && selectedEvents.length > 0)}
        onClose={() => {
          setSelectedDate(null);
          setSelectedEvents([]);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)'
          }
        }}
      >
        <DialogTitle sx={{ 
          p: 3,
          color: '#27251F',
          borderBottom: '1px solid',
          borderColor: 'rgba(39, 37, 31, 0.1)'
        }}>
          {selectedDate?.toLocaleDateString('default', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <List>
            {selectedEvents.map((event, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {event.type === 'start' ? (
                    <EventIcon sx={{ color: '#2196F3' }} />
                  ) : event.type === 'completion' ? (
                    <AssignmentIcon sx={{ color: '#9C27B0' }} />
                  ) : (
                    <PersonIcon sx={{ color: '#00BCD4' }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {event.employee.name}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {event.trainingPlan.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {event.type === 'start' ? 'Training Start' :
                         event.type === 'completion' ? 'Expected Completion' :
                         'In Progress'}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TrainingCalendar; 