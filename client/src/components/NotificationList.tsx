import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, X, AlertTriangle, Bell, Target, TrendingUp } from 'lucide-react';
import api from '@/lib/axios';
import { useNotification } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface NotificationListProps {
  onDismiss: () => void;
  isMobile?: boolean;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'evaluation' | 'disciplinary' | 'goal' | 'recognition' | 'system' | 'reminder';
  evaluationId?: string;
  read: boolean;
  createdAt: string;
  scheduledDate?: string;
  employee?: {
    name: string;
    position: string;
    department: string;
  };
  evaluator?: string;
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
      
      // Navigate based on notification type
      switch (notification.type) {
        case 'evaluation':
          if (notification.evaluationId) {
            const evaluationId = typeof notification.evaluationId === 'object' 
              ? notification.evaluationId._id || notification.evaluationId.toString()
              : notification.evaluationId;
            navigate(`/evaluations/${evaluationId}`);
          }
          break;
        case 'disciplinary':
          navigate('/disciplinary');
          break;
        case 'goal':
          navigate('/goals');
          break;
        case 'recognition':
          navigate('/recognition');
          break;
        default:
          // For system and reminder notifications, no navigation needed
          break;
      }
      
      await handleDismissNotification(notification._id);
    } catch (error) {
      console.error('Error handling notification click:', error);
      showNotification('error', 'Error', 'Failed to process notification');
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'evaluation':
        return <ClipboardList className="w-4 h-4 text-[#E51636]" />;
      case 'disciplinary':
        return <AlertTriangle className="w-4 h-4 text-[#E51636]" />;
      case 'goal':
        return <Target className="w-4 h-4 text-[#E51636]" />;
      case 'recognition':
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
            <div className="w-8 h-8 rounded-full bg-[#E51636]/10 flex items-center justify-center flex-shrink-0">
              {getNotificationIcon(notification.type)}
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
                    {notification.type === 'evaluation' ? 'Evaluation' : notification.title}
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
                {notification.employee && (
                  <div className={cn(
                    "text-[#27251F]/60 flex flex-col gap-0.5",
                    isMobile ? "text-sm" : "text-xs"
                  )}>
                    {notification.employee.position && (
                      <p>Position: {notification.employee.position}</p>
                    )}
                    {notification.employee.department && (
                      <p>Department: {notification.employee.department}</p>
                    )}
                    {notification.scheduledDate && (
                      <p>Scheduled: {formatDate(notification.scheduledDate)}</p>
                    )}
                    {notification.evaluator && (
                      <p>Evaluator: {notification.evaluator}</p>
                    )}
                  </div>
                )}
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismissNotification(notification._id);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 