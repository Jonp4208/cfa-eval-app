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
  sendDisciplinaryEmail,
  sendUnacknowledgedNotification
} from '../controllers/disciplinary.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Debug middleware for route matching
router.use((req, res, next) => {
  console.log('Disciplinary Route Debug:', {
    url: req.url,
    method: req.method,
    params: req.params,
    path: req.path,
    baseUrl: req.baseUrl
  });
  next();
});

// Base routes
router.route('/')
  .get(getAllIncidents)
  .post(createIncident);

// Employee-specific route
router.get('/employee/:employeeId', getEmployeeIncidents);

// Get all disciplinary incidents
router.get('/all', getAllDisciplinaryIncidents);

// Update existing incidents with store field
router.post('/update-store', updateExistingIncidents);

// Specific action routes for incidents
router.post('/:id/acknowledge', acknowledgeIncident);
router.post('/:id/follow-up', addFollowUp);
router.post('/:id/document', addDocument);
router.post('/:id/send-email', sendDisciplinaryEmail);
router.post('/:id/notify-unacknowledged', sendUnacknowledgedNotification);
router.post('/:id/follow-up/:followUpId/complete', completeFollowUp);

// Individual incident routes - MUST come last
router.route('/:id')
  .get(getIncidentById)
  .put(updateIncident)
  .delete(deleteIncident);

export default router; 