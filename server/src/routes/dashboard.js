// server/src/routes/dashboard.js
import express from 'express';
import { getDashboardStats, getRecentActivity, getTeamMemberDashboard } from '../controllers/dashboard.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', auth, getDashboardStats);
router.get('/activity', auth, getRecentActivity);
router.get('/team-member', auth, getTeamMemberDashboard);

export default router;