import { ApiResponse } from '@/types/api';
import { fetchWithAuth } from './api-utils';

export class SessionsApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://my-profile-server-api.onrender.com/api';
  }

  /**
   * Get user login sessions
   * @param userId - The user ID to fetch sessions for
   * @param limit - Optional limit for number of sessions to return
   * @returns Promise with session data
   */
  async getUserSessions(userId: string, limit?: number): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (limit) {
        queryParams.append('limit', limit.toString());
      }

      const url = `${this.baseUrl}/sessions/${userId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetchWithAuth(url);

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || 'Failed to fetch user sessions',
          data: null
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: 'User sessions fetched successfully',
        data: data
      };
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        data: null
      };
    }
  }

  /**
   * Get login activity analytics
   * @param profileId - The profile ID to fetch login activity for
   * @param days - Number of days to fetch data for (default: 30)
   * @returns Promise with login activity data
   */
  async getLoginActivity(profileId: string, days: number = 30): Promise<ApiResponse> {
    try {
      const url = `${this.baseUrl}/sessions/analytics/login-activity/${profileId}?days=${days}`;
      const response = await fetchWithAuth(url);

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || 'Failed to fetch login activity',
          data: null
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: 'Login activity fetched successfully',
        data: data
      };
    } catch (error) {
      console.error('Error fetching login activity:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        data: null
      };
    }
  }
}
