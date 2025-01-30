import React from 'react';
import { Card, CardContent, Typography, LinearProgress, Box } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  color?: string;
  progress?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color, progress }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" color={color}>
          {title}
        </Typography>
        <Typography variant="h5">{value}</Typography>
        {progress !== undefined && (
          <Box mt={2}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" color="textSecondary" mt={1}>
              {Math.round(progress)}% Complete
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard; 