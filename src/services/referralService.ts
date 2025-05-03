import { apiClient } from '@/lib/api/api-client';

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  earnedPoints: number;
  pendingPoints: number;
  currentMilestoneLevel: number;
  referredProfiles: {
    profile: {
      _id: string;
      name: string;
      profileImage?: string;
    };
    date: string;
    hasReachedThreshold: boolean;
    thresholdReachedDate?: string;
  }[];
  referredBy: {
    _id: string;
    name: string;
    profileImage?: string;
  } | null;
}

export interface ReferralTreeNode {
  profileId: string;
  name: string;
  profileImage?: string;
  successfulReferrals: number;
  totalReferrals: number;
  milestoneLevel: number;
  children: ReferralTreeNode[];
}

export interface LeaderboardEntry {
  profile: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  milestoneLevel: number;
  earnedPoints: number;
}

export interface ShareableLinkResponse {
  referralCode: string;
  shareableLink: string;
}

export const ReferralService = {
  /**
   * Get referral statistics for the current profile
   */
  async getReferralStats(): Promise<ReferralStats> {
    try {
      const response = await apiClient.get('/referrals');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      // If we get a 404 or other error, try to initialize the referral code
      await this.initializeReferralCode();
      // Try again after initialization
      const retryResponse = await apiClient.get('/referrals');
      return retryResponse.data.data;
    }
  },

  /**
   * Initialize referral code for the current profile
   */
  async initializeReferralCode(): Promise<{ referralCode: string }> {
    try {
      // Ensure we have the profile token in the request
      const profileToken = localStorage.getItem('selectedProfileToken');
      const profileId = localStorage.getItem('selectedProfileId');

      const headers: Record<string, string> = {};
      if (profileToken) {
        headers['X-Profile-Token'] = profileToken;
      }

      const params: Record<string, string> = {};
      if (profileId) {
        params.profileId = profileId;
      }

      const response = await apiClient.post('/referrals/initialize', {}, {
        headers,
        params
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Error initializing referral code:', error);
      // If we get a 401, we might need to refresh the page or redirect to login
      if (error.response?.status === 401) {
        // Try to get a fresh token
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          console.warn('No access token found, user may need to log in again');
        }
      }
      throw error;
    }
  },

  /**
   * Get the referral tree for the current profile
   * @param depth The depth of the tree to retrieve (default: 2)
   */
  async getReferralTree(depth: number = 2): Promise<ReferralTreeNode> {
    const response = await apiClient.get(`/referrals/tree?depth=${depth}`);
    return response.data.data;
  },

  /**
   * Validate a referral code
   * @param referralCode The referral code to validate
   */
  async validateReferralCode(referralCode: string): Promise<{ valid: boolean; referringProfileId?: string }> {
    const response = await apiClient.post('/referrals/validate', { referralCode });
    return response.data.data;
  },

  /**
   * Get the referral leaderboard
   * @param limit The number of entries to retrieve (default: 10)
   */
  async getLeaderboard(limit: number = 10): Promise<{
    leaderboard: LeaderboardEntry[];
    userPosition?: LeaderboardEntry & { rank: number };
  }> {
    const response = await apiClient.get(`/referrals/leaderboard?limit=${limit}`);
    return {
      leaderboard: response.data.data,
      userPosition: response.data.userPosition
    };
  },

  /**
   * Get a shareable referral link
   */
  async getShareableLink(): Promise<ShareableLinkResponse> {
    const response = await apiClient.get('/referrals/share-link');
    return response.data.data;
  }
};

export default ReferralService;
