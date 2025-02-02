import React from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Box } from '@mui/material';
import { Employee } from '../../../../types';
import { CalendarClock } from 'lucide-react';

interface UpcomingTrainingsProps {
  data: Employee[];
  onEmployeeClick: (employeeId: string) => void;
}

const UpcomingTrainings: React.FC<UpcomingTrainingsProps> = ({ data, onEmployeeClick }) => {
  return (
    <Card sx={{ 
      height: '100%', 
      boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3,
            fontWeight: 500,
            color: 'text.primary'
          }}
        >
          Upcoming Trainings
        </Typography>
        {data.length === 0 ? (
          <Box 
            sx={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 4,
              color: 'text.secondary'
            }}
          >
            <CalendarClock size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
            <Typography variant="body2">No upcoming trainings scheduled</Typography>
          </Box>
        ) : (
          <List sx={{ flex: 1, px: 0 }}>
            {data.map((employee) => (
              <ListItem 
                key={employee.id} 
                onClick={() => onEmployeeClick(employee.id)}
                sx={{
                  px: 0,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'transparent',
                    '& .MuiTypography-root': {
                      color: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 500,
                        transition: 'color 0.2s'
                      }}
                    >
                      {employee.name}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        component="div"
                      >
                        {employee.trainingPlan?.name}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        component="div"
                      >
                        Starts {new Date(employee.trainingPlan!.startDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingTrainings; 