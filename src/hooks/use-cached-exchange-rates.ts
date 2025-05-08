import { useQuery, useQueryClient } from '@tanstack/react-query';
import { exchangeRateApi, ExchangeRates } from '@/lib/api/exchange-rate-api';
import { useEffect, useState } from 'react';

// Cache keys for exchange rates
const EXCHANGE_RATES_CACHE_KEY = 'exchangeRates';
const EXCHANGE_RATES_TIMESTAMP_KEY = `${EXCHANGE_RATES_CACHE_KEY}_timestamp`;
const EXCHANGE_RATES_QUERY_KEY = 'exchangeRates';

// Cache duration in milliseconds
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const STALE_TIME = 24 * 60 * 60 * 1000; // 24 hours
const GC_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days

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
  // Get initial data from localStorage if available
  const getInitialData = (): { data: ExchangeRates; timestamp: number } | null => {
    if (typeof window === 'undefined') return null;

    try {
      const cachedRates = localStorage.getItem(EXCHANGE_RATES_CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(EXCHANGE_RATES_TIMESTAMP_KEY);

      if (!cachedRates || !cachedTimestamp) return null;

      const timestamp = parseInt(cachedTimestamp, 10);
      const now = Date.now();

      // If the cache is expired, don't use it
      if (now - timestamp > CACHE_DURATION) return null;

      return {
        data: JSON.parse(cachedRates),
        timestamp
      };
    } catch (error) {
      console.error('[CACHE] Error reading from localStorage:', error);
      return null;
    }
  };

  // Get initial data
  const initialData = getInitialData();

  // Set last fetch time if we have initial data
  useEffect(() => {
    if (initialData) {
      setLastFetchTime(initialData.timestamp);
    }
  }, []);

  // The main query
  const {
    data: exchangeRates,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: [EXCHANGE_RATES_QUERY_KEY, 'USD'],
    queryFn: async () => {
      console.log('[CACHE] Fetching fresh exchange rates from API');

      try {
        // Add a unique request ID for tracking
        const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        console.log(`[CACHE] Request ID: ${requestId}`);

        // Fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await Promise.race([
          exchangeRateApi.getLatestRates('USD'),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          )
        ]) as Awaited<ReturnType<typeof exchangeRateApi.getLatestRates>>;

        clearTimeout(timeoutId);

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch exchange rates');
        }

        // Store the rates in localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(EXCHANGE_RATES_CACHE_KEY, JSON.stringify(response.data));
            const timestamp = Date.now();
            localStorage.setItem(EXCHANGE_RATES_TIMESTAMP_KEY, timestamp.toString());
            setLastFetchTime(timestamp);
          } catch (storageError) {
            console.error('[CACHE] Error saving to localStorage:', storageError);
          }
        }

        console.log(`[CACHE] Successfully fetched exchange rates (Request ID: ${requestId})`);
        return response.data;
      } catch (error) {
        console.error('[CACHE] Error fetching exchange rates:', error);

        // If we have cached data, use it as fallback
        if (initialData) {
          console.log('[CACHE] Using cached data as fallback due to fetch error');
          return initialData.data;
        }

        throw error;
      }
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    initialData: initialData?.data,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
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
    console.log('[CACHE] Force refreshing exchange rates');

    try {
      // Clear the cache
      if (typeof window !== 'undefined') {
        localStorage.removeItem(EXCHANGE_RATES_CACHE_KEY);
        localStorage.removeItem(EXCHANGE_RATES_TIMESTAMP_KEY);
      }

      // Invalidate the query to force a refetch
      queryClient.invalidateQueries({ queryKey: [EXCHANGE_RATES_QUERY_KEY] });

      // Refetch the rates
      const result = await refetch();

      console.log('[CACHE] Force refresh completed successfully');
      return result;
    } catch (error) {
      console.error('[CACHE] Force refresh failed:', error);
      throw error;
    }
  };

  // Function to get the age of the cache in seconds
  const getCacheAge = (): number => {
    if (!lastFetchTime) return Infinity;
    return Math.floor((Date.now() - lastFetchTime) / 1000);
  };

  return {
    exchangeRates,
    isLoading,
    isError,
    error,
    isFetching,
    lastFetchTime,
    convertAmount,
    getExchangeRate,
    forceRefresh,
    getCacheAge,
    // Add a function to get the value of 1 MyPt in a specific currency
    getValuePerMyPt: (currency: string): number => {
      // Base value of MyPts in USD
      const baseValueInUsd = 0.024;

      // If the selected currency is USD, return the base value
      if (currency === 'USD') {
        return baseValueInUsd;
      }

      // If we have exchange rates
      if (exchangeRates) {
        // Get the exchange rate for the selected currency
        const rate = exchangeRates.rates[currency];

        // If we have a rate, calculate the value
        if (rate) {
          return baseValueInUsd * rate;
        }
      }

      // Fallback to direct conversion values
      const directConversions: Record<string, number> = {
        XAF: 13.61,
        EUR: 0.0208,
        GBP: 0.0179,
        NGN: 38.26,
        PKR: 6.74,
        USD: 0.024, // Base value in USD
      };

      return directConversions[currency] || baseValueInUsd;
    }
  };
}
