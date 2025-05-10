"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification
} from "@/hooks/use-mypts-data";

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
  const [activeTab, setActiveTab] = useState("all");
  const [isOpen, setIsOpen] = useState(false);

  // Use React Query hooks for data fetching and mutations
  const {
    data: notificationsData,
    isLoading: isNotificationsLoading,
    refetch: refetchNotifications
  } = useNotifications();

  const {
    data: unreadCount = 0,
    isLoading: isUnreadCountLoading,
    refetch: refetchUnreadCount
  } = useUnreadNotificationCount();

  const { mutate: markAsReadMutation } = useMarkNotificationAsRead();
  const { mutate: markAllAsReadMutation } = useMarkAllNotificationsAsRead();
  const { mutate: deleteNotificationMutation } = useDeleteNotification();

  // Extract notifications from the response
  const notifications: Notification[] = notificationsData?.notifications || [];

  // Combined loading state
  const isLoading = isNotificationsLoading || isUnreadCountLoading;

  // Function to refresh all notification data
  const refreshNotifications = () => {
    refetchNotifications();
    refetchUnreadCount();
    toast.success("Refreshing notifications...");
  };

  // Function to mark a notification as read
  const markAsRead = (id: string) => {
    markAsReadMutation(id);
  };

  // Function to mark all notifications as read
  const markAllAsRead = () => {
    markAllAsReadMutation();
  };

  // Function to delete a notification
  const deleteNotification = (id: string) => {
    deleteNotificationMutation(id);
  };

  // Filter notifications based on active tab
  const filteredNotifications =
    activeTab === "all"
      ? notifications
      : activeTab === "unread"
        ? notifications.filter((n) => !n.isRead)
        : notifications.filter((n) => n.type === activeTab);

  // Handle keyboard events for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate to the action URL if available
    if (notification.action?.url) {
      router.push(notification.action.url);
      setIsOpen(false);
    } else if (notification.relatedTo?.model === "Transaction") {
      router.push(`/dashboard/transactions/${notification.relatedTo.id}`);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Notification Bell Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={`relative h-9 w-9 rounded-full transition-all duration-200 ${isOpen
                ? 'bg-accent/20 ring-2 ring-accent/30 shadow-md border-transparent'
                : 'border-muted-foreground/20 hover:bg-accent/10 hover:text-accent-foreground'
                } flex items-center justify-center`}
              onClick={() => setIsOpen(!isOpen)}
            >
              <motion.div
                animate={{
                  scale: isOpen ? 0.92 : 1
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 17
                }}
                className={`relative ${unreadCount > 0 && !isOpen ? 'pulse-subtle' : ''}`}
              >
                <Bell className={`h-[18px] w-[18px] ${unreadCount > 0 && !isOpen ? 'text-primary bell-ring-loop' : ''}`} />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-[19px] -right-1 h-4 w-4 min-w-[1rem] p-0.5 text-[10px] flex items-center justify-center rounded-full bg-red-500 text-white shadow-md"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </motion.div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Notifications</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Blur overlay when notification panel is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            style={{
              pointerEvents: "auto",
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh"
            }}
          />
        )}
      </AnimatePresence>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="notification-panel fixed left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-[550px] top-[3.9rem] bg-white sm:left-auto sm:right-4 sm:-translate-x-0 md:absolute md:right-0 md:top-[2.8rem] md:mt-2 sm:w-[500px]  md:w-[550px] backdrop-blur-md  dark:bg-neutral-900/75 border border-neutral-200/70 dark:border-neutral-800/70 rounded-2xl  shadow-lg dark:shadow-2xl shadow-neutral-400/20 dark:shadow-black/30 z-50 overflow-hidden"
          >
            <div className="p-3 sm:p-4 border-b border-neutral-200/70 dark:border-neutral-800/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <h3 className="font-semibold text-sm sm:text-base">Notifications</h3>
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border-muted-foreground/20 hover:bg-accent/10 hover:text-accent-foreground"
                  onClick={refreshNotifications}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs rounded-full border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700"
                    onClick={markAllAsRead}
                  >
                    <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-blue-600" />
                    <span className="hidden xs:inline">Mark all read</span>
                    <span className="xs:hidden">Mark all</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border-muted-foreground/20 hover:bg-accent/10 hover:text-accent-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>

            <Tabs
              defaultValue="all"
              className="w-full"
              onValueChange={setActiveTab}
            >
              <div className="px-2 sm:px-4 pt-2">
                <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10 p-1 bg-muted/50 rounded-lg">
                  <TabsTrigger value="all" className="text-xs sm:text-sm rounded-md">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="text-xs sm:text-sm rounded-md">
                    Unread
                    {unreadCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1.5 px-1.5 py-0 text-[10px] sm:text-xs bg-primary/10 text-primary border-none"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="system_notification" className="text-xs sm:text-sm rounded-md">
                    System
                  </TabsTrigger>
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
  onClick,
}: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-2 sm:gap-3">
            <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full" />
            <div className="space-y-1.5 sm:space-y-2 flex-1">
              <Skeleton className="h-3 sm:h-4 w-3/4" />
              <Skeleton className="h-2.5 sm:h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-6 sm:p-8 text-center">
        <Bell className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-xs sm:text-sm text-muted-foreground">No notifications to display</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(40vh)] sm:h-[calc(50vh)] md:h-[calc(60vh)] max-h-[400px]">
      <div className="p-2 sm:p-3">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className={`p-2.5 sm:p-3.5 rounded-lg mb-2 cursor-pointer transition-all duration-200 hover:bg-accent/10 group relative border ${!notification.isRead
              ? "bg-accent/5 border-accent/20 shadow-sm"
              : "border-transparent hover:border-accent/10"
              }`}
          >
            <div
              className="flex items-start gap-3 sm:gap-4"
              onClick={() => onClick(notification)}
            >
              <div className="flex-shrink-0">
                {notification.type === "system_notification" &&
                  notification.relatedTo?.model === "Transaction" && (
                    <div className="bg-blue-100 text-blue-700 p-1.5 sm:p-2 rounded-full shadow-sm">
                      <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                  )}
                {notification.type === "security_alert" && (
                  <div className="bg-red-100 text-red-700 p-1.5 sm:p-2 rounded-full shadow-sm">
                    <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                )}
                {!notification.type ||
                  (notification.type !== "system_notification" &&
                    notification.type !== "security_alert" && (
                      <div className="bg-gray-100 text-gray-700 p-1.5 sm:p-2 rounded-full shadow-sm">
                        <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                    ))}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-xs sm:text-sm truncate">
                    {notification.title}
                    {!notification.isRead && (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 ml-1.5 align-middle"></span>
                    )}
                  </h4>
                  <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap ml-1 sm:ml-2 bg-muted/50 px-1.5 py-0.5 rounded-full">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1 sm:mt-1.5">
                  {notification.message}
                </p>
                {notification.action && (
                  <div className="mt-2 sm:mt-2.5 inline-flex items-center text-[10px] sm:text-xs text-primary font-medium bg-primary/5 self-start px-2 py-0.5 rounded-full">
                    {notification.action.text}
                    <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-0.5 sm:ml-1" />
                  </div>
                )}
              </div>
            </div>

            <div className="absolute top-1 sm:top-2 right-1 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 sm:gap-2">
              {!notification.isRead && (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notification._id);
                        }}
                      >
                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-xs">
                      <p>Mark as read</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification._id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">
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
