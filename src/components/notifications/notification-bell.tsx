'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  Calendar,
  MessageCircle,
  Star,
  XCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Notification, NotificationType } from '@/types';
import { useRouter } from 'next/navigation';
import { useWebSocket } from '@/contexts/WebSocketContext';

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  BOOKING_NEW: <Calendar className="w-4 h-4" />,
  BOOKING_ACCEPTED: <CheckCircle className="w-4 h-4 text-success" />,
  BOOKING_REJECTED: <XCircle className="w-4 h-4 text-destructive" />,
  BOOKING_CANCELED: <XCircle className="w-4 h-4 text-muted-foreground" />,
  BOOKING_COMPLETED: <CheckCircle className="w-4 h-4 text-success" />,
  BOOKING_COMMENT: <MessageCircle className="w-4 h-4 text-primary" />,
  REVIEW_RECEIVED: <Star className="w-4 h-4 text-yellow-500" />,
};

const notificationColors: Record<NotificationType, string> = {
  BOOKING_NEW: 'bg-primary/10',
  BOOKING_ACCEPTED: 'bg-success-soft',
  BOOKING_REJECTED: 'bg-destructive/10',
  BOOKING_CANCELED: 'bg-muted',
  BOOKING_COMPLETED: 'bg-success-soft',
  BOOKING_COMMENT: 'bg-primary/10',
  REVIEW_RECEIVED: 'bg-yellow-50 dark:bg-yellow-900/20',
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isConnected, onNotification, onNotificationCount } = useWebSocket();

  // Fetch notifications - fallback to polling when WebSocket is disconnected
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(20),
    // Fallback polling every 30s when WebSocket is not connected
    refetchInterval: isConnected ? false : 30000,
  });

  // Listen for WebSocket notifications
  useEffect(() => {
    const unsubNotification = onNotification((notification) => {
      // Add new notification to the cache
      queryClient.setQueryData(['notifications'], (oldData: { notifications: Notification[]; unreadCount: number } | undefined) => {
        if (!oldData) return { notifications: [notification], unreadCount: 1 };
        return {
          notifications: [notification, ...oldData.notifications].slice(0, 20),
          unreadCount: oldData.unreadCount + 1,
        };
      });
    });

    const unsubCount = onNotificationCount((count) => {
      // Update unread count in the cache
      queryClient.setQueryData(['notifications'], (oldData: { notifications: Notification[]; unreadCount: number } | undefined) => {
        if (!oldData) return oldData;
        return { ...oldData, unreadCount: count };
      });
    });

    return () => {
      unsubNotification();
      unsubCount();
    };
  }, [onNotification, onNotificationCount, queryClient]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type
    if (notification.bookingId) {
      router.push('/dashboard');
    }

    setIsOpen(false);
  };

  const unreadCount = data?.unreadCount || 0;
  const notifications = data?.notifications || [];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'A l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {markAllAsReadMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3 h-3" />
                  )}
                  Tout marquer comme lu
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.isRead ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notificationColors[notification.type]}`}>
                          {notificationIcons[notification.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${!notification.isRead ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-border/50 bg-muted/30">
                <button
                  onClick={() => {
                    router.push('/dashboard');
                    setIsOpen(false);
                  }}
                  className="w-full text-center text-sm text-primary hover:underline cursor-pointer"
                >
                  Voir tout dans le dashboard
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
