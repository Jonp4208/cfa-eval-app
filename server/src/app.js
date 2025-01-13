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
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'https://cfa-eval-7eb74e14c3a4.herokuapp.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Create a router for API routes
const apiRouter = express.Router();

// Mount all API routes on the apiRouter
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

// Add error handling for the API routes
apiRouter.use(errorHandler);

// Mount the API router at /api
app.use('/api', apiRouter);

// Handle 404s for API routes specifically
app.all('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

export default app; 