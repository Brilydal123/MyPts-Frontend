import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myPtsApi, myPtsValueApi } from '@/lib/api/mypts-api';
import { profileApi } from '@/lib/api/profile-api';
import { notificationApi } from '@/lib/api/notification-api';
import { MyPtsBalance, MyPtsTransaction, MyPtsValue, TransactionType } from '@/types/mypts';
import { toast } from 'sonner';
import { API_URL } from '@/lib/constants';

// Hook for fetching user balance
export function useBalance(currency: string = 'USD') {
  return useQuery({
    queryKey: ['balance', currency],
    queryFn: async () => {
      // Fetch balance with the requested currency
      const response = await myPtsApi.getBalance(currency);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch balance');
      }

      // Log the currency being used
      console.log(`[BALANCE] Fetched balance in ${currency}`);

      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Add a small delay to prevent rapid refetching when switching currencies
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching MyPts value
export function useMyPtsValue() {
  return useQuery({
    queryKey: ['myPtsValue'],
    queryFn: async () => {
      const response = await myPtsValueApi.getCurrentValue();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch value data');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for fetching transactions
export function useTransactions(limit: number = 10, offset: number = 0) {
  return useQuery({
    queryKey: ['transactions', limit, offset],
    queryFn: async () => {
      const response = await myPtsApi.getTransactions(limit, offset);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch transactions');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook for fetching transactions by type
export function useTransactionsByType(type: TransactionType | null, limit: number = 10, offset: number = 0) {
  return useQuery({
    queryKey: ['transactions', 'byType', type, limit, offset],
    queryFn: async () => {
      if (!type) {
        const response = await myPtsApi.getTransactions(limit, offset);
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch transactions');
        }
        return response.data;
      }

      const response = await myPtsApi.getTransactionsByType(type, limit, offset);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch transactions by type');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!type, // Only run the query if type is provided
  });
}

// Hook for fetching a single transaction
export function useTransaction(transactionId: string) {
  return useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: async () => {
      const response = await myPtsApi.getTransaction(transactionId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch transaction');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!transactionId,
  });
}

// Hook for fetching referral data
export function useReferralData() {
  return useQuery({
    queryKey: ['referralData'],
    queryFn: async () => {
      const accessToken = localStorage.getItem('accessToken');
      const profileToken = localStorage.getItem('selectedProfileToken');
      const nextAuthToken = localStorage.getItem('next-auth.session-token');
      const token = accessToken || profileToken || nextAuthToken;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch referral data');
      }

      return {
        referralCount: data.user.referralRewards?.totalReferrals ?? data.user.referrals?.length ?? 0,
        referralCode: data.user.referralCode ?? '',
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Mutation hook for buying MyPts
export function useBuyMyPts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amount,
      paymentMethod,
      paymentMethodId
    }: {
      amount: number;
      paymentMethod: string;
      paymentMethodId?: string;
    }) => {
      const response = await myPtsApi.buyMyPts(amount, paymentMethod, paymentMethodId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to buy MyPts');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

// Mutation hook for selling MyPts
export function useSellMyPts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amount,
      paymentMethod,
      accountDetails
    }: {
      amount: number;
      paymentMethod: string;
      accountDetails: any;
    }) => {
      const response = await myPtsApi.sellMyPts(amount, paymentMethod, accountDetails);
      if (!response.success) {
        throw new Error(response.message || 'Failed to sell MyPts');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

// Hook for fetching profile information
export function useProfileInfo(profileId?: string) {
  return useQuery({
    queryKey: ['profileInfo', profileId],
    queryFn: async () => {
      try {
        const id = profileId || (typeof window !== 'undefined' ? localStorage.getItem('selectedProfileId') : null);

        if (!id) {
          throw new Error('No profile selected');
        }

        const profileToken = typeof window !== 'undefined' ? localStorage.getItem('selectedProfileToken') : null;
        const response = await profileApi.getProfileDetails(id, profileToken || undefined);

        if (!response.success) {
          throw new Error(response.message || 'Failed to load profile');
        }

        return response.data;
      } catch (err) {
        console.error('Error fetching profile:', err);
        throw new Error('An error occurred while fetching profile information');
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for fetching user notifications
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const response = await notificationApi.getUserNotifications();
        return response;
      } catch (error) {
        console.error('Error fetching notifications:', error);
        throw new Error('Failed to fetch notifications');
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Hook for fetching unread notification count
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['unreadNotificationCount'],
    queryFn: async () => {
      try {
        const response = await notificationApi.getUnreadNotificationsCount();
        return response.data.count;
      } catch (error) {
        console.error('Error fetching unread notification count:', error);
        throw new Error('Failed to fetch unread notification count');
      }
    },
    staleTime: 1 * 60 * 10000, // 10 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

// Hook for fetching notification preferences
export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      try {
        const response = await notificationApi.getUserNotificationPreferences();
        return response;
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
        throw new Error('Failed to fetch notification preferences');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation hook for updating notification preferences
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: any) => {
      const response = await notificationApi.updateUserNotificationPreferences(preferences);
      return response;
    },
    onSuccess: () => {
      toast.success('Notification preferences updated');
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
    },
    onError: (error) => {
      console.error('Error updating notification preferences:', error);
      toast.error('Failed to update notification preferences');
    },
  });
}

// Mutation hook for marking a notification as read
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await notificationApi.markNotificationAsRead(notificationId);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
  });
}

// Mutation hook for marking all notifications as read
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await notificationApi.markAllNotificationsAsRead();
      return response;
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
    onError: () => {
      toast.error('Failed to mark all notifications as read');
    },
  });
}

// Mutation hook for deleting a notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await notificationApi.deleteNotification(notificationId);
      return response;
    },
    onSuccess: () => {
      toast.success('Notification deleted');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
    onError: () => {
      toast.error('Failed to delete notification');
    },
  });
}
