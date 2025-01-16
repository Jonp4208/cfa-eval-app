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

// Error Handler
import { errorHandler } from './utils/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware for route matching
app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
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

// API error handling
apiRouter.use(errorHandler);

// Handle 404s for API routes
apiRouter.all('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Mount the API router at /api
app.use('/api', apiRouter);

// Static file serving - AFTER API routes
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Serve React app for any other routes - This should be LAST
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

export default app; 