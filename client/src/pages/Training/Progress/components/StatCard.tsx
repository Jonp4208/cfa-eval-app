import React from 'react';
import { Card, CardContent, Typography, LinearProgress, Box } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  color?: string;
  progress?: number;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color, progress, icon }) => {
  return (
    <Card sx={{ height: '100%', boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon && (
            <Box 
              sx={{ 
                mr: 1,
                display: 'flex',
                alignItems: 'center',
                color: color || 'inherit'
              }}
            >
              {icon}
            </Box>
          )}
          <Typography 
            variant="subtitle1" 
            color={color} 
            sx={{ 
              fontWeight: 500
            }}
          >
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 500 }}>
          {value}
        </Typography>
        {progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{
                height: 4,
                bgcolor: '#E5E7EB',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#3B82F6',
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
              {Math.round(progress)}% Complete
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard; 