'use client';

import { useState, useEffect } from 'react';
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
  X,
  Filter
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
import { adminNotificationApi } from '@/lib/api/admin-notification-api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminNotification {
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
  priority: 'low' | 'medium' | 'high';
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export function AdminNotificationCenter() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'high', 'medium', 'low'

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await adminNotificationApi.getAdminNotifications({ filter });
      if (response && response.success) {
        setNotifications(response.data.notifications);
        const unread = response.data.notifications.filter((n: AdminNotification) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      // Don't show toast for expected errors
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await adminNotificationApi.getUnreadAdminNotificationsCount();
      if (response && response.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up polling for unread count
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const response = await adminNotificationApi.markAdminNotificationAsRead(id);
      if (response && response.success) {
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
      const response = await adminNotificationApi.markAllAdminNotificationsAsRead();
      if (response && response.success) {
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
      const response = await adminNotificationApi.deleteAdminNotification(id);
      if (response && response.success) {
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

  // Filter notifications based on active tab and priority filter
  const filteredNotifications = notifications
    .filter(n => {
      if (activeTab === 'all') return true;
      if (activeTab === 'unread') return !n.isRead;
      return n.type === activeTab;
    })
    .filter(n => {
      if (filter === 'all') return true;
      return n.priority === filter;
    });

  const handleNotificationClick = (notification: AdminNotification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate to the action URL if available
    if (notification.action?.url) {
      router.push(notification.action.url);
      setIsOpen(false);
    } else if (notification.relatedTo?.model === 'Transaction') {
      router.push(`/admin/transactions/${notification.relatedTo.id}`);
      setIsOpen(false);
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
              <Bell className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-[#FF3B30] dark:bg-[#FF453A] text-[10px] font-medium text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg">
            <p className="text-black dark:text-white text-sm font-medium">Admin Notifications</p>
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
            className="fixed right-4 top-16 md:absolute md:right-0 md:top-auto md:mt-2 w-80 sm:w-96 bg-white dark:bg-black rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 z-50 max-h-[80vh] overflow-hidden"
          >
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="font-semibold text-black dark:text-white text-base">Admin Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs text-[#0066FF] dark:text-[#0A84FF] hover:bg-[#F0F7FF] dark:hover:bg-[#0A2A4F] rounded-full"
                    onClick={markAllAsRead}
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Mark all read
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg">
                    <DropdownMenuLabel className="text-neutral-500 dark:text-neutral-400 font-normal text-xs">Filter by Priority</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800" />
                    <DropdownMenuItem onClick={() => setFilter('all')} className="text-sm focus:bg-neutral-50 dark:focus:bg-neutral-900">
                      All Priorities
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('high')} className="text-sm focus:bg-neutral-50 dark:focus:bg-neutral-900">
                      <span className="w-2 h-2 rounded-full bg-[#FF3B30] dark:bg-[#FF453A] mr-2"></span>
                      High Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('medium')} className="text-sm focus:bg-neutral-50 dark:focus:bg-neutral-900">
                      <span className="w-2 h-2 rounded-full bg-[#FF9500] dark:bg-[#FF9F0A] mr-2"></span>
                      Medium Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('low')} className="text-sm focus:bg-neutral-50 dark:focus:bg-neutral-900">
                      <span className="w-2 h-2 rounded-full bg-[#34C759] dark:bg-[#30D158] mr-2"></span>
                      Low Priority
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <div className="px-5 pt-3">
                <TabsList className="grid w-full grid-cols-3 bg-neutral-100 dark:bg-neutral-900 p-0.5 rounded-lg">
                  <TabsTrigger
                    value="all"
                    className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-sm"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="unread"
                    className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-sm"
                  >
                    Unread
                    {unreadCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-[#0066FF] dark:bg-[#0A84FF] text-white rounded-full min-w-[18px] text-center">
                        {unreadCount}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="transaction"
                    className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-sm"
                  >
                    Transactions
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="mt-0">
                <AdminNotificationList
                  notifications={filteredNotifications}
                  isLoading={isLoading}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={handleNotificationClick}
                />
              </TabsContent>

              <TabsContent value="unread" className="mt-0">
                <AdminNotificationList
                  notifications={filteredNotifications}
                  isLoading={isLoading}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={handleNotificationClick}
                />
              </TabsContent>

              <TabsContent value="transaction" className="mt-0">
                <AdminNotificationList
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

interface AdminNotificationListProps {
  notifications: AdminNotification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: AdminNotification) => void;
}

function AdminNotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
  onDelete,
  onClick
}: AdminNotificationListProps) {
  if (isLoading) {
    return (
      <div className="p-5 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-4 p-4 border border-neutral-100 dark:border-neutral-800 rounded-xl">
            <Skeleton className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800" />
            <div className="space-y-3 flex-1">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-1/3 bg-neutral-100 dark:bg-neutral-800" />
                <Skeleton className="h-4 w-16 bg-neutral-100 dark:bg-neutral-800" />
              </div>
              <Skeleton className="h-4 w-full bg-neutral-100 dark:bg-neutral-800" />
              <Skeleton className="h-4 w-2/3 bg-neutral-100 dark:bg-neutral-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-10 text-center">
        <div className="bg-neutral-100 dark:bg-neutral-800 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
        </div>
        <p className="text-black dark:text-white font-medium mb-1">No notifications</p>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm font-light">You're all caught up!</p>
      </div>
    );
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-[#FFEFEE] text-[#FF3B30] dark:bg-[#3A1A1A] dark:text-[#FF453A]';
      case 'medium':
        return 'bg-[#FFF8EF] text-[#FF9500] dark:bg-[#3A2A1A] dark:text-[#FF9F0A]';
      case 'low':
        return 'bg-[#EDFCF2] text-[#34C759] dark:bg-[#1A3A2A] dark:text-[#30D158]';
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200';
    }
  };

  return (
    <ScrollArea className="h-[calc(60vh)] max-h-[400px]">
      <div className="p-3">
        {notifications.map((notification) => (
          <motion.div
            key={notification._id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`p-4 rounded-xl mb-2 cursor-pointer transition-all duration-200 group relative ${!notification.isRead
              ? 'bg-[#F0F7FF] dark:bg-[#0A2A4F] border border-[#E1EAFF] dark:border-[#1A3A5F]'
              : 'bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900'
              }`}
          >
            <div
              className="flex items-start gap-4"
              onClick={() => onClick(notification)}
            >
              <div className="flex-shrink-0">
                {notification.type === 'transaction' && (
                  <div className="bg-[#0066FF] dark:bg-[#0A84FF] text-white p-2 rounded-full">
                    <CreditCard className="h-4 w-4" />
                  </div>
                )}
                {notification.type === 'security_alert' && (
                  <div className="bg-[#FF3B30] dark:bg-[#FF453A] text-white p-2 rounded-full">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                )}
                {notification.type === 'user_activity' && (
                  <div className="bg-[#5856D6] dark:bg-[#5E5CE6] text-white p-2 rounded-full">
                    <User className="h-4 w-4" />
                  </div>
                )}
                {!notification.type || (notification.type !== 'transaction' && notification.type !== 'security_alert' && notification.type !== 'user_activity') && (
                  <div className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 p-2 rounded-full">
                    <Bell className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-medium text-sm text-black dark:text-white">{notification.title}</h4>
                    {notification.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityBadgeColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap ml-2 font-light">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-1.5 font-light">
                  {notification.message}
                </p>
                {notification.user && (
                  <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-500 flex items-center">
                    <User className="h-3 w-3 mr-1 inline" />
                    {notification.user.name}
                  </div>
                )}
                {notification.action && (
                  <div className="mt-3 flex items-center text-xs text-[#0066FF] dark:text-[#0A84FF] font-medium">
                    {notification.action.text}
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </div>
                )}
              </div>
            </div>

            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              {!notification.isRead && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full bg-white dark:bg-black hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notification._id);
                        }}
                      >
                        <Check className="h-3.5 w-3.5 text-[#34C759] dark:text-[#30D158]" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg">
                      <p className="text-black dark:text-white text-xs">Mark as read</p>
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
                      className="h-7 w-7 rounded-full bg-white dark:bg-black hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification._id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-[#FF3B30] dark:text-[#FF453A]" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg">
                    <p className="text-black dark:text-white text-xs">Delete</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  );
}
