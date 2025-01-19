import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationProps {
  type?: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  onClose: () => void;
  duration?: number;
}

export function Notification({
  type = 'success',
  title,
  message,
  onClose,
  duration = 5000,
}: NotificationProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match the animation duration
  };

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    info: <AlertCircle className="h-5 w-5 text-blue-500" />,
  };

  const backgrounds = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const titles = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
  };

  const messages = {
    success: 'text-green-700',
    error: 'text-red-700',
    info: 'text-blue-700',
  };

  return (
    <div className={cn(
      'fixed top-4 right-4 w-96 rounded-lg border p-4 shadow-lg',
      isClosing ? 'animate-slide-out' : 'animate-slide-in',
      backgrounds[type]
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <div className="flex-1">
          <h3 className={cn('text-sm font-medium', titles[type])}>
            {title}
          </h3>
          {message && (
            <p className={cn('mt-1 text-sm', messages[type])}>
              {message}
            </p>
          )}
        </div>
        <button
          onClick={handleClose}
          className={cn(
            'flex-shrink-0 rounded-lg p-1 hover:bg-white/25 transition-colors',
            titles[type]
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface NotificationContainerProps {
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
  }>;
  onClose: (id: string) => void;
}

export function NotificationContainer({ notifications, onClose }: NotificationContainerProps) {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => onClose(notification.id)}
        />
      ))}
    </div>
  );
} 