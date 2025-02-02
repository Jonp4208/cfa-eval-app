import React from 'react';
import { Box, Typography, Card } from '@mui/material';

interface StatCardProps {
  title: string;
  value: number | string;
  color: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color, icon }) => {
  return (
    <Card
      sx={{
        p: { xs: 2, sm: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: { xs: 2, sm: 3 },
        boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
        border: '1px solid',
        borderColor: 'rgba(39, 37, 31, 0.1)'
      }}
    >
      <Box
        sx={{
          width: { xs: 32, sm: 40 },
          height: { xs: 32, sm: 40 },
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${color}15`,
          color: color,
          mb: { xs: 1.5, sm: 2 },
          '& svg': {
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }
        }}
      >
        {icon}
      </Box>
      
      <Typography
        variant="h4"
        sx={{
          fontSize: { xs: '1.5rem', sm: '2rem' },
          fontWeight: 600,
          color: 'text.primary',
          mb: { xs: 0.5, sm: 1 }
        }}
      >
        {value}
      </Typography>
      
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          fontSize: { xs: '0.813rem', sm: '0.875rem' },
          mt: 'auto'
        }}
      >
        {title}
      </Typography>
    </Card>
  );
};

export default StatCard; 