import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

// Key for storing the selected currency in localStorage
const CURRENCY_STORAGE_KEY = 'selectedCurrency';

// List of supported currencies
export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'XAF', 'NGN', 'PKR'
];

/**
 * Hook for managing the global currency state
 * This hook provides a way to get and set the currency across the application
 * It prevents unnecessary API calls when switching currencies by using a local state
 */
export function useCurrency(): {
  currency: string;
  setCurrency: (newCurrency: string) => void;
  isSwitchingCurrency: boolean;
} {
  const queryClient = useQueryClient();
  const [isSwitchingCurrency, setIsSwitchingCurrency] = useState(false);

  // Get the currency from the query cache or localStorage
  const { data: currencyData = 'USD' } = useQuery<string>({
    queryKey: ['globalCurrency'],
    queryFn: () => {
      // Try to get the currency from localStorage first
      if (typeof window !== 'undefined') {
        const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
        if (storedCurrency && SUPPORTED_CURRENCIES.includes(storedCurrency)) {
          return storedCurrency;
        }
      }
      return 'USD'; // Default to USD if no currency is stored or invalid
    },
    // Keep the currency in cache indefinitely
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Ensure currency is always a string and is supported
  const currency = typeof currencyData === 'string' && SUPPORTED_CURRENCIES.includes(currencyData)
    ? currencyData
    : 'USD';

  // Mutation to update the currency
  const { mutate: setCurrency, isPending } = useMutation({
    mutationFn: async (newCurrency: string) => {
      // Validate the currency
      if (!SUPPORTED_CURRENCIES.includes(newCurrency)) {
        throw new Error(`Unsupported currency: ${newCurrency}`);
      }

      // Store the currency in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
      }

      // Set switching state to true
      setIsSwitchingCurrency(true);

      return newCurrency;
    },
    onSuccess: (newCurrency) => {
      // Update the query cache with the new currency
      queryClient.setQueryData(['globalCurrency'], newCurrency);

      // Invalidate only the balance query since it depends on the currency
      // We don't need to refetch exchange rates since we're using cached rates
      queryClient.invalidateQueries({ queryKey: ['balance', currency] });

      // After a short delay, set switching state to false
      // This prevents UI flicker and gives time for the balance to update
      setTimeout(() => {
        setIsSwitchingCurrency(false);
      }, 500);
    },
    onError: (error) => {
      console.error('Error setting currency:', error);
      setIsSwitchingCurrency(false);
    }
  });

  // Update switching state based on mutation state
  useEffect(() => {
    setIsSwitchingCurrency(isPending);
  }, [isPending]);

  return { currency, setCurrency, isSwitchingCurrency };
}
