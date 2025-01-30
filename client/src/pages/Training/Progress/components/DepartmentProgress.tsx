import React from 'react';
import { Card, CardContent, Typography, LinearProgress, Box } from '@mui/material';

interface DepartmentProgressProps {
  data: {
    [key: string]: {
      total: number;
      completed: number;
    };
  };
}

const DepartmentProgress: React.FC<DepartmentProgressProps> = ({ data }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Department Progress
        </Typography>
        {Object.entries(data).map(([department, { total, completed }]) => (
          <Box key={department} mt={2}>
            <Typography variant="subtitle1">{department}</Typography>
            <LinearProgress variant="determinate" value={(completed / total) * 100} />
            <Typography variant="caption" color="textSecondary" mt={1}>
              {completed} of {total} completed
            </Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

export default DepartmentProgress; 