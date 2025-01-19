import express from 'express';
import { auth } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Mark notification as read
router.post('/:id/mark-read', auth, async (req, res) => {
  try {
    console.log('Marking notification as read:', {
      notificationId: req.params.id,
      userId: req.user._id
    });

    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      console.error('Notification not found:', {
        notificationId: req.params.id,
        userId: req.user._id
      });
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    console.log('Notification marked as read successfully:', {
      notificationId: notification._id,
      userId: notification.user,
      readAt: notification.readAt
    });

    res.json({ 
      message: 'Notification marked as read',
      notification: {
        id: notification._id,
        read: notification.read,
        readAt: notification.readAt
      }
    });
  } catch (error) {
    console.error('Error marking notification as read:', {
      error: error.message,
      stack: error.stack,
      notificationId: req.params.id,
      userId: req.user._id
    });
    res.status(500).json({ message: 'Error marking notification as read' });
  }
});

export default router; 