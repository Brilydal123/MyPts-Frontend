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
 * @returns Formatted currency string (e.g., '$100.00', '€50.50')
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  if (currencyCode === "XAF") {
    return `FCFA ${amount.toFixed(2)}`;
  } else if (currencyCode === "NGN") {
    return `₦${amount.toFixed(2)}`;
  } else if (currencyCode === "PKR") {
    return `₨${amount.toFixed(2)}`;
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
 * These are the preferred conversion rates specifically calibrated for MyPts
 * Each value represents how many units of the currency one MyPt is worth
 * For example: 1 MyPt = 13.61 XAF, 1 MyPt = 0.0208 EUR, etc.
 *
 * @param currency The target currency code
 * @returns The conversion rate or 0 if not available
 */
export function getDirectConversionValue(currency: string): number {
  const directConversions: Record<string, number> = {
    XAF: 13.61,    // 1 MyPt = 13.61 XAF
    EUR: 0.0208,   // 1 MyPt = 0.0208 EUR
    GBP: 0.0179,   // 1 MyPt = 0.0179 GBP
    NGN: 38.26,    // 1 MyPt = 38.26 NGN
    PKR: 6.74,     // 1 MyPt = 6.74 PKR
    USD: 0.024,    // 1 MyPt = 0.024 USD (Base value)
  };

  return directConversions[currency] || 0;
}
