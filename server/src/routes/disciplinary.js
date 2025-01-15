import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
  addFollowUp,
  addDocument,
  getEmployeeIncidents
} from '../controllers/disciplinary.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Debug middleware for route matching
router.use((req, res, next) => {
  console.log('Disciplinary Route URL:', req.url);
  console.log('Disciplinary Route Method:', req.method);
  next();
});

// Employee-specific route - MUST come before :id routes
router.get('/employee/:employeeId', getEmployeeIncidents);

// Base routes
router.route('/')
  .get(getAllIncidents)
  .post(createIncident);

// Document and follow-up routes
router.post('/:id/follow-up', addFollowUp);
router.post('/:id/document', addDocument);

// Individual incident routes - MUST come last
router.route('/:id')
  .get(getIncidentById)
  .put(updateIncident)
  .delete(deleteIncident);

export default router; 