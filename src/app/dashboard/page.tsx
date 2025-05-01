'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/shared/main-layout';
import { BalanceCard } from '@/components/shared/balance-card';
import { TransactionList } from '@/components/shared/transaction-list';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { ProfileInfo } from '@/components/profile/profile-info';
import { myPtsApi, myPtsValueApi } from '@/lib/api/mypts-api';
import { API_URL } from '../../lib/constants';
import { MyPtsBalance, MyPtsTransaction, MyPtsValue } from '@/types/mypts';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
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
  const [referralCount, setReferralCount] = useState<number>(0);
  const [referralCode, setReferralCode] = useState<string>('');

  useEffect(() => {
    // Check auth on mount
    const accessToken = localStorage.getItem('accessToken');
    const nextAuthToken = localStorage.getItem('next-auth.session-token');
    const profileToken = localStorage.getItem('selectedProfileToken');

    if (!accessToken && !nextAuthToken && !profileToken) {
      toast.error('Authentication required', {
        description: 'Please log in to continue',
      });
      // Force hard navigation
      window.location.href = '/login';
      return;
    }
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const profileToken = localStorage.getItem('selectedProfileToken');
      const nextAuthToken = localStorage.getItem('next-auth.session-token');
      const token = accessToken || profileToken || nextAuthToken;
      const profileId = localStorage.getItem('selectedProfileId');

      if (!token) {
        window.location.href = '/login';
        return;
      }

      if (!profileId) {
        toast.error('No profile selected');
        window.location.href = '/select-profile';
        return;
      }

      if (token) {
        myPtsApi.setToken(token);
        myPtsValueApi.setToken(token);
      }

      const [balanceResponse, valueResponse, transactionsResponse] = await Promise.all([
        myPtsApi.getBalance(currency),
        myPtsValueApi.getCurrentValue(),
        myPtsApi.getTransactions(pagination.limit, pagination.offset)
      ]);

      // Fetch referrals
      try {
        const meRes = await fetch(`${API_URL}/users/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });
        const meJson = await meRes.json();
        if (meRes.ok && meJson.success && meJson.user) {
          setReferralCount(meJson.user.referralRewards?.totalReferrals ?? meJson.user.referrals?.length ?? 0);
          setReferralCode(meJson.user.referralCode ?? '');
        }
      } catch (e) {
        console.warn('Error fetching referrals:', e);
      }

      if (balanceResponse.success && balanceResponse.data) {
        setBalance(balanceResponse.data);
      } else {
        toast.error('Failed to fetch balance');
      }

      if (valueResponse.success && valueResponse.data) {
        setValue(valueResponse.data);
      } else {
        toast.error('Failed to fetch value data');
      }

      if (transactionsResponse.success && transactionsResponse.data) {
        setTransactions(transactionsResponse.data.transactions);
        setPagination(transactionsResponse.data.pagination);
      } else {
        toast.error('Failed to fetch transactions');
      }

    } catch (error) {
      toast.error('Failed to fetch dashboard data');
      if (error instanceof Response && error.status === 401) {
        window.location.href = '/login';
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currency, pagination.offset, pagination.limit]);

  const handleCurrencyChange = (newCurrency: string) => {
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
          <button
            onClick={() => fetchData()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
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
