import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Key for storing the selected currency in localStorage
const CURRENCY_STORAGE_KEY = 'selectedCurrency';

/**
 * Hook for managing the global currency state
 * This hook provides a way to get and set the currency across the application
 */
export function useCurrency(): { currency: string; setCurrency: (newCurrency: string) => void } {
  const queryClient = useQueryClient();

  // Get the currency from the query cache or localStorage
  const { data: currencyData = 'USD' } = useQuery<string>({
    queryKey: ['globalCurrency'],
    queryFn: () => {
      // Try to get the currency from localStorage first
      if (typeof window !== 'undefined') {
        const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
        if (storedCurrency) {
          return storedCurrency;
        }
      }
      return 'USD'; // Default to USD if no currency is stored
    },
    // Keep the currency in cache indefinitely
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Ensure currency is always a string
  const currency = typeof currencyData === 'string' ? currencyData : 'USD';

  // Mutation to update the currency
  const { mutate: setCurrency } = useMutation({
    mutationFn: async (newCurrency: string) => {
      // Store the currency in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
      }
      return newCurrency;
    },
    onSuccess: (newCurrency) => {
      // Update the query cache with the new currency
      queryClient.setQueryData(['globalCurrency'], newCurrency);

      // Invalidate any queries that depend on the currency
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });

  return { currency, setCurrency };
}
