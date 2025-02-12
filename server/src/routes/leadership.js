import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getCompetencies,
  getCompetencyById,
  getDevelopmentPlan,
  getTemplatePlans,
  createTemplatePlan,
  assignPlan,
  updatePlanProgress,
  getResources,
  getResourcesByCompetency,
  getAssignableUsers,
  getAssignedPlans,
  deletePlan,
  updateBookProgress,
  getBookProgress,
  updateProgramProgress,
  getProgramProgress
} from '../controllers/leadershipController.js';

const router = express.Router();

// Competency routes
router.get('/competencies', auth, getCompetencies);
router.get('/competencies/:id', auth, getCompetencyById);

// Development Plan routes
router.get('/development-plan', auth, getDevelopmentPlan);
router.get('/templates', auth, getTemplatePlans);
router.post('/templates', auth, createTemplatePlan);
router.post('/assign', auth, assignPlan);
router.put('/progress', auth, updatePlanProgress);
router.get('/assigned-plans', auth, getAssignedPlans);
router.delete('/plans/:planId', auth, deletePlan);

// Resource routes
router.get('/resources', auth, getResources);
router.get('/resources/competency/:competencyId', auth, getResourcesByCompetency);

// Book Progress routes
router.get('/resources/:resourceId/progress', auth, getBookProgress);
router.post('/resources/:resourceId/progress', auth, updateBookProgress);
router.put('/resources/:resourceId/progress', auth, updateBookProgress);

// Program Progress routes
router.get('/plans/:planId/progress', auth, getProgramProgress);
router.post('/plans/:planId/progress', auth, updateProgramProgress);
router.put('/plans/:planId/progress', auth, updateProgramProgress);

// User routes
router.get('/assignable-users', auth, getAssignableUsers);

export default router; 