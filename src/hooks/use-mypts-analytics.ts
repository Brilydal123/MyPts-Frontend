import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/constants';

// Types
interface MyPtsAnalytics {
  currentBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  transactions: any[];
  logins: { date: string; count: number }[];
}

/**
 * Hook to fetch MyPts analytics data
 */
export function useMyPtsAnalytics(days = 30) {
  const { data: session } = useSession();

  const profileId = session?.profileId;
  const accessToken = session?.accessToken;

  return useQuery({
    queryKey: ['mypts-analytics', profileId, days],
    queryFn: async (): Promise<MyPtsAnalytics> => {
      if (!profileId || !accessToken) {
        throw new Error('Authentication required');
      }

      try {
        // Fetch transaction analytics
        const transactionResponse = await fetch(`${API_URL}/analytics/transactions/${profileId}?days=${days}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!transactionResponse.ok) {
          const error = await transactionResponse.json();
          throw new Error(error.message || 'Failed to fetch transaction analytics');
        }

        const transactionData = await transactionResponse.json();

        // Fetch login analytics
        const loginResponse = await fetch(`${API_URL}/analytics/login-activity/${profileId}?days=${days}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!loginResponse.ok) {
          // Don't throw here, just log the error and continue with empty login data
          console.error('Failed to fetch login analytics');
          return {
            ...transactionData.data,
            logins: []
          };
        }

        const loginData = await loginResponse.json();

        // Combine the data
        return {
          ...transactionData.data,
          logins: loginData.data?.loginActivity || []
        };
      } catch (error) {
        console.error('Error fetching MyPts analytics:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to fetch analytics data');
        throw error;
      }
    },
    enabled: !!profileId && !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to refresh MyPts analytics data
 */
export function useRefreshMyPtsAnalytics() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const profileId = session?.profileId;

  return {
    refetch: async () => {
      if (!profileId) {
        throw new Error('Profile ID not available');
      }

      // Invalidate and refetch the analytics queries
      await queryClient.invalidateQueries({
        queryKey: ['mypts-analytics', profileId]
      });

      return queryClient.refetchQueries({
        queryKey: ['mypts-analytics', profileId]
      });
    },
    isLoading: queryClient.isFetching({ queryKey: ['mypts-analytics', profileId] }) > 0
  };
}
