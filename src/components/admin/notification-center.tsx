'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Bell,
  Check,
  Trash2,
  Lock,
  RefreshCw,
  Filter,
  AlertCircle,
  Clock,
  User,
  CreditCard,
  ChevronRight,
  X
} from 'lucide-react';
import { isUserAdmin } from '@/lib/api/auth-helper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { adminApi } from '@/lib/api/admin-api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string;
  metadata?: any;
  isRead: boolean;
  createdAt: string;
}

export function AdminNotificationCenter() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getNotifications();
      if (response.success) {
        setNotifications(response.data.notifications);
        const unread = response.data.notifications.filter((n: Notification) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);

      // Don't show toast for 401 errors (expected for non-admin users)
      if (error?.response?.status !== 401) {
        toast.error('Failed to load notifications');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await adminApi.getUnreadNotificationsCount();
      if (response.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error: any) {
      // Only log non-401 errors
      if (error?.response?.status !== 401) {
        console.error('Error fetching unread count:', error);
      }
    }
  };

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      if (session?.user) {
        try {
          // Check if user is admin before fetching notifications
          const admin = await isUserAdmin();

          if (admin) {
            fetchNotifications();

            // Set up polling for unread count
            const interval = setInterval(fetchUnreadCount, 60000); // Check every minute
            return () => clearInterval(interval);
          } else {
            console.log('User is not an admin, skipping notification fetch');
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    checkAdminAndFetch();
  }, [session]);

  const markAsRead = async (id: string) => {
    try {
      const response = await adminApi.markNotificationAsRead(id);
      if (response.success) {
        setNotifications(notifications.map(n =>
          n._id === id ? { ...n, isRead: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await adminApi.markAllNotificationsAsRead();
      if (response.success) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await adminApi.deleteNotification(id);
      if (response.success) {
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

  // Check if user is admin - we'll use the state from the useEffect hook
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Check admin status when session changes
  useEffect(() => {
    const checkAdmin = async () => {
      if (session?.user) {
        const admin = await isUserAdmin();
        setIsAdminUser(admin);
      } else {
        setIsAdminUser(false);
      }
    };

    checkAdmin();
  }, [session]);

  if (!isAdminUser && !isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
            <CardTitle className="text-2xl font-medium tracking-tight text-gray-900">Admin Notifications</CardTitle>
            <CardDescription className="text-gray-500 mt-1">Admin access required</CardDescription>
          </CardHeader>
          <CardContent className="py-16">
            <div className="text-center text-gray-400 max-w-md mx-auto">
              <div className="bg-gray-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
                <Lock className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Access Restricted</h3>
              <p className="text-gray-500">You need administrator privileges to view and manage system notifications.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-gray-50 to-white border-b pb-4">
          <div>
            <CardTitle className="text-2xl font-medium tracking-tight text-gray-900">Notifications</CardTitle>
            <CardDescription className="text-gray-500 mt-1">Stay updated on system activities</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                {unreadCount} unread
              </Badge>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className="border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    Mark all read
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark all notifications as read</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b">
              <TabsList className="h-12 w-full rounded-none bg-transparent border-b-0 p-0">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-none h-12 px-4"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-none h-12 px-4"
                >
                  Unread
                </TabsTrigger>
                <TabsTrigger
                  value="TRANSACTION"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-none h-12 px-4"
                >
                  <CreditCard className="h-4 w-4 mr-1.5" />
                  Transactions
                </TabsTrigger>
                <TabsTrigger
                  value="PROFILE_REGISTRATION"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-800 data-[state=active]:text-blue-900 data-[state=active]:shadow-none rounded-none h-12 px-4"
                >
                  <User className="h-4 w-4 mr-1.5" />
                  Profiles
                </TabsTrigger>
                <TabsTrigger
                  value="SYSTEM_ALERT"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-none h-12 px-4"
                >
                  <AlertCircle className="h-4 w-4 mr-1.5" />
                  System
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[400px] px-1">
              <TabsContent value={activeTab} className="mt-0 pt-2">
                {isLoading ? (
                  <div className="space-y-4 p-4">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50/50 border border-gray-100">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-5 w-1/4" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-full mt-2" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-24 mt-1" />
                      </div>
                    ))}
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Bell className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium mb-1">No notifications</p>
                    <p className="text-sm text-gray-400">You're all caught up!</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    <div className="space-y-3 p-4">
                      {filteredNotifications.map((notification, index) => (
                        <motion.div
                          key={notification._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className={`p-4 rounded-xl border ${!notification.isRead
                            ? 'bg-blue-50/50 border-blue-100'
                            : 'bg-white border-gray-100 hover:bg-gray-50/50'}
                            transition-all duration-200`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              {notification.type === 'TRANSACTION' && (
                                <div className="bg-blue-100 text-blue-700 p-1.5 rounded-full">
                                  <CreditCard className="h-4 w-4" />
                                </div>
                              )}
                              {notification.type === 'PROFILE_REGISTRATION' && (
                                <div className="bg-green-100 text-green-700 p-1.5 rounded-full">
                                  <User className="h-4 w-4" />
                                </div>
                              )}
                              {notification.type === 'SYSTEM_ALERT' && (
                                <div className="bg-red-100 text-red-700 p-1.5 rounded-full">
                                  <AlertCircle className="h-4 w-4" />
                                </div>
                              )}
                              {notification.type === 'USER_ACTIVITY' && (
                                <div className="bg-purple-100 text-purple-700 p-1.5 rounded-full">
                                  <User className="h-4 w-4" />
                                </div>
                              )}
                              <div>
                                <h4 className="font-medium text-gray-900">{notification.title}</h4>
                                <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                  <Clock className="h-3 w-3 mr-1 inline" />
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {!notification.isRead && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => markAsRead(notification._id)}
                                        className="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-700"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
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
                                      onClick={() => deleteNotification(notification._id)}
                                      className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete notification</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 mb-1 pl-8">{notification.message}</p>
                          {notification.referenceId && (
                            <div className="pl-8 mt-2">
                              <Button variant="outline" size="sm" className="text-xs h-7 px-2 rounded-full">
                                View details <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between py-4 border-t bg-gray-50/50">
          <div className="text-xs text-gray-500">
            {filteredNotifications.length > 0 && `Showing ${filteredNotifications.length} notification${filteredNotifications.length !== 1 ? 's' : ''}`}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchNotifications}
                  className="border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh notifications</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
