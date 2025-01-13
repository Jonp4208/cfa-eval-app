import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
  addFollowUp,
  addDocument
} from '../controllers/disciplinary.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Base routes
router.route('/')
  .get(getAllIncidents)
  .post(createIncident);

// Individual incident routes
router.route('/:id')
  .get(getIncidentById)
  .put(updateIncident)
  .delete(deleteIncident);

// Follow-up routes
router.post('/:id/follow-up', addFollowUp);

// Document routes
router.post('/:id/document', addDocument);

export default router; 