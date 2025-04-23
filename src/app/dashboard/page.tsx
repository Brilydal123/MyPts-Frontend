'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// No longer using useSession
import { MainLayout } from '@/components/shared/main-layout';
import { BalanceCard } from '@/components/shared/balance-card';
import { TransactionList } from '@/components/shared/transaction-list';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { ProfileInfo } from '@/components/profile/profile-info';
import { myPtsApi, myPtsValueApi } from '@/lib/api/mypts-api';
import { MyPtsBalance, MyPtsTransaction, MyPtsValue } from '@/types/mypts';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  // No longer using session
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [balance, setBalance] = useState<MyPtsBalance | null>(null);
  const [value, setValue] = useState<MyPtsValue | null>(null);
  const [transactions, setTransactions] = useState<MyPtsTransaction[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false,
  });
  const [currency, setCurrency] = useState('USD');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Check if we have a profile ID
      const profileId = typeof window !== 'undefined' ? localStorage.getItem('selectedProfileId') : null;

      // Check if we're in a redirect loop
      const redirectAttempts = parseInt(localStorage.getItem('redirectAttempts') || '0');

      if (!profileId) {
        console.warn('No profile ID found in localStorage');

        // If we've already tried redirecting multiple times, don't redirect again
        if (redirectAttempts > 2) {
          console.warn('Multiple redirect attempts detected, staying on dashboard and trying to continue');
          toast.error('Profile selection issue', {
            description: 'Having trouble selecting a profile. Please try refreshing the page.',
          });
          // Try to continue anyway with a dummy profile ID
          // This will likely fail API calls, but at least we won't be in a redirect loop
          localStorage.setItem('redirectAttempts', '0');
          return;
        }

        console.warn('Redirecting to profile selection');
        toast.error('No profile selected', {
          description: 'Please select a profile to continue',
        });

        // Increment redirect counter
        localStorage.setItem('redirectAttempts', (redirectAttempts + 1).toString());

        router.push('/select-profile');
        return;
      }

      // Reset redirect counter since we have a profile ID
      localStorage.setItem('redirectAttempts', '0');
      console.log('Using profile ID from localStorage:', profileId);

      // Fetch all data in parallel
      const [balanceResponse, valueResponse, transactionsResponse] = await Promise.all([
        myPtsApi.getBalance(currency),
        myPtsValueApi.getCurrentValue(),
        myPtsApi.getTransactions(pagination.limit, pagination.offset)
      ]);

      // Process balance response
      if (balanceResponse.success && balanceResponse.data) {
        setBalance(balanceResponse.data);
      } else {
        console.warn('Failed to fetch balance:', balanceResponse);
        toast.error('Failed to fetch balance', {
          description: balanceResponse.message || 'Please check your connection and try again',
        });
        // Don't redirect, just show the error
      }

      // Process value response
      if (valueResponse.success && valueResponse.data) {
        setValue(valueResponse.data);
      } else {
        console.warn('Failed to fetch value data:', valueResponse);
        toast.error('Failed to fetch value data', {
          description: valueResponse.message || 'Please check your connection and try again',
        });
      }

      // Process transactions response
      if (transactionsResponse.success && transactionsResponse.data) {
        setTransactions(transactionsResponse.data.transactions);
        setPagination(transactionsResponse.data.pagination);
      } else {
        console.warn('Failed to fetch transactions:', transactionsResponse);
        toast.error('Failed to fetch transactions', {
          description: transactionsResponse.message || 'Please check your connection and try again',
        });
      }

      // Make sure loading is set to false even if some requests fail
      setIsLoading(false);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);

      // Show a more detailed error message
      toast.error('Failed to fetch dashboard data', {
        description: error instanceof Error
          ? `${error.message}. Please check your connection and try again.`
          : 'Network error. Please check your connection and try again.',
        action: {
          label: 'Retry',
          onClick: () => fetchData()
        },
        duration: 10000, // Show for 10 seconds
      });

      // Reset loading state on error
      setIsLoading(false);
    }
  };

  // Effect for initial profile check and authentication
  useEffect(() => {
    // Check if we have a profile before fetching data
    const checkProfileAndFetchData = () => {
      try {
        // Check if user is admin
        const isAdmin = typeof window !== 'undefined' && localStorage?.getItem('isAdmin') === 'true';
        console.log('Dashboard - isAdmin check:', isAdmin);

        // Check for profile information in localStorage
        const storedProfileId = typeof window !== 'undefined' ? localStorage.getItem('selectedProfileId') : null;
        const storedProfileToken = typeof window !== 'undefined' ? localStorage.getItem('selectedProfileToken') : null;

        console.log('Dashboard - Profile check:', {
          hasProfileId: !!storedProfileId,
          hasProfileToken: !!storedProfileToken,
          profileId: storedProfileId
        });

        // Add a flag to localStorage to prevent redirect loops
        const redirectAttempts = parseInt(localStorage.getItem('redirectAttempts') || '0');
        console.log('Redirect attempts:', redirectAttempts);

        if (redirectAttempts > 3) {
          console.warn('Too many redirect attempts, staying on dashboard');
          localStorage.setItem('redirectAttempts', '0');
          setIsAuthenticated(true);
          return;
        }

        if (storedProfileId) {
          console.log('Found profile ID in localStorage:', { profileId: storedProfileId });

          // Set authenticated and fetch data
          setIsAuthenticated(true);
          localStorage.setItem('redirectAttempts', '0'); // Reset counter on success
          fetchData();
        } else if (isAdmin) {
          // If admin but no profile, redirect to admin dashboard
          console.log('Admin user with no profile, redirecting to admin dashboard');
          router.push('/admin');
        } else {
          console.warn('No profile selected, redirecting to profile selection');
          setIsAuthenticated(false);

          // Increment redirect counter
          localStorage.setItem('redirectAttempts', (redirectAttempts + 1).toString());

          // Add a delay before redirecting to avoid potential redirect loops
          setTimeout(() => {
            router.push('/select-profile');
          }, 1500);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        toast.error('Authentication error', {
          description: 'Please try logging in again',
        });
        router.push('/login');
      }
    };

    // Call the function to check profile and fetch data
    checkProfileAndFetchData();
  }, [router]);

  // Separate effect for currency and pagination changes
  useEffect(() => {
    // Only fetch if we're authenticated
    if (isAuthenticated) {
      // Use a timeout to debounce the API calls
      const timer = setTimeout(() => {
        fetchData();
      }, 300);

      // Clean up the timeout
      return () => clearTimeout(timer);
    }
  }, [currency, pagination.offset, pagination.limit, isAuthenticated]);

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    // The useEffect will handle fetching data
  };

  const handlePageChange = (offset: number) => {
    setPagination((prev) => ({ ...prev, offset }));
    // The useEffect will handle fetching data
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          {isAuthenticated && (
            <button
              onClick={() => fetchData()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>

        {balance && value ? (
          <DashboardStats balance={balance} value={value} isLoading={isLoading} currency={currency} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        )}

        {/* Profile Information */}
        <div className="mb-6">
          <ProfileInfo />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
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
          </div>

          <div className="space-y-4">
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
