import { apiClient } from './api-client';

/**
 * Get user notification preferences
 */
export const getUserNotificationPreferences = async () => {
  try {
    const response = await apiClient.get('/user/notification-preferences');
    return response.data;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }
};

/**
 * Update user notification preferences
 */
export const updateUserNotificationPreferences = async (preferences: any) => {
  try {
    const response = await apiClient.put('/user/notification-preferences', preferences);
    return response.data;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (params: {
  page?: number;
  limit?: number;
  isRead?: boolean;
} = {}) => {
  try {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId: string) => {
  try {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadNotificationsCount = async () => {
  try {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    throw error;
  }
};

/**
 * Verify Telegram connection by sending a test message
 */
export const verifyTelegramConnection = async (username: string) => {
  try {
    const response = await apiClient.post('/user/notification-preferences/verify-telegram', {
      username
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying Telegram connection:', error);
    throw error;
  }
};

// Export all notification API functions
export const notificationApi = {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationsCount,
  verifyTelegramConnection
};

export default notificationApi;
