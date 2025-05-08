import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exchangeRateApi, ExchangeRates, CurrencyConversion } from '@/lib/api/exchange-rate-api';
import { useCachedExchangeRates } from './use-cached-exchange-rates';
import { useState, useEffect } from 'react';

/**
 * Hook for fetching the latest exchange rates
 * This is a wrapper around useCachedExchangeRates that provides a simpler interface
 * and ensures we're not making duplicate API calls
 *
 * @param baseCurrency The base currency code (e.g., 'USD', 'EUR')
 * @returns Query result with exchange rates data
 */
export function useExchangeRates(baseCurrency: string = 'USD') {
  // Use the cached exchange rates hook
  const {
    exchangeRates: cachedRates,
    isLoading: isCachedLoading,
    isError: isCachedError,
    error: cachedError,
    forceRefresh,
    lastFetchTime
  } = useCachedExchangeRates();

  // State to track if we need to convert the rates
  const [needsConversion, setNeedsConversion] = useState(baseCurrency !== 'USD');

  // State for the converted rates
  const [convertedRates, setConvertedRates] = useState<ExchangeRates | null>(null);

  // Convert the rates if needed
  useEffect(() => {
    if (!cachedRates || !needsConversion) return;

    // If the base currency is already what we want, no conversion needed
    if (cachedRates.baseCurrency === baseCurrency) {
      setConvertedRates(cachedRates);
      return;
    }

    // Convert the rates to the requested base currency
    try {
      // Get the rate for the requested base currency
      const baseRate = cachedRates.rates[baseCurrency];

      if (!baseRate) {
        console.error(`[EXCHANGE] Base currency ${baseCurrency} not found in rates`);
        setConvertedRates(null);
        return;
      }

      // Create new rates object with the requested base currency
      const newRates: Record<string, number> = {};

      // Convert each rate
      Object.entries(cachedRates.rates).forEach(([currency, rate]) => {
        newRates[currency] = rate / baseRate;
      });

      // Set the converted rates
      setConvertedRates({
        baseCurrency,
        rates: newRates,
        lastUpdated: cachedRates.lastUpdated,
        nextUpdate: cachedRates.nextUpdate
      });
    } catch (error) {
      console.error('[EXCHANGE] Error converting rates:', error);
      setConvertedRates(null);
    }
  }, [cachedRates, baseCurrency, needsConversion]);

  // Return the appropriate rates
  return {
    data: needsConversion ? convertedRates : cachedRates,
    isLoading: isCachedLoading,
    isError: isCachedError,
    error: cachedError,
    refetch: forceRefresh,
    lastFetchTime
  };
}

/**
 * Hook for converting between currencies
 * This hook uses the cached exchange rates to perform conversions
 * without making additional API calls
 *
 * @param fromCurrency The source currency code
 * @param toCurrency The target currency code
 * @returns Query result with conversion data
 */
export function useCurrencyConversion(fromCurrency: string, toCurrency: string) {
  // Use the cached exchange rates
  const {
    exchangeRates,
    isLoading,
    isError,
    error,
    getExchangeRate
  } = useCachedExchangeRates();

  // Get the conversion rate
  const rate = getExchangeRate(fromCurrency, toCurrency);

  // Create a conversion result
  const conversionResult: CurrencyConversion = {
    fromCurrency,
    toCurrency,
    rate: rate || 0,
  };

  return {
    data: conversionResult,
    isLoading,
    isError,
    error
  };
}

/**
 * Hook for converting a specific amount between currencies
 * This hook uses the cached exchange rates to perform conversions
 * without making additional API calls
 *
 * @param fromCurrency The source currency code
 * @param toCurrency The target currency code
 * @param amount The amount to convert
 * @returns Query result with conversion data including the converted amount
 */
export function useAmountConversion(fromCurrency: string, toCurrency: string, amount: number) {
  // Use the cached exchange rates
  const {
    exchangeRates,
    isLoading,
    isError,
    error,
    convertAmount
  } = useCachedExchangeRates();

  // Get the converted amount
  const convertedAmount = convertAmount(amount, fromCurrency, toCurrency);

  // Create a conversion result
  const conversionResult: CurrencyConversion = {
    fromCurrency,
    toCurrency,
    rate: convertAmount(1, fromCurrency, toCurrency) || 0,
    fromAmount: amount,
    toAmount: convertedAmount || 0
  };

  return {
    data: conversionResult,
    isLoading,
    isError,
    error,
    // Only consider it valid if we have a converted amount
    isValid: convertedAmount !== null
  };
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
