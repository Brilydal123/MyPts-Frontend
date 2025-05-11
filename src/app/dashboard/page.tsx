'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/shared/main-layout';
import { BalanceCard } from '@/components/shared/balance-card';
import { TransactionList } from '@/components/shared/transaction-list';
import { DashboardStats } from '@/components/dashboard/dashboard-stats-new';
import { ProfileInfo } from '@/components/profile/profile-info';
import { ReferralCard } from '@/components/referrals/ReferralCard';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useBalance, useMyPtsValue, useTransactions } from '@/hooks/use-mypts-data';
import { useReferralData } from '@/hooks/use-referral-data';
import { useCurrency } from '@/hooks/use-currency';

export default function DashboardPage() {
  // Use global currency state
  const { currency, setCurrency, isSwitchingCurrency } = useCurrency();

  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false,
  });

  // Use React Query hooks for data fetching
  const {
    data: balance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance
  } = useBalance(currency);

  const {
    data: value,
    isLoading: isValueLoading,
    refetch: refetchValue
  } = useMyPtsValue();

  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions
  } = useTransactions(pagination.limit, pagination.offset);

  const {
    referralCode,
    referralCount,
    isLoading: isReferralLoading,
    refetch: refetchReferral
  } = useReferralData();

  // Check if user is authenticated and debug admin role
  useEffect(() => {
    // Create a flag to track if the component is mounted
    let isMounted = true;

    // Function to check authentication
    const checkAuthentication = async () => {
      try {
        // Get tokens from multiple sources
        const accessToken = localStorage.getItem('accessToken');
        const nextAuthToken = localStorage.getItem('next-auth.session-token');
        const profileToken = localStorage.getItem('selectedProfileToken');

        // Get tokens from cookies
        const getCookieValue = (name: string) => {
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return match ? match[2] : null;
        };

        const accessTokenFromCookie = getCookieValue('accessToken') || getCookieValue('accesstoken');
        const refreshTokenFromCookie = getCookieValue('refreshToken') || getCookieValue('refreshtoken');

        // Debug admin role
        const isAdminFromStorage = localStorage.getItem('isAdmin') === 'true';
        const userRole = localStorage.getItem('userRole');

        // Log all available tokens for debugging
        console.log('Dashboard auth check:', {
          accessToken: !!accessToken,
          nextAuthToken: !!nextAuthToken,
          profileToken: !!profileToken,
          accessTokenFromCookie: !!accessTokenFromCookie,
          refreshTokenFromCookie: !!refreshTokenFromCookie,
          isAdminFromStorage,
          userRole
        });

        // If no tokens at all, redirect to login
        if (!accessToken && !nextAuthToken && !profileToken && !accessTokenFromCookie) {
          if (isMounted) {
            toast.error('Authentication required', {
              description: 'Please log in to continue',
            });

            // Store current location for redirect after login
            localStorage.setItem('redirectAfterLogin', window.location.pathname);

            // Redirect to login with cache busting
            window.location.href = `/login?nocache=${Date.now()}`;
          }
          return;
        }

        // Try to get session data
        try {
          const response = await fetch('/api/auth/session');

          // If response is not ok, try to refresh token first
          if (!response.ok) {
            console.log('Session fetch failed, attempting token refresh');

            // Try to refresh token
            const refreshResponse = await fetch('/api/auth/frontend-refresh', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            });

            // If refresh successful, try session again
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();

              if (refreshData.success && refreshData.tokens) {
                console.log('Token refresh successful, retrying session fetch');

                // Store new tokens
                localStorage.setItem('accessToken', refreshData.tokens.accessToken);
                if (refreshData.tokens.refreshToken) {
                  localStorage.setItem('refreshToken', refreshData.tokens.refreshToken);
                }

                // Try session again
                const retryResponse = await fetch('/api/auth/session');
                if (retryResponse.ok) {
                  const sessionData = await retryResponse.json();

                  // If user is admin, redirect to admin dashboard
                  if (
                    sessionData?.user?.role === 'admin' ||
                    sessionData?.user?.isAdmin === true ||
                    isAdminFromStorage ||
                    userRole === 'admin'
                  ) {
                    console.log('Admin user detected in dashboard, redirecting to admin dashboard');
                    if (isMounted) {
                      window.location.href = '/admin';
                    }
                  }
                }
              }
            }
          } else {
            // Session fetch successful
            const sessionData = await response.json();

            console.log('ADMIN ROLE DEBUG (dashboard):', {
              isAdminFromStorage,
              userRole,
              accessToken: !!accessToken,
              nextAuthToken: !!nextAuthToken,
              profileToken: !!profileToken,
              sessionData: sessionData ? {
                user: sessionData.user ? {
                  role: sessionData.user.role,
                  isAdmin: sessionData.user.isAdmin
                } : null
              } : null
            });

            // If user is admin, redirect to admin dashboard
            if (
              sessionData?.user?.role === 'admin' ||
              sessionData?.user?.isAdmin === true ||
              isAdminFromStorage ||
              userRole === 'admin'
            ) {
              console.log('Admin user detected in dashboard, redirecting to admin dashboard');
              if (isMounted) {
                window.location.href = '/admin';
              }
            }
          }
        } catch (error) {
          console.error('Error fetching session data:', error);
        }
      } catch (error) {
        console.error('Error in authentication check:', error);
      }
    };

    // Run the authentication check
    checkAuthentication();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);

  // Extract data from query results
  const transactions = transactionsData?.transactions || [];

  // Combined loading state
  const isLoading = isBalanceLoading || isValueLoading || isTransactionsLoading || isReferralLoading || isSwitchingCurrency;

  // Refresh all data
  const refreshAllData = () => {
    refetchBalance();
    refetchValue();
    refetchTransactions();
    refetchReferral();
    toast.success("Refreshing dashboard data...");
  };

  const handleCurrencyChange = (newCurrency: string) => {
    // Don't do anything if the currency is the same
    if (newCurrency === currency) return;

    // Show a toast message
    toast.info(`Switching to ${newCurrency}...`);

    // Update the global currency state
    setCurrency(newCurrency);
  };

  const handlePageChange = (offset: number) => {
    setPagination((prev) => ({ ...prev, offset }));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button
            onClick={() => refreshAllData()}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {balance && value ? (
          <DashboardStats
            balance={balance}
            value={value}
            isLoading={isLoading}
            currency={currency}
            referralsCount={referralCount}
            referralCode={referralCode}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        )}

        <div className="mb-6">
          <ProfileInfo editable={true} />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-1 lg:col-span-1">
            {balance ? (
              <BalanceCard
                balance={balance}
                isLoading={isLoading}
                onCurrencyChange={handleCurrencyChange}
                currency={currency}
              />
            ) : (
              <div className="h-64 bg-muted rounded-lg animate-pulse"></div>
            )}

            {/* Add the new Referral Card */}
            <div className="mt-6">
              <ReferralCard />
            </div>
          </div>

          <div className="space-y-4 md:col-span-1 lg:col-span-2">
            <h2 className="text-xl font-bold">Recent Transactions</h2>
            <TransactionList
              transactions={transactions}
              isLoading={isLoading}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
