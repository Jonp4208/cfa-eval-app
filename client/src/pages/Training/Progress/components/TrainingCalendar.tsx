import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { Employee, TrainingPlan } from '../../../../types';

interface TrainingCalendarProps {
  employees: Employee[];
  plans: TrainingPlan[];
}

interface CalendarEvent {
  type: 'start' | 'inProgress' | 'completion';
  employee: Employee;
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
      if (!employee.trainingPlan) return;

      const startDate = new Date(employee.trainingPlan.startDate);
      if (isSameDay(startDate, date)) {
        events.push({
          type: 'start',
          employee,
          date: startDate,
        });
      }

      // Calculate expected completion date based on total duration
      const totalDuration = employee.trainingPlan.modules.reduce(
        (acc, module) => acc + (module.estimatedDuration || 0),
        0
      );
      const completionDate = new Date(startDate);
      completionDate.setDate(completionDate.getDate() + totalDuration);

      if (isSameDay(completionDate, date)) {
        events.push({
          type: 'completion',
          employee,
          date: completionDate,
        });
      }

      // Check if date is within training period
      if (date > startDate && date < completionDate) {
        events.push({
          type: 'inProgress',
          employee,
          date,
        });
      }
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
      days.push(<Grid item xs key={`empty-${i}`} />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const events = getEventsForDate(date);
      const isToday = isSameDay(date, new Date());
      const isSelected = selectedDate && isSameDay(date, selectedDate);

      days.push(
        <Grid item xs key={day}>
          <Card
            sx={{
              height: '100px',
              cursor: 'pointer',
              bgcolor: isSelected ? 'primary.light' : isToday ? 'action.hover' : 'background.paper',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
            onClick={() => handleDayClick(date)}
          >
            <CardContent>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isToday ? 'bold' : 'normal',
                  color: isSelected ? 'primary.contrastText' : 'text.primary',
                }}
              >
                {day}
              </Typography>
              {events.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {events.slice(0, 2).map((event, index) => (
                    <Tooltip
                      key={index}
                      title={`${event.employee.name} - ${event.type === 'start' ? 'Starts' : event.type === 'completion' ? 'Completes' : 'In Progress'}`}
                    >
                      <Chip
                        size="small"
                        label={event.employee.name.split(' ')[0]}
                        color={
                          event.type === 'start'
                            ? 'primary'
                            : event.type === 'completion'
                            ? 'success'
                            : 'warning'
                        }
                        sx={{ mb: 0.5 }}
                      />
                    </Tooltip>
                  ))}
                  {events.length > 2 && (
                    <Typography variant="caption" color="text.secondary">
                      +{events.length - 2} more
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      );
    }

    return days;
  };

  return (
    <Box>
      {/* Calendar Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handlePreviousMonth}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flex: 1, textAlign: 'center' }}>
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Typography>
        <IconButton onClick={handleNextMonth}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Calendar Grid */}
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={1}>
          {/* Weekday headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Grid item xs key={day}>
              <Typography variant="subtitle2" align="center">
                {day}
              </Typography>
            </Grid>
          ))}
          {generateCalendarDays()}
        </Grid>
      </Paper>

      {/* Event Details Dialog */}
      <Dialog
        open={Boolean(selectedDate && selectedEvents.length > 0)}
        onClose={() => {
          setSelectedDate(null);
          setSelectedEvents([]);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedDate?.toLocaleDateString('default', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </DialogTitle>
        <DialogContent>
          <List>
            {selectedEvents.map((event, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {event.type === 'start' ? (
                    <EventIcon color="primary" />
                  ) : event.type === 'completion' ? (
                    <AssignmentIcon color="success" />
                  ) : (
                    <PersonIcon color="warning" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={`${event.employee.name} - ${event.employee.trainingPlan?.name}`}
                  secondary={
                    event.type === 'start'
                      ? 'Training Starts'
                      : event.type === 'completion'
                      ? 'Expected Completion'
                      : 'Training in Progress'
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