'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  Trash2,
  AlertCircle,
  Clock,
  User,
  CreditCard,
  ChevronRight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationApi } from '@/lib/api/notification-api';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  relatedTo?: {
    model: string;
    id: string;
  };
  action?: {
    text: string;
    url: string;
  };
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

export function NotificationCenter() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await notificationApi.getUserNotifications();
      if (response && response.notifications) {
        setNotifications(response.notifications);
        const unread = response.notifications.filter((n: Notification) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't show toast for expected errors
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationApi.getUnreadNotificationsCount();
      if (response && response.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();

      // Set up polling for unread count
      const interval = setInterval(fetchUnreadCount, 60000); // Check every minute
      return () => clearInterval(interval);
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const markAsRead = async (id: string) => {
    try {
      const response = await notificationApi.markNotificationAsRead(id);
      if (response) {
        setNotifications(notifications.map(n =>
          n._id === id ? { ...n, isRead: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await notificationApi.markAllNotificationsAsRead();
      if (response) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await notificationApi.deleteNotification(id);
      if (response) {
        setNotifications(notifications.filter(n => n._id !== id));
        if (!notifications.find(n => n._id === id)?.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Filter notifications based on active tab
  const filteredNotifications = activeTab === 'all'
    ? notifications
    : activeTab === 'unread'
      ? notifications.filter(n => !n.isRead)
      : notifications.filter(n => n.type === activeTab);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate to the action URL if available
    if (notification.action?.url) {
      router.push(notification.action.url);
      setIsOpen(false);
    } else if (notification.relatedTo?.model === 'Transaction') {
      router.push(`/dashboard/transactions/${notification.relatedTo.id}`);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Notifications</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-[2rem] top-16 md:absolute md:right-0 md:top-auto md:mt-2 w-80 sm:w-96 bg-card rounded-lg shadow-lg border z-50 max-h-[80vh] overflow-hidden"
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={markAllAsRead}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <div className="px-4 pt-2">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">
                    Unread
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="system_notification">System</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="mt-0">
                <NotificationList
                  notifications={filteredNotifications}
                  isLoading={isLoading}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={handleNotificationClick}
                />
              </TabsContent>

              <TabsContent value="unread" className="mt-0">
                <NotificationList
                  notifications={filteredNotifications}
                  isLoading={isLoading}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={handleNotificationClick}
                />
              </TabsContent>

              <TabsContent value="system_notification" className="mt-0">
                <NotificationList
                  notifications={filteredNotifications}
                  isLoading={isLoading}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={handleNotificationClick}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}

function NotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
  onDelete,
  onClick
}: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No notifications to display</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(60vh)] max-h-[400px]">
      <div className="p-2">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className={`p-3 rounded-lg mb-1 cursor-pointer transition-all duration-200 hover:bg-accent group relative ${
              !notification.isRead ? 'bg-accent/30' : ''
            }`}
          >
            <div
              className="flex items-start gap-3"
              onClick={() => onClick(notification)}
            >
              <div className="flex-shrink-0">
                {notification.type === 'system_notification' && notification.relatedTo?.model === 'Transaction' && (
                  <div className="bg-blue-100 text-blue-700 p-1.5 rounded-full">
                    <CreditCard className="h-4 w-4" />
                  </div>
                )}
                {notification.type === 'security_alert' && (
                  <div className="bg-red-100 text-red-700 p-1.5 rounded-full">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                )}
                {!notification.type || (notification.type !== 'system_notification' && notification.type !== 'security_alert') && (
                  <div className="bg-gray-100 text-gray-700 p-1.5 rounded-full">
                    <Bell className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {notification.message}
                </p>
                {notification.action && (
                  <div className="mt-2 flex items-center text-xs text-primary font-medium">
                    {notification.action.text}
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </div>
                )}
              </div>
            </div>

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              {!notification.isRead && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notification._id);
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Mark as read</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification._id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Delete</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
