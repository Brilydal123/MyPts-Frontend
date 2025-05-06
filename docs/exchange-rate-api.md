# ExchangeRate-API Integration

This document describes the integration of the ExchangeRate-API for currency conversion in the MyPts application.

## Overview

The ExchangeRate-API is used to fetch real-time currency exchange rates for converting MyPts values to various currencies. This integration replaces the previous hardcoded conversion rates with dynamic, up-to-date rates from a reliable external source.

## Implementation Details

### API Service

The integration is implemented through a server-side API proxy to keep the API key secure. The following components are involved:

1. **Server-side API Routes**:
   - `/api/exchange-rates/latest/[currency]` - Fetches the latest exchange rates for a base currency
   - `/api/exchange-rates/pair/[fromCurrency]/[toCurrency]` - Fetches the conversion rate between two currencies
   - `/api/exchange-rates/pair/[fromCurrency]/[toCurrency]/[amount]` - Converts a specific amount between two currencies

2. **Client-side Service**:
   - `src/lib/api/exchange-rate-api.ts` - Client-side service for interacting with the API routes

3. **React Hooks**:
   - `src/hooks/use-exchange-rates.ts` - Custom hooks for fetching and using exchange rates in React components

4. **Utility Functions**:
   - `src/lib/currency.ts` - Utility functions for currency formatting and conversion

### Fallback Mechanism

The implementation includes a fallback mechanism to handle cases where the API is unavailable or rate limits are reached:

1. First, it attempts to fetch rates from the ExchangeRate-API
2. If that fails, it falls back to the hardcoded direct conversion rates
3. As a last resort, it uses the values from the MyPts value object

### Caching

To minimize API calls and improve performance, the implementation includes:

1. Server-side caching with a revalidation period of 1 hour
2. Client-side caching using React Query with a stale time of 1 hour

## Configuration

To use the ExchangeRate-API, you need to:

1. Sign up for an API key at [ExchangeRate-API](https://www.exchangerate-api.com/)
2. Add the API key to your environment variables:

```
EXCHANGERATE_API_KEY=your-api-key
```

## Usage

### In React Components

```tsx
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import { formatCurrency } from '@/lib/currency';

function MyComponent() {
  // Fetch exchange rates with USD as the base currency
  const { data: exchangeRates, isLoading } = useExchangeRates('USD');
  
  // Convert and format a value
  const formattedValue = exchangeRates 
    ? formatCurrency(amount * exchangeRates.rates['EUR'], 'EUR')
    : 'Loading...';
    
  return <div>{formattedValue}</div>;
}
```

### Direct Conversion

```tsx
import { convertCurrency } from '@/lib/currency';

// Convert 100 USD to EUR using exchange rates
const eurAmount = convertCurrency(100, 'USD', 'EUR', exchangeRates);
```

## Supported Currencies

The ExchangeRate-API supports 161 currencies. The most commonly used in our application are:

- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- XAF (Central African CFA Franc)
- NGN (Nigerian Naira)
- PKR (Pakistani Rupee)

For a full list of supported currencies, see the [ExchangeRate-API documentation](https://www.exchangerate-api.com/docs/supported-currencies).

## API Limits

The free plan of ExchangeRate-API has the following limitations:

- 1,500 API requests per month
- Exchange rates updated once per day

For production use, consider upgrading to a paid plan for more frequent updates and higher request limits.
