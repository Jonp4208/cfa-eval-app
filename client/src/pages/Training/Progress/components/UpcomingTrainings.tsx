import React from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText } from '@mui/material';
import { Employee } from '../../../../types';

interface UpcomingTrainingsProps {
  data: Employee[];
  onEmployeeClick: (employeeId: string) => void;
}

const UpcomingTrainings: React.FC<UpcomingTrainingsProps> = ({ data, onEmployeeClick }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Upcoming Trainings
        </Typography>
        <List>
          {data.map((employee) => (
            <ListItem key={employee.id} button onClick={() => onEmployeeClick(employee.id)}>
              <ListItemText
                primary={`${employee.name} - ${employee.trainingPlan?.name}`}
                secondary={`Starts ${new Date(employee.trainingPlan!.startDate).toLocaleDateString()}`}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default UpcomingTrainings; 