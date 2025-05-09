import { apiClient } from "./api-client"

class AdminApi {
  /**
   * Set the authentication token for API requests
   */
  setToken(token: string) {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Admin API: Token set in headers');
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
      console.log('Admin API: Token removed from headers');
    }
  }
  /**
   * Get admin notifications
   */
  async getNotifications(page = 1, limit = 20) {
    try {
      const response = await apiClient.get(`/admin/notifications?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting admin notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadNotificationsCount() {
    try {
      const response = await apiClient.get('/admin/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('Error getting unread notifications count:', error);
      throw error;
    }
  }

  /**
   * Get admin details
   */
  async getAdminDetails() {
    try {
      // Use the correct API endpoint that matches the backend route
      const response = await apiClient.get('/admin/details');
      return response.data;
    } catch (error) {
      console.error('Error getting admin details:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string) {
    try {
      const response = await apiClient.put(`/admin/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead() {
    try {
      const response = await apiClient.put('/admin/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string) {
    try {
      const response = await apiClient.delete(`/admin/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Process a sell transaction
   */
  async processSellTransaction(transactionId: string, paymentReference?: string, notes?: string) {
    try {
      const response = await apiClient.post('/my-pts/admin/process-sell', {
        transactionId,
        paymentReference,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Error processing sell transaction:', error);
      throw error;
    }
  }

  /**
   * Reject a sell transaction
   */
  async rejectSellTransaction(transactionId: string, reason?: string) {
    try {
      const response = await apiClient.post('/my-pts/admin/reject-sell', {
        transactionId,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting sell transaction:', error);
      throw error;
    }
  }
}

export const adminApi = new AdminApi();
