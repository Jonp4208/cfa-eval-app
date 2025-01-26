import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.js';
import storesRoutes from './routes/stores.js';
import templateRoutes from './routes/templates.js';
import evaluationRoutes from './routes/evaluations.js';
import dashboardRoutes from './routes/dashboard.js';
import settingsRoutes from './routes/settings.js';
import usersRoutes from './routes/users.js';
import disciplinaryRoutes from './routes/disciplinary.js';
import goalsRoutes from './routes/goals.js';
import analyticsRoutes from './routes/analytics.js';
import gradingScalesRouter from './routes/gradingScales.js';
import notificationsRouter from './routes/notifications.js';
import tasksRouter from './routes/tasks.js';

// Services
import { initCronJobs } from './services/cronService.js';

// Error Handler
import { errorHandler } from './utils/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize cron jobs
initCronJobs();

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware for route matching
app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);
  next();
});

// Create a router for API routes
const apiRouter = express.Router();

// Mount all API routes on the API router
apiRouter.use('/auth', authRoutes);
apiRouter.use('/stores', storesRoutes);
apiRouter.use('/templates', templateRoutes);
apiRouter.use('/evaluations', evaluationRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/disciplinary', disciplinaryRoutes);
apiRouter.use('/goals', goalsRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/grading-scales', gradingScalesRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/tasks', tasksRouter);

// Test Email Configuration
apiRouter.post('/test-email', async (req, res) => {
  try {
    console.log('Starting test email send...');
    const { sendEmail } = await import('./utils/email.js');
    
    console.log('Attempting to send test email to:', process.env.EMAIL_USER);
    const result = await sendEmail({
      to: process.env.EMAIL_USER,
      subject: 'Test Email from LD Growth',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #E4002B;">Test Email</h1>
          <p>This is a test email from LD Growth to verify the email configuration.</p>
          <p>If you received this email, it means your email configuration is working correctly!</p>
          <p>Time sent: ${new Date().toLocaleString()}</p>
        </div>
      `
    });
    
    console.log('Email send result:', result);
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Detailed error in test-email endpoint:', {
      error: error,
      message: error.message,
      stack: error.stack,
      code: error.code,
      response: error.response
    });
    
    res.status(500).json({ 
      message: 'Failed to send test email',
      error: error.message,
      details: error.code || 'No error code available'
    });
  }
});

// API error handling
apiRouter.use(errorHandler);

// Handle 404s for API routes
apiRouter.all('*', (req, res) => {
  console.log('404 Not Found:', req.url);
  res.status(404).json({ message: 'API endpoint not found' });
});

// Mount the API router at /api
app.use('/api', apiRouter);

// Static file serving - AFTER API routes
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Test Sentry
app.get('/debug-sentry', function mainHandler(req, res) {
  throw new Error('My first Sentry error!');
});

// Serve React app for any other routes - This should be LAST
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

export default app; 