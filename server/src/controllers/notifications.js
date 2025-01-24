import Notification from '../models/Notification.js';

// Get all notifications for the authenticated user
export const getNotifications = async (req, res) => {
  try {
    console.log('Fetching notifications for user:', req.user._id);
    
    const notifications = await Notification.find({
      user: req.user._id,
    })
    .sort({ createdAt: -1 })
    .populate('evaluationId', 'status scheduledDate')
    .lean();

    console.log('Found notifications:', notifications.length);
    
    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    console.log('Marking notification as read:', {
      notificationId: req.params.notificationId,
      userId: req.user._id
    });

    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      user: req.user._id
    });

    if (!notification) {
      console.log('Notification not found:', {
        notificationId: req.params.notificationId,
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
      notificationId: req.params.notificationId,
      userId: req.user._id
    });
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

// Delete a notification permanently
export const deleteNotification = async (req, res) => {
  try {
    console.log('Deleting notification:', {
      notificationId: req.params.notificationId,
      userId: req.user._id
    });

    const notification = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      user: req.user._id
    });

    if (!notification) {
      console.log('Notification not found:', {
        notificationId: req.params.notificationId,
        userId: req.user._id
      });
      return res.status(404).json({ message: 'Notification not found' });
    }

    console.log('Notification deleted successfully:', {
      notificationId: notification._id,
      userId: notification.user
    });

    res.json({ 
      message: 'Notification deleted successfully',
      notification: {
        id: notification._id
      }
    });
  } catch (error) {
    console.error('Error deleting notification:', {
      error: error.message,
      stack: error.stack,
      notificationId: req.params.notificationId,
      userId: req.user._id
    });
    res.status(500).json({ message: 'Error deleting notification' });
  }
}; 