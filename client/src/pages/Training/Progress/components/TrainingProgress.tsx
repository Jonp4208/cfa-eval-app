import { Box, Grid, Card, Typography, LinearProgress } from '@mui/material';
import { Users, GraduationCap, BookOpen, TrendingUp } from 'lucide-react';

const cardStyles = {
  p: 3,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 2,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  minHeight: 160, // Ensure minimum height
};

const iconBoxStyles = {
  width: 48,
  height: 48,
  borderRadius: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

return (
  <Box>
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* Total Employees Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={cardStyles}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                ...iconBoxStyles,
                bgcolor: 'primary.lighter',
                color: 'primary.main',
              }}
            >
              <Users size={24} />
            </Box>
          </Box>
          <Box sx={{ mt: 'auto' }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
              {totalEmployees}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Total
            </Typography>
          </Box>
        </Card>
      </Grid>

      {/* In Training Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={cardStyles}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                ...iconBoxStyles,
                bgcolor: 'success.lighter',
                color: 'success.main',
              }}
            >
              <BookOpen size={24} />
            </Box>
          </Box>
          <Box sx={{ mt: 'auto' }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
              {inTraining}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              In Training
            </Typography>
          </Box>
        </Card>
      </Grid>

      {/* Completed Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={cardStyles}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                ...iconBoxStyles,
                bgcolor: 'warning.lighter',
                color: 'warning.main',
              }}
            >
              <GraduationCap size={24} />
            </Box>
          </Box>
          <Box sx={{ mt: 'auto' }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
              {completed}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Completed
            </Typography>
          </Box>
        </Card>
      </Grid>

      {/* Progress Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={cardStyles}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                ...iconBoxStyles,
                bgcolor: 'info.lighter',
                color: 'info.main',
              }}
            >
              <TrendingUp size={24} />
            </Box>
          </Box>
          <Box sx={{ mt: 'auto' }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
              {`${progress}%`}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
              Progress
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: 'grey.100',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        </Card>
      </Grid>
    </Grid>

    {/* Department Progress Section */}
    <Card
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Department Progress
      </Typography>
      {/* ... rest of the department progress content ... */}
    </Card>

    {/* Upcoming Trainings Section */}
    <Card
      sx={{
        p: 3,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Upcoming Trainings
      </Typography>
      {/* ... rest of the upcoming trainings content ... */}
    </Card>
  </Box>
); 
