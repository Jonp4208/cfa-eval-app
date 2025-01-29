import Notification from '../models/Notification.js';
import Evaluation from '../models/Evaluation.js';

// Get all notifications for the authenticated user
export const getNotifications = async (req, res) => {
  try {
    console.log('Fetching notifications for user:', req.user._id);
    
    // Get all notifications for the user
    const notifications = await Notification.find({
      user: req.user._id,
    })
    .sort({ createdAt: -1 })
    .populate({
      path: 'evaluationId',
      select: 'status scheduledDate employee evaluator notificationStatus acknowledgement',
      populate: [
        { path: 'employee', select: 'name position department' },
        { path: 'evaluator', select: 'name' }
      ]
    })
    .lean();

    // Filter out notifications based on evaluation status
    const filteredNotifications = notifications.filter(notification => {
      // If it's not an evaluation notification, keep it
      if (notification.type !== 'evaluation') {
        return true;
      }

      // If it's an evaluation notification but has no evaluationId, skip it
      if (!notification.evaluationId) {
        return false;
      }

      const evaluation = notification.evaluationId;
      // Add null checks for employee and evaluator
      const isEmployee = evaluation.employee && notification.user.toString() === evaluation.employee._id.toString();
      const isEvaluator = evaluation.evaluator && notification.user.toString() === evaluation.evaluator._id.toString();

      // Check notification status based on user role and evaluation state
      if (isEmployee) {
        if (evaluation.status === 'pending_self_evaluation' && evaluation.notificationStatus?.employee?.scheduled) {
          return false;
        }
        if (evaluation.status === 'completed' && evaluation.notificationStatus?.employee?.completed) {
          return false;
        }
        if (evaluation.acknowledgement?.acknowledged && evaluation.notificationStatus?.employee?.acknowledged) {
          return false;
        }
      } else if (isEvaluator) {
        if (evaluation.status === 'pending_manager_review' && evaluation.notificationStatus?.evaluator?.selfEvaluationCompleted) {
          return false;
        }
        if (evaluation.status === 'in_review_session' && evaluation.notificationStatus?.evaluator?.reviewSessionScheduled) {
          return false;
        }
      }

      return true;
    });
    
    console.log('Found notifications:', notifications.length);
    console.log('Filtered notifications:', filteredNotifications.length);
    
    // Transform notifications to include employee details
    const transformedNotifications = filteredNotifications.map(notification => {
      if (notification.type === 'evaluation' && notification.evaluationId) {
        const evaluation = notification.evaluationId;
        return {
          ...notification,
          employee: {
            name: evaluation.employee?.name,
            position: evaluation.employee?.position,
            department: evaluation.employee?.department
          },
          evaluator: evaluation.evaluator?.name
        };
      }
      return notification;
    });
    
    res.json({ notifications: transformedNotifications });
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

    // First find the notification
    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      user: req.user._id
    }).populate('evaluationId');

    if (!notification) {
      console.log('Notification not found:', {
        notificationId: req.params.notificationId,
        userId: req.user._id
      });
      return res.status(404).json({ message: 'Notification not found' });
    }

    // If this is an evaluation notification, update the evaluation's notification status
    if (notification.type === 'evaluation' && notification.evaluationId) {
      const evaluation = notification.evaluationId;
      
      if (evaluation) {
        // Update notification status based on who is dismissing it and evaluation state
        if (notification.user.toString() === evaluation.employee.toString()) {
          // Employee dismissing notification
          evaluation.notificationStatus.employee.scheduled = true;
          evaluation.notificationStatus.employee.completed = evaluation.status === 'completed';
          evaluation.notificationStatus.employee.acknowledged = evaluation.acknowledgement?.acknowledged || false;
        } else if (notification.user.toString() === evaluation.evaluator.toString()) {
          // Evaluator dismissing notification
          evaluation.notificationStatus.evaluator.selfEvaluationCompleted = evaluation.status === 'pending_manager_review';
          evaluation.notificationStatus.evaluator.reviewSessionScheduled = evaluation.status === 'in_review_session';
        }
        
        await evaluation.save();
      }
    }

    // Delete the notification
    await Notification.findByIdAndDelete(notification._id);

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