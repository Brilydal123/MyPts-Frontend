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
  };
  
  return symbols[code] || code;
}
