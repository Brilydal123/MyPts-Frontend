import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import ReferralService, { 
  ReferralStats, 
  ReferralTreeNode, 
  LeaderboardEntry, 
  ShareableLinkResponse 
} from '@/services/referralService';

// Define query keys for better organization
export const referralKeys = {
  all: ['referrals'] as const,
  stats: () => [...referralKeys.all, 'stats'] as const,
  tree: (depth: number) => [...referralKeys.all, 'tree', depth] as const,
  leaderboard: (limit: number) => [...referralKeys.all, 'leaderboard', limit] as const,
  shareableLink: () => [...referralKeys.all, 'shareableLink'] as const,
};

/**
 * Hook to fetch referral statistics
 */
export function useReferralStats() {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: referralKeys.stats(),
    queryFn: async () => {
      try {
        return await ReferralService.getReferralStats();
      } catch (error) {
        console.error('Error fetching referral stats:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to initialize referral code
 */
export function useInitializeReferralCode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      try {
        return await ReferralService.initializeReferralCode();
      } catch (error) {
        console.error('Error initializing referral code:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success('Referral code initialized successfully');
      
      // Update the referral stats in the cache
      queryClient.invalidateQueries({ queryKey: referralKeys.stats() });
    },
    onError: (error: any) => {
      // If this is an auth error, we might need to redirect
      if (error?.response?.status === 401) {
        toast.error('Authentication error', {
          description: 'Please log in again to continue',
        });
      } else {
        toast.error('Failed to initialize referral code', {
          description: error?.message || 'An unexpected error occurred',
        });
      }
    },
  });
}

/**
 * Hook to fetch referral tree
 */
export function useReferralTree(depth: number = 2) {
  return useQuery({
    queryKey: referralKeys.tree(depth),
    queryFn: async () => {
      try {
        return await ReferralService.getReferralTree(depth);
      } catch (error) {
        console.error('Error fetching referral tree:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch referral leaderboard
 */
export function useReferralLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: referralKeys.leaderboard(limit),
    queryFn: async () => {
      try {
        return await ReferralService.getLeaderboard(limit);
      } catch (error) {
        console.error('Error fetching referral leaderboard:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch shareable referral link
 */
export function useShareableReferralLink() {
  return useQuery({
    queryKey: referralKeys.shareableLink(),
    queryFn: async () => {
      try {
        return await ReferralService.getShareableLink();
      } catch (error) {
        console.error('Error fetching shareable referral link:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to validate referral code
 */
export function useValidateReferralCode() {
  return useMutation({
    mutationFn: async (referralCode: string) => {
      try {
        return await ReferralService.validateReferralCode(referralCode);
      } catch (error) {
        console.error('Error validating referral code:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.valid) {
        toast.success('Referral code is valid');
      } else {
        toast.error('Invalid referral code');
      }
    },
    onError: (error: any) => {
      toast.error('Failed to validate referral code', {
        description: error?.message || 'An unexpected error occurred',
      });
    },
  });
}

/**
 * Helper function to calculate milestone progress
 */
export function getMilestoneProgress(
  currentLevel: number,
  successfulReferrals: number
): number {
  // Level 0 to 1: Need 3 successful referrals
  if (currentLevel === 0) {
    return Math.min(100, (successfulReferrals / 3) * 100);
  }

  // Level 1 to 2: Need 9 successful referrals (3 referrals each from 3 people)
  if (currentLevel === 1) {
    return Math.min(100, (successfulReferrals / 9) * 100);
  }

  // Higher levels would follow similar pattern
  return 0;
}

/**
 * Helper function to get next milestone requirement
 */
export function getNextMilestoneRequirement(currentLevel: number): string {
  if (currentLevel === 0) {
    return "Refer 3 profiles who each reach 1000+ MyPts";
  }

  if (currentLevel === 1) {
    return "Each of your 3 referred profiles must refer 3 more profiles who reach 1000+ MyPts";
  }

  if (currentLevel === 2) {
    return "Continue building your referral network to reach Level 3";
  }

  return "You've reached the maximum milestone level!";
}
