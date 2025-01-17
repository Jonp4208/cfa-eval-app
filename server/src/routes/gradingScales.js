import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getGradingScales,
  getGradingScale,
  createGradingScale,
  updateGradingScale,
  deleteGradingScale,
  setDefaultScale
} from '../controllers/gradingScales.js';

const router = express.Router();

// Get all grading scales for a store
router.get('/', auth, getGradingScales);

// Get a single grading scale
router.get('/:id', auth, getGradingScale);

// Create a new grading scale
router.post('/', auth, createGradingScale);

// Update a grading scale
router.put('/:id', auth, updateGradingScale);

// Delete a grading scale
router.delete('/:id', auth, deleteGradingScale);

// Set a grading scale as default
router.post('/:id/default', auth, setDefaultScale);

export default router; 