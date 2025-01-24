import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, X } from 'lucide-react';
import api from '@/lib/axios';
import { useNotification } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';

interface NotificationListProps {
  onDismiss: () => void;
  isMobile?: boolean;
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
      await api.delete(`/api/notifications/${notificationId}`);
      
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      onDismiss();
    } catch (error) {
      console.error('Error dismissing notification:', error);
      showNotification('error', 'Error', 'Failed to delete notification');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      console.log('Handling notification click:', notification);
      
      if (notification.evaluationId) {
        const evaluationId = typeof notification.evaluationId === 'object' 
          ? notification.evaluationId._id || notification.evaluationId.toString()
          : notification.evaluationId;
        console.log('Navigating to evaluation:', evaluationId);
        navigate(`/evaluations/${evaluationId}`);
      }
      
      await handleDismissNotification(notification._id);
    } catch (error) {
      console.error('Error handling notification click:', error);
      showNotification('error', 'Error', 'Failed to process notification');
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
            <div className="w-8 h-8 rounded-full bg-[#E51636]/10 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-4 h-4 text-[#E51636]" />
            </div>
            <button 
              className="flex-grow text-left"
              onClick={() => handleNotificationClick(notification)}
            >
              <p className={cn(
                "font-medium text-[#27251F]",
                isMobile ? "text-base" : "text-sm"
              )}>
                {notification.title}
              </p>
              <p className={cn(
                "text-[#27251F]/60",
                isMobile ? "text-sm" : "text-xs"
              )}>
                {notification.message}
              </p>
              <p className={cn(
                "text-[#27251F]/60 mt-1",
                isMobile ? "text-sm" : "text-xs"
              )}>
                {new Date(notification.createdAt).toLocaleDateString()}
              </p>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDismissNotification(notification._id);
              }}
              className={cn(
                "hover:bg-gray-100 rounded-full transition-all flex-shrink-0",
                isMobile ? "p-3" : "p-2"
              )}
            >
              <X className={cn(
                "text-[#27251F]/60",
                isMobile ? "w-5 h-5" : "w-4 h-4"
              )} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 