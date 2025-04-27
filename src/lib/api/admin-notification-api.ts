import { apiClient } from './api-client';

/**
 * Get admin notifications
 */
export const getAdminNotifications = async (params: { 
  page?: number; 
  limit?: number;
  filter?: string;
} = {}) => {
  try {
    const response = await apiClient.get('/admin/notifications', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    throw error;
  }
};

/**
 * Mark admin notification as read
 */
export const markAdminNotificationAsRead = async (notificationId: string) => {
  try {
    const response = await apiClient.put(`/admin/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking admin notification as read:', error);
    throw error;
  }
};

/**
 * Mark all admin notifications as read
 */
export const markAllAdminNotificationsAsRead = async () => {
  try {
    const response = await apiClient.put('/admin/notifications/mark-all-read');
    return response.data;
  } catch (error) {
    console.error('Error marking all admin notifications as read:', error);
    throw error;
  }
};

/**
 * Delete admin notification
 */
export const deleteAdminNotification = async (notificationId: string) => {
  try {
    const response = await apiClient.delete(`/admin/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting admin notification:', error);
    throw error;
  }
};

/**
 * Get unread admin notifications count
 */
export const getUnreadAdminNotificationsCount = async () => {
  try {
    const response = await apiClient.get('/admin/notifications/unread-count');
    return response.data;
  } catch (error) {
    console.error('Error fetching unread admin notifications count:', error);
    throw error;
  }
};

// Export all admin notification API functions
export const adminNotificationApi = {
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  deleteAdminNotification,
  getUnreadAdminNotificationsCount
};

export default adminNotificationApi;
