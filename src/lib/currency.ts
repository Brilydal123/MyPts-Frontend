import { ExchangeRates } from '@/lib/api/exchange-rate-api';

/**
 * Get the currency symbol for a given currency code
 * @param currencyCode The currency code (e.g., 'USD', 'EUR', 'GBP')
 * @returns The currency symbol (e.g., '$', '€', '£')
 */
export function getCurrencySymbol(currencyCode: string): string {
  const code = currencyCode.toUpperCase();

  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'INR': '₹',
    'RUB': '₽',
    'BRL': 'R$',
    'KRW': '₩',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF',
    'HKD': 'HK$',
    'SGD': 'S$',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'THB': '฿',
    'MXN': '$',
    'ZAR': 'R',
    'TRY': '₺',
    'NZD': 'NZ$',
    'XAF': 'FCFA',
    'NGN': '₦',
    'PKR': '₨',
  };

  return symbols[code] || code;
}

/**
 * Format a currency value with the appropriate symbol and decimal places
 * @param amount The amount to format
 * @param currencyCode The currency code (e.g., 'USD', 'EUR')
 * @param options Optional formatting options
 * @returns Formatted currency string (e.g., '$100.00', '€50.50')
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    preserveFullPrecision?: boolean;
  } = {}
): string {
  // Default options
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    preserveFullPrecision = false
  } = options;

  // For MyPts value display, preserve full precision if requested
  if (preserveFullPrecision) {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount}`;
  }

  // Special handling for certain currencies
  if (currencyCode === "XAF") {
    return `FCFA ${amount.toFixed(minimumFractionDigits)}`;
  } else if (currencyCode === "NGN") {
    return `₦${amount.toFixed(minimumFractionDigits)}`;
  } else if (currencyCode === "PKR") {
    return `₨${amount.toFixed(minimumFractionDigits)}`;
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  }
}

/**
 * Convert an amount from one currency to another using exchange rates
 * @param amount The amount to convert
 * @param fromCurrency The source currency code
 * @param toCurrency The target currency code
 * @param exchangeRates The exchange rates object
 * @returns The converted amount or null if conversion is not possible
 */
export function convertCurrency(
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

/**
 * Get the direct conversion value for MyPts to a specific currency
 *
 * NOTE: This function is now deprecated and should not be used directly.
 * It's kept for backward compatibility but will always return 0 to force
 * the use of actual exchange rates from the API.
 *
 * @param currency The target currency code
 * @returns Always returns 0 to force the use of actual exchange rates
 */
export function getDirectConversionValue(currency: string): number {
  // Return 0 to force the use of actual exchange rates from the API
  return 0;
}
