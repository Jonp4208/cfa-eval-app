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
          Department Progress
        </Typography>
        <Box sx={{ flex: 1 }}>
          {Object.entries(data).map(([department, { total, completed }]) => (
            <Box key={department} sx={{ mb: 3, '&:last-child': { mb: 0 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {department}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {Math.round((completed / total) * 100)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(completed / total) * 100}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'grey.100',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                  },
                }}
              />
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  display: 'block',
                  mt: 0.5 
                }}
              >
                {completed} of {total} completed
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DepartmentProgress; 