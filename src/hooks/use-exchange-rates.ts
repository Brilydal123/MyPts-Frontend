import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exchangeRateApi, ExchangeRates, CurrencyConversion } from '@/lib/api/exchange-rate-api';

/**
 * Hook for fetching the latest exchange rates
 * @param baseCurrency The base currency code (e.g., 'USD', 'EUR')
 * @returns Query result with exchange rates data
 */
export function useExchangeRates(baseCurrency: string = 'USD') {
  return useQuery({
    queryKey: ['exchangeRates', baseCurrency],
    queryFn: async () => {
      const response = await exchangeRateApi.getLatestRates(baseCurrency);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch exchange rates');
      }
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook for converting between currencies
 * @param fromCurrency The source currency code
 * @param toCurrency The target currency code
 * @returns Query result with conversion data
 */
export function useCurrencyConversion(fromCurrency: string, toCurrency: string) {
  return useQuery({
    queryKey: ['currencyConversion', fromCurrency, toCurrency],
    queryFn: async () => {
      const response = await exchangeRateApi.convertCurrency(fromCurrency, toCurrency);
      if (!response.success) {
        throw new Error(response.message || 'Failed to convert currency');
      }
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook for converting a specific amount between currencies
 * @param fromCurrency The source currency code
 * @param toCurrency The target currency code
 * @param amount The amount to convert
 * @returns Query result with conversion data including the converted amount
 */
export function useAmountConversion(fromCurrency: string, toCurrency: string, amount: number) {
  return useQuery({
    queryKey: ['amountConversion', fromCurrency, toCurrency, amount],
    queryFn: async () => {
      const response = await exchangeRateApi.convertCurrency(fromCurrency, toCurrency, amount);
      if (!response.success) {
        throw new Error(response.message || 'Failed to convert amount');
      }
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    // Only run the query if amount is valid
    enabled: !isNaN(amount) && amount > 0,
  });
}

/**
 * Utility function to convert an amount using cached exchange rates
 * This is useful when you already have the exchange rates and don't want to make an API call
 * 
 * @param amount The amount to convert
 * @param fromCurrency The source currency code
 * @param toCurrency The target currency code
 * @param exchangeRates The exchange rates object
 * @returns The converted amount or null if conversion is not possible
 */
export function convertAmountWithRates(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: ExchangeRates
): number | null {
  if (isNaN(amount) || amount <= 0) {
    return null;
  }
  
  // If the currencies are the same, return the original amount
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  // If the base currency is the source currency, direct conversion
  if (fromCurrency === exchangeRates.baseCurrency) {
    const rate = exchangeRates.rates[toCurrency];
    if (!rate) return null;
    return amount * rate;
  }
  
  // If the base currency is the target currency, inverse conversion
  if (toCurrency === exchangeRates.baseCurrency) {
    const rate = exchangeRates.rates[fromCurrency];
    if (!rate) return null;
    return amount / rate;
  }
  
  // Cross-currency conversion via the base currency
  const fromRate = exchangeRates.rates[fromCurrency];
  const toRate = exchangeRates.rates[toCurrency];
  
  if (!fromRate || !toRate) return null;
  
  // Convert to base currency first, then to target currency
  const amountInBaseCurrency = amount / fromRate;
  return amountInBaseCurrency * toRate;
}
