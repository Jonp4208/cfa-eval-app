import express from 'express';
import { auth } from '../middleware/auth.js';
import { 
  getSettings,
  updateSettings,
  resetSettings,
  getStoreInfo,
  updateStoreInfo
} from '../controllers/settings.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get store settings
router.get('/', getSettings);

// Update settings
router.patch('/', updateSettings);

// Reset settings
router.post('/reset', resetSettings);

// Store routes
router.get('/store', getStoreInfo);
router.patch('/store', updateStoreInfo);

export default router; 