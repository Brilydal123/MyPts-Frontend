import { useQuery, useQueryClient } from '@tanstack/react-query';
import { exchangeRateApi, ExchangeRates } from '@/lib/api/exchange-rate-api';
import { useEffect, useState } from 'react';

// Cache key for exchange rates
const EXCHANGE_RATES_CACHE_KEY = 'exchangeRates';

/**
 * Hook for managing cached exchange rates
 * This hook provides a way to get exchange rates without making excessive API calls
 * It maintains a cache of exchange rates and only fetches new rates when necessary
 */
export function useCachedExchangeRates() {
  const queryClient = useQueryClient();
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  // Fetch exchange rates with USD as the base currency
  // This will be our master set of rates that we can use for all conversions
  const {
    data: exchangeRates,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: [EXCHANGE_RATES_CACHE_KEY, 'USD'],
    queryFn: async () => {
      // Check if we have cached rates in localStorage
      if (typeof window !== 'undefined') {
        const cachedRates = localStorage.getItem(EXCHANGE_RATES_CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(`${EXCHANGE_RATES_CACHE_KEY}_timestamp`);
        
        if (cachedRates && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();
          
          // If the cache is less than 24 hours old, use it
          if (now - timestamp < 24 * 60 * 60 * 1000) {
            console.log('[CACHE] Using cached exchange rates from localStorage');
            setLastFetchTime(timestamp);
            return JSON.parse(cachedRates);
          }
        }
      }
      
      // If no cache or cache is old, fetch fresh rates
      console.log('[CACHE] Fetching fresh exchange rates from API');
      const response = await exchangeRateApi.getLatestRates('USD');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch exchange rates');
      }
      
      // Store the rates in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(EXCHANGE_RATES_CACHE_KEY, JSON.stringify(response.data));
        const timestamp = Date.now();
        localStorage.setItem(`${EXCHANGE_RATES_CACHE_KEY}_timestamp`, timestamp.toString());
        setLastFetchTime(timestamp);
      }
      
      return response.data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours to conserve API quota
    gcTime: 7 * 24 * 60 * 60 * 1000, // Keep in cache for 7 days
  });
  
  // Function to convert an amount from one currency to another using cached rates
  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string): number | null => {
    if (!exchangeRates || isNaN(amount) || amount <= 0) {
      return null;
    }
    
    // If the currencies are the same, return the original amount
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    // If USD is involved, we can do direct conversion
    if (fromCurrency === 'USD') {
      const rate = exchangeRates.rates[toCurrency];
      if (!rate) return null;
      return amount * rate;
    }
    
    if (toCurrency === 'USD') {
      const rate = exchangeRates.rates[fromCurrency];
      if (!rate) return null;
      return amount / rate;
    }
    
    // Cross-currency conversion via USD
    const fromRate = exchangeRates.rates[fromCurrency];
    const toRate = exchangeRates.rates[toCurrency];
    
    if (!fromRate || !toRate) return null;
    
    // Convert to USD first, then to target currency
    const amountInUsd = amount / fromRate;
    return amountInUsd * toRate;
  };
  
  // Function to get the exchange rate between two currencies
  const getExchangeRate = (fromCurrency: string, toCurrency: string): number | null => {
    return convertAmount(1, fromCurrency, toCurrency);
  };
  
  // Function to force refresh the exchange rates
  const forceRefresh = async () => {
    // Clear the cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem(EXCHANGE_RATES_CACHE_KEY);
      localStorage.removeItem(`${EXCHANGE_RATES_CACHE_KEY}_timestamp`);
    }
    
    // Invalidate the query to force a refetch
    queryClient.invalidateQueries({ queryKey: [EXCHANGE_RATES_CACHE_KEY] });
    
    // Refetch the rates
    return refetch();
  };
  
  return {
    exchangeRates,
    isLoading,
    isError,
    error,
    lastFetchTime,
    convertAmount,
    getExchangeRate,
    forceRefresh
  };
}
