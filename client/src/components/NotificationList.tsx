import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, X } from 'lucide-react';
import api from '@/lib/axios';
import { useNotification } from '@/contexts/NotificationContext';

interface NotificationListProps {
  onDismiss: () => void;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  evaluationId?: string;
  read: boolean;
  createdAt: string;
}

export function NotificationList({ onDismiss }: NotificationListProps) {
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
      
      const unreadNotifications = response.data.notifications.filter((n: Notification) => !n.read);
      console.log('Unread notifications:', unreadNotifications);
      
      setNotifications(unreadNotifications);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showNotification('error', 'Error', 'Failed to load notifications');
      setLoading(false);
    }
  };

  const handleDismissNotification = async (notificationId: string) => {
    try {
      console.log('Dismissing notification:', notificationId);
      await api.post(`/api/notifications/${notificationId}/mark-read`);
      
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      onDismiss();
      showNotification('success', 'Success', 'Notification dismissed');
    } catch (error) {
      console.error('Error dismissing notification:', error);
      showNotification('error', 'Error', 'Failed to dismiss notification');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      console.log('Handling notification click:', notification);
      
      if (notification.evaluationId) {
        console.log('Navigating to evaluation:', notification.evaluationId);
        navigate(`/evaluations/${notification.evaluationId}`);
      }
      
      await handleDismissNotification(notification._id);
    } catch (error) {
      console.error('Error handling notification click:', error);
      showNotification('error', 'Error', 'Failed to process notification');
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading notifications...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No new notifications
      </div>
    );
  }

  return (
    <div className="py-2 max-h-[400px] overflow-y-auto">
      {notifications.map((notification) => (
        <div key={notification._id} className="relative px-4 py-2 hover:bg-gray-50">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E51636]/10 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-4 h-4 text-[#E51636]" />
            </div>
            <button 
              className="flex-grow text-left"
              onClick={() => handleNotificationClick(notification)}
            >
              <p className="text-sm font-medium text-[#27251F]">
                {notification.title}
              </p>
              <p className="text-xs text-[#27251F]/60">
                {notification.message}
              </p>
              <p className="text-xs text-[#27251F]/60 mt-1">
                {new Date(notification.createdAt).toLocaleDateString()}
              </p>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDismissNotification(notification._id);
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-all flex-shrink-0"
            >
              <X className="w-4 h-4 text-[#27251F]/60" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 