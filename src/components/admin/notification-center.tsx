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
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';

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
      <MotionConfig reducedMotion="user">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
        >
          <Card className="w-full overflow-hidden border-0 shadow-lg bg-white dark:bg-black rounded-xl">
            <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 px-8 py-6">
              <CardTitle className="text-xl font-semibold text-black dark:text-white tracking-tight">Admin Notifications</CardTitle>
              <CardDescription className="text-neutral-500 dark:text-neutral-400 mt-1 font-light">
                Admin access required
              </CardDescription>
            </CardHeader>
            <CardContent className="py-16">
              <motion.div
                className="text-center max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className="bg-[#F0F7FF] dark:bg-[#0A2A4F] h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 15,
                    delay: 0.3
                  }}
                >
                  <Lock className="h-10 w-10 text-[#0066FF] dark:text-[#0A84FF]" />
                </motion.div>
                <motion.h3
                  className="text-lg font-medium text-black dark:text-white mb-3"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Access Restricted
                </motion.h3>
                <motion.p
                  className="text-neutral-600 dark:text-neutral-400 font-light"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  You need administrator privileges to view and manage system notifications.
                </motion.p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
      >
        <Card className="w-full overflow-hidden border-0 shadow-lg bg-white dark:bg-black rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100 dark:border-neutral-800 px-8 py-6">
            <div>
              <CardTitle className="text-xl font-semibold text-black dark:text-white tracking-tight">Notifications</CardTitle>
              <CardDescription className="text-neutral-500 dark:text-neutral-400 mt-1 font-light">
                Stay updated on system activities
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Badge className="bg-[#F0F7FF] text-[#0066FF] dark:bg-[#0A2A4F] dark:text-[#0A84FF] hover:bg-[#E1EAFF] dark:hover:bg-[#0A3A6F] transition-colors border-0 font-medium px-2.5 py-0.5">
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
                      className="border-[#0066FF] dark:border-[#0A84FF] text-[#0066FF] dark:text-[#0A84FF] hover:bg-[#F0F7FF] dark:hover:bg-[#0A2A4F] disabled:opacity-50 rounded-full"
                    >
                      <Check className="h-4 w-4 mr-1.5" />
                      Mark all read
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg">
                    <p className="text-black dark:text-white text-xs">Mark all notifications as read</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-8 pt-4 pb-4">
                <TabsList className="bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg h-10">
                  <TabsTrigger
                    value="all"
                    className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-sm h-8"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="unread"
                    className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-sm h-8"
                  >
                    Unread
                    {unreadCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-[#0066FF] dark:bg-[#0A84FF] text-white rounded-full min-w-[18px] text-center">
                        {unreadCount}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="TRANSACTION"
                    className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-sm h-8 flex items-center"
                  >
                    <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                    <span>Transactions</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="PROFILE_REGISTRATION"
                    className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-sm h-8 flex items-center"
                  >
                    <User className="h-3.5 w-3.5 mr-1.5" />
                    <span>Profiles</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="SYSTEM_ALERT"
                    className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-sm h-8 flex items-center"
                  >
                    <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                    <span>System</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="h-[400px] px-1">
                <TabsContent value={activeTab} className="mt-0 pt-2">
                  {isLoading ? (
                    <motion.div
                      className="space-y-4 p-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ staggerChildren: 0.1 }}
                    >
                      {Array(3).fill(0).map((_, i) => (
                        <motion.div
                          key={i}
                          className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: i * 0.1,
                            type: "spring",
                            stiffness: 300,
                            damping: 25
                          }}
                        >
                          <Skeleton className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800" />
                          <div className="space-y-3 flex-1">
                            <div className="flex justify-between">
                              <Skeleton className="h-5 w-1/3 bg-neutral-100 dark:bg-neutral-800" />
                              <Skeleton className="h-4 w-16 bg-neutral-100 dark:bg-neutral-800" />
                            </div>
                            <Skeleton className="h-4 w-full bg-neutral-100 dark:bg-neutral-800" />
                            <Skeleton className="h-4 w-2/3 bg-neutral-100 dark:bg-neutral-800" />
                            <Skeleton className="h-3 w-24 bg-neutral-100 dark:bg-neutral-800" />
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : filteredNotifications.length === 0 ? (
                    <motion.div
                      className="flex flex-col items-center justify-center py-16"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25
                      }}
                    >
                      <motion.div
                        className="bg-neutral-100 dark:bg-neutral-800 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        initial={{ y: 10 }}
                        animate={{ y: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 20,
                          delay: 0.2
                        }}
                      >
                        <Bell className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
                      </motion.div>
                      <motion.p
                        className="text-lg font-medium mb-1 text-black dark:text-white"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        No notifications
                      </motion.p>
                      <motion.p
                        className="text-sm text-neutral-500 dark:text-neutral-400 font-light"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        You're all caught up!
                      </motion.p>
                    </motion.div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      <motion.div
                        className="space-y-4 p-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ staggerChildren: 0.07 }}
                      >
                        {filteredNotifications.map((notification) => (
                          <motion.div
                            key={notification._id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                              mass: 1
                            }}
                            whileHover={{
                              scale: 1.02,
                              transition: { duration: 0.2 }
                            }}
                            className={`p-4 rounded-xl border transition-all duration-200 ${!notification.isRead
                              ? 'bg-[#F0F7FF] dark:bg-[#0A2A4F] border-[#E1EAFF] dark:border-[#1A3A5F]'
                              : 'bg-white dark:bg-black border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900'}`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-start gap-3">
                                {notification.type === 'TRANSACTION' && (
                                  <div className="bg-[#0066FF] dark:bg-[#0A84FF] text-white p-2 rounded-full">
                                    <CreditCard className="h-4 w-4" />
                                  </div>
                                )}
                                {notification.type === 'PROFILE_REGISTRATION' && (
                                  <div className="bg-[#34C759] dark:bg-[#30D158] text-white p-2 rounded-full">
                                    <User className="h-4 w-4" />
                                  </div>
                                )}
                                {notification.type === 'SYSTEM_ALERT' && (
                                  <div className="bg-[#FF3B30] dark:bg-[#FF453A] text-white p-2 rounded-full">
                                    <AlertCircle className="h-4 w-4" />
                                  </div>
                                )}
                                {notification.type === 'USER_ACTIVITY' && (
                                  <div className="bg-[#5856D6] dark:bg-[#5E5CE6] text-white p-2 rounded-full">
                                    <User className="h-4 w-4" />
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-medium text-black dark:text-white">{notification.title}</h4>
                                  <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-light">
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
                                          className="h-8 w-8 rounded-full bg-white dark:bg-black hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                                        >
                                          <Check className="h-4 w-4 text-[#34C759] dark:text-[#30D158]" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg">
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
                                        onClick={() => deleteNotification(notification._id)}
                                        className="h-8 w-8 rounded-full bg-white dark:bg-black hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                                      >
                                        <Trash2 className="h-4 w-4 text-[#FF3B30] dark:text-[#FF453A]" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg">
                                      <p className="text-black dark:text-white text-xs">Delete notification</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 mb-2 pl-9 font-light">{notification.message}</p>
                            {notification.referenceId && (
                              <div className="pl-9 mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 px-3 rounded-full border-[#0066FF] dark:border-[#0A84FF] text-[#0066FF] dark:text-[#0A84FF] hover:bg-[#F0F7FF] dark:hover:bg-[#0A2A4F]"
                                >
                                  View details <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between py-5 px-8 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-light">
              {filteredNotifications.length > 0 && `Showing ${filteredNotifications.length} notification${filteredNotifications.length !== 1 ? 's' : ''}`}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchNotifications}
                    className="border-[#0066FF] dark:border-[#0A84FF] text-[#0066FF] dark:text-[#0A84FF] hover:bg-[#F0F7FF] dark:hover:bg-[#0A2A4F] rounded-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg">
                  <p className="text-black dark:text-white text-xs">Refresh notifications</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardFooter>
        </Card>
      </motion.div>
    </MotionConfig>
  );
}
