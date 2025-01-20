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
  getEmployeeIncidents,
  getAllDisciplinaryIncidents,
  updateExistingIncidents,
  acknowledgeIncident,
  completeFollowUp,
  sendDisciplinaryEmail
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

// Send email route
router.post('/:id/send-email', sendDisciplinaryEmail);

// Individual incident routes - MUST come last
router.route('/:id')
  .get(getIncidentById)
  .put(updateIncident)
  .delete(deleteIncident);

// Get all disciplinary incidents
router.get('/all', getAllDisciplinaryIncidents);

// Update existing incidents with store field
router.post('/update-store', updateExistingIncidents);

// New routes for acknowledgment and follow-up completion
router.post('/:id/acknowledge', acknowledgeIncident);
router.post('/:id/follow-up/:followUpId/complete', completeFollowUp);

export default router; 