import { ApiResponse } from '@/types/api';
import { API_URL, REQUEST_TIMEOUT } from '@/lib/constants';

/**
 * Base API client with authentication handling
 */
class ApiClient {
  // Custom token for authentication
  private customToken: string | null = null;

  /**
   * Set a custom token to use for authentication
   * @param token The token to use for authentication
   */
  setToken(token: string): void {
    console.log('Setting custom token for API client');
    this.customToken = token;
  }

  protected getHeaders(): HeadersInit {
    // Create headers with content type
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // If we have a custom token, use it (highest priority)
    if (this.customToken) {
      headers['Authorization'] = `Bearer ${this.customToken}`;
      return headers;
    }

    // If we're in the browser, try to get the token from localStorage
    if (typeof window !== 'undefined') {
      // Try to get the token from localStorage
      const accessToken = localStorage.getItem('accessToken') ||
                          localStorage.getItem('next-auth.session-token');

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Add profile token if available
      const profileToken = localStorage.getItem('selectedProfileToken');
      if (profileToken) {
        headers['X-Profile-Token'] = profileToken;
      }
    }

    return headers;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = this.getHeaders();

      // Make sure we're using the profileId as a query parameter
      let url = `${API_URL}${endpoint}`;

      // If the URL doesn't already have a profileId parameter, add it
      if (!url.includes('profileId=') && typeof window !== 'undefined') {
        const profileId = localStorage.getItem('selectedProfileId');
        if (profileId) {
          url += url.includes('?') ? `&profileId=${profileId}` : `?profileId=${profileId}`;
        }
      }

      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      // Add a timestamp to the URL to prevent caching
      const urlWithTimestamp = url.includes('?')
        ? `${url}&_t=${Date.now()}`
        : `${url}?_t=${Date.now()}`;

      const response = await fetch(urlWithTimestamp, {
        method: 'GET',
        headers,
        credentials: 'include', // This is crucial for sending cookies
        cache: 'no-cache', // Disable caching
        signal: controller.signal
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`Error in GET request to ${endpoint}:`, error);

      // Check if it's an abort error (timeout)
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Request timed out. Please try again.',
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const headers = this.getHeaders();

      // Make sure we're using the profileId as a query parameter
      let url = `${API_URL}${endpoint}`;

      // If the URL doesn't already have a profileId parameter, add it
      if (!url.includes('profileId=') && typeof window !== 'undefined') {
        const profileId = localStorage.getItem('selectedProfileId');
        if (profileId) {
          url += url.includes('?') ? `&profileId=${profileId}` : `?profileId=${profileId}`;
          // Also include profileId in the data if it's not already there
          if (data && typeof data === 'object' && !data.profileId) {
            data.profileId = profileId;
          }
        }
      }

      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include', // Include cookies for authentication
        signal: controller.signal
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`Error in POST request to ${endpoint}:`, error);

      // Check if it's an abort error (timeout)
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Request timed out. Please try again.',
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  protected async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'An error occurred',
          error: data.error,
          errors: data.errors || undefined,
        };
      }

      // Handle both formats: { success: true, data: {...} } and { success: true, ...data }
      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error('API response handling error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to parse API response',
      };
    }
  }
}

/**
 * Analytics API service for gamification and analytics data
 */
export class AnalyticsApi extends ApiClient {
  /**
   * Get the full analytics dashboard for a profile
   * @param profileId Profile ID
   */
  async getDashboard(profileId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/analytics/dashboard/${profileId}`);
  }

  /**
   * Refresh the analytics dashboard with the latest data
   * @param profileId Profile ID
   */
  async refreshDashboard(profileId: string): Promise<ApiResponse<any>> {
    return this.post<any>(`/analytics/dashboard/${profileId}/refresh`, {});
  }

  /**
   * Get MyPts analytics for a profile
   * @param profileId Profile ID
   */
  async getMyPtsAnalytics(profileId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/analytics/dashboard/${profileId}/mypts`);
  }

  /**
   * Get usage analytics for a profile
   * @param profileId Profile ID
   */
  async getUsageAnalytics(profileId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/analytics/dashboard/${profileId}/usage`);
  }

  /**
   * Get profiling analytics for a profile
   * @param profileId Profile ID
   */
  async getProfilingAnalytics(profileId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/analytics/dashboard/${profileId}/profiling`);
  }

  /**
   * Get products analytics for a profile
   * @param profileId Profile ID
   */
  async getProductsAnalytics(profileId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/analytics/dashboard/${profileId}/products`);
  }

  /**
   * Get networking analytics for a profile
   * @param profileId Profile ID
   */
  async getNetworkingAnalytics(profileId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/analytics/dashboard/${profileId}/networking`);
  }

  /**
   * Get circle analytics for a profile
   * @param profileId Profile ID
   */
  async getCircleAnalytics(profileId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/analytics/dashboard/${profileId}/circle`);
  }

  /**
   * Get engagement analytics for a profile
   * @param profileId Profile ID
   */
  async getEngagementAnalytics(profileId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/analytics/dashboard/${profileId}/engagement`);
  }

  /**
   * Get plans analytics for a profile
   * @param profileId Profile ID
   */
  async getPlansAnalytics(profileId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/analytics/dashboard/${profileId}/plans`);
  }

  /**
   * Get data analytics for a profile
   * @param profileId Profile ID
   */
  async getDataAnalytics(profileId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/analytics/dashboard/${profileId}/data`);
  }

  /**
   * Get vault analytics for a profile
   * @param profileId Profile ID
   */
  async getVaultAnalytics(profileId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/analytics/dashboard/${profileId}/vault`);
  }

  /**
   * Get discover analytics for a profile
   * @param profileId Profile ID
   */
  async getDiscoverAnalytics(profileId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/analytics/dashboard/${profileId}/discover`);
  }

  /**
   * Get leaderboard data
   * @param limit Maximum number of entries to return
   */
  async getLeaderboard(limit: number = 100): Promise<ApiResponse<any>> {
    return this.get<any>(`/gamification/leaderboard?limit=${limit}`);
  }

  /**
   * Get leaderboard data for a specific milestone
   * @param milestone Milestone level
   * @param limit Maximum number of entries to return
   */
  async getLeaderboardByMilestone(milestone: string, limit: number = 100): Promise<ApiResponse<any>> {
    return this.get<any>(`/gamification/leaderboard/milestone/${milestone}?limit=${limit}`);
  }

  /**
   * Get a profile's rank on the leaderboard
   * @param profileId Profile ID
   */
  async getProfileRank(profileId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/gamification/profiles/${profileId}/rank`);
  }

  /**
   * Get badges for a profile
   * @param profileId Profile ID
   */
  async getProfileBadges(profileId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/gamification/profiles/${profileId}/badges`);
  }

  /**
   * Get milestone for a profile
   * @param profileId Profile ID
   */
  async getProfileMilestone(profileId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/gamification/profiles/${profileId}/milestone`);
  }

  /**
   * Get recent activities for a profile
   * @param profileId Profile ID
   * @param limit Maximum number of activities to return
   */
  async getRecentActivities(profileId: string, limit: number = 20): Promise<ApiResponse<any>> {
    return this.get<any>(`/gamification/profiles/${profileId}/activities?limit=${limit}`);
  }

  /**
   * Get activity statistics for a profile
   * @param profileId Profile ID
   */
  async getActivityStatistics(profileId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/gamification/profiles/${profileId}/activities/statistics`);
  }

  /**
   * Track an activity for a profile
   * @param profileId Profile ID
   * @param activityType Type of activity
   * @param metadata Additional data about the activity
   */
  async trackActivity(profileId: string, activityType: string, metadata: any = {}): Promise<ApiResponse<any>> {
    return this.post<any>(`/gamification/profiles/${profileId}/activities`, {
      activityType,
      metadata
    });
  }
}
