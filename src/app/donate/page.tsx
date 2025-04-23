'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/shared/main-layout';
import { BalanceCard } from '@/components/shared/balance-card';
import { DonateForm } from '@/components/dashboard/donate-form';
import { myPtsApi } from '@/lib/api/mypts-api';
import { MyPtsBalance } from '@/types/mypts';
import { toast } from 'sonner';

export default function DonatePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<MyPtsBalance | null>(null);
  const [currency, setCurrency] = useState('USD');

  const fetchBalance = async () => {
    setIsLoading(true);
    try {
      const response = await myPtsApi.getBalance(currency);
      if (response.success && response.data) {
        setBalance(response.data);
      } else {
        toast.error('Failed to fetch balance', {
          description: response.message || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error('Failed to fetch balance', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [currency]);

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Donate MyPts</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            {balance ? (
              <BalanceCard 
                balance={balance} 
                isLoading={isLoading} 
                onCurrencyChange={handleCurrencyChange} 
              />
            ) : (
              <div className="h-64 bg-muted rounded-lg animate-pulse"></div>
            )}
          </div>
          
          <div>
            {balance && <DonateForm balance={balance} onSuccess={fetchBalance} />}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
