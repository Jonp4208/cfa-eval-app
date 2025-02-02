import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, X, AlertTriangle, Bell, Target, TrendingUp } from 'lucide-react';
import api from '@/lib/axios';
import { useNotification } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  status?: 'READ' | 'UNREAD';
  read?: boolean;
  metadata?: {
    evaluationId?: string;
    evaluationType?: string;
    scheduledDate?: string;
  };
  employee?: {
    name: string;
    position: string;
    department: string;
  };
}

interface NotificationListProps {
  onDismiss: () => void;
  isMobile?: boolean;
}

export function NotificationList({ onDismiss, isMobile = false }: NotificationListProps) {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications...');
      const response = await api.get('/api/notifications');
      console.log('Notifications response:', response.data);
      
      setNotifications(response.data.notifications);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showNotification('error', 'Error', 'Failed to load notifications');
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // If it's an evaluation notification, navigate to the evaluation
      if (notification.type === 'EVALUATION' && notification.metadata?.evaluationId) {
        navigate(`/evaluations/${notification.metadata.evaluationId}`);
      }
      
      // Mark as read
      await api.post(`/api/notifications/${notification._id}/mark-read`);
      
      // Remove from list
      setNotifications(prev => prev.filter(n => n._id !== notification._id));
      
      // Close dropdown if mobile
      if (isMobile) {
        onDismiss();
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      showNotification('error', 'Error', 'Failed to process notification');
    }
  };

  const handleDismissNotification = async (notificationId: string) => {
    try {
      console.log('Dismissing notification:', notificationId);
      
      // Delete the notification completely
      const response = await api.delete(`/api/notifications/${notificationId}`);
      
      if (response.status === 200) {
        // Remove from the notifications list
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        
        // Only call onDismiss if the deletion was successful
        if (onDismiss) {
          onDismiss();
        }
      } else {
        console.error('Failed to delete notification:', response);
        showNotification('error', 'Error', 'Failed to delete notification. Please try again.');
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
      showNotification('error', 'Error', 'Failed to delete notification. Please try again.');
    }
  };

  const getNotificationIcon = (type: string) => {
    const upperType = type.toUpperCase();
    switch (upperType) {
      case 'EVALUATION':
        return <ClipboardList className="w-4 h-4 text-[#E51636]" />;
      case 'DISCIPLINARY':
        return <AlertTriangle className="w-4 h-4 text-[#E51636]" />;
      case 'GOAL':
        return <Target className="w-4 h-4 text-[#E51636]" />;
      case 'RECOGNITION':
        return <TrendingUp className="w-4 h-4 text-[#E51636]" />;
      default:
        return <Bell className="w-4 h-4 text-[#E51636]" />;
    }
  };

  const formatDate = (date: string) => {
    try {
      const dateObj = new Date(date);
      if (date.includes('T')) {
        // If it's a full datetime string
        return format(dateObj, 'M/d/yyyy');
      } else {
        // If it's just a date string
        return format(dateObj, 'M/d/yyyy');
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return date;
    }
  };

  if (loading) {
    return (
      <div className={cn(
        "text-center text-gray-500",
        isMobile ? "p-6" : "p-4"
      )}>
        Loading notifications...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={cn(
        "text-center text-gray-500",
        isMobile ? "p-6" : "p-4"
      )}>
        No new notifications
      </div>
    );
  }

  return (
    <div className={cn(
      "overflow-y-auto",
      isMobile ? "max-h-[calc(100vh-200px)]" : "max-h-[400px] py-2"
    )}>
      {notifications.map((notification) => (
        <div 
          key={notification._id} 
          className={cn(
            "relative hover:bg-gray-50",
            isMobile ? "p-4 border-b" : "px-4 py-2"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#E51636]/10 flex items-center justify-center flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              {notification.status === 'UNREAD' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#E51636] rounded-full" />
              )}
            </div>
            <button 
              className="flex-grow text-left"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <p className={cn(
                    "font-medium text-[#27251F]",
                    isMobile ? "text-base" : "text-sm"
                  )}>
                    {notification.title}
                    {notification.employee?.name && ` - ${notification.employee.name}`}
                  </p>
                  <p className={cn(
                    "text-[#27251F]/60 text-xs",
                    isMobile ? "text-sm" : "text-xs"
                  )}>
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
                <p className={cn(
                  "text-[#27251F]/60",
                  isMobile ? "text-sm" : "text-xs"
                )}>
                  {notification.message}
                </p>
              </div>
            </button>
            <button
              onClick={() => handleDismissNotification(notification._id)}
              className="text-[#27251F]/40 hover:text-[#27251F]/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 