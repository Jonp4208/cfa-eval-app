import express from 'express';
import { auth } from '../middleware/auth.js';
import { 
  getNotifications,
  markNotificationAsRead,
  deleteNotification
} from '../controllers/notifications.js';

const router = express.Router();

// Get all notifications for the authenticated user
router.get('/', auth, getNotifications);

// Mark a notification as read
router.post('/:notificationId/mark-read', auth, markNotificationAsRead);

// Delete a specific notification permanently
router.delete('/:notificationId', auth, deleteNotification);

export default router; 