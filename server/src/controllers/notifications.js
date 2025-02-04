import Notification from '../models/Notification.js';
import Evaluation from '../models/Evaluation.js';

// Get all notifications for the authenticated user
export const getNotifications = async (req, res) => {
  try {
    // First, get all notifications for the user
    const allNotifications = await Notification.find({
      $or: [
        { userId: req.user._id },
        { user: req.user._id }
      ]
    }).lean();

    // Filter out read notifications
    const unreadNotifications = allNotifications.filter(n => {
      // Consider a notification unread if:
      // 1. It has status 'UNREAD' OR
      // 2. It has no status and read is false/undefined
      const isUnread = (n.status === 'UNREAD' || (!n.status && !n.read));
      return isUnread;
    });

    // Sort by creation date
    const sortedNotifications = unreadNotifications.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({ notifications: sortedNotifications });
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
      $or: [
        { userId: req.user._id },
        { user: req.user._id }
      ]
    });

    if (!notification) {
      console.log('Notification not found:', {
        notificationId: req.params.notificationId,
        userId: req.user._id
      });
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Set both status and read fields for compatibility
    notification.status = 'READ';
    notification.read = true;
    await notification.save();

    console.log('Notification marked as read successfully:', {
      notificationId: notification._id,
      userId: notification.userId || notification.user,
      status: notification.status,
      read: notification.read
    });

    res.json({ 
      message: 'Notification marked as read',
      notification: {
        id: notification._id,
        status: notification.status,
        read: notification.read
      }
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

// Delete a notification permanently
export const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    console.log('Attempting to delete notification:', notificationId);

    // First find the notification to ensure it exists and belongs to the user
    const notification = await Notification.findOne({
      _id: notificationId,
      $or: [
        { userId: req.user._id },
        { user: req.user._id }
      ]
    });

    if (!notification) {
      console.log('Notification not found or does not belong to user:', {
        notificationId,
        userId: req.user._id
      });
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Delete the notification using deleteOne for more reliable deletion
    const result = await Notification.deleteOne({ _id: notificationId });
    
    console.log('Delete operation result:', {
      notificationId,
      deletedCount: result.deletedCount,
      acknowledged: result.acknowledged
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Failed to delete notification' });
    }

    res.json({ 
      message: 'Notification deleted successfully',
      notification: {
        id: notificationId
      }
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      message: 'Error deleting notification',
      error: error.message 
    });
  }
}; 