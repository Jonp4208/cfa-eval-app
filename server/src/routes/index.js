import express from 'express';
import authRoutes from './auth.js';
import storesRoutes from './stores.js';
import templateRoutes from './templates.js';
import evaluationRoutes from './evaluations.js';
import dashboardRoutes from './dashboard.js';
import settingsRoutes from './settings.js';
import usersRoutes from './users.js';
import disciplinaryRoutes from './disciplinary.js';
import goalsRoutes from './goals.js';
import analyticsRoutes from './analytics.js';
import gradingScalesRouter from './gradingScales.js';
import notificationsRouter from './notifications.js';
import kitchenRoutes from './kitchen.js';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/stores', storesRoutes);
router.use('/templates', templateRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);
router.use('/users', usersRoutes);
router.use('/disciplinary', disciplinaryRoutes);
router.use('/goals', goalsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/grading-scales', gradingScalesRouter);
router.use('/notifications', notificationsRouter);
router.use('/kitchen', kitchenRoutes);

export default router; 